/**
 * (/privacy) Expert-Level Secure Proxy
 * Enforces Zero-Trust and 'Fail-Closed' logic.
 * The system prompt is server-owned: any client-supplied
 * "systemInstruction" is deliberately ignored.
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  hasValidHttpUrl,
  resolveOptionalRedisToken,
} from "../../src/shared/githubStats.js";
import { RESUME_CONTEXT } from "../../src/data/resumeData.js";

export const MAX_BODY_BYTES = 4 * 1024;
export const MAX_PROMPT_CHARS = 1000;
export const CHAT_RATE_LIMIT_MAX_REQUESTS = 10;
export const CHAT_RATE_LIMIT_WINDOW_SECONDS = 60;

export const SERVER_SYSTEM_PROMPT = `[IDENTITY]: You are the dedicated personal AI for Burak Tomruk, a Senior Software Engineer based in Munich, Germany. You represent ONLY the person described in the context below.
[ANTI-HALLUCINATION]: NEVER suggest Burak is an actor or any other celebrity. He is a Senior Software Engineer and full-stack developer with a frontend focus, with expertise in React, TypeScript, and Satellite TV systems.
[CONTEXT]: ${RESUME_CONTEXT}.
[RULE]: Speak ONLY about the Software Engineer. ALWAYS reply in English. Keep answers extremely short and professional.
[RESPOND STYLE]: Enthusiastic, helpful, and concise.`;

export function validateChatRequest(body) {
  if (!body || typeof body !== "object" || typeof body.prompt !== "string") {
    return { ok: false, error: "Invalid Request" };
  }

  const prompt = body.prompt.trim();
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
    return { ok: false, error: "Invalid Request" };
  }

  return { ok: true, prompt };
}

export function resolveChatApiKey(env = process.env) {
  const rawKey = env.GEMINI_API_KEY;
  if (typeof rawKey !== "string") {
    return null;
  }

  // (/privacy) Filter out Netlify-injected JWT tokens (starting with 'ey')
  const cleaned = rawKey.replace(/['"]+/g, "").trim();
  if (!cleaned || cleaned.startsWith("ey")) {
    return null;
  }

  return cleaned;
}

function getHeaderValue(headers, name) {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const targetHeader = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === name.toLowerCase(),
  );

  return targetHeader ? headers[targetHeader] : undefined;
}

function getClientIp(event) {
  const netlifyIp = getHeaderValue(event.headers, "x-nf-client-connection-ip");
  if (typeof netlifyIp === "string" && netlifyIp.trim() !== "") {
    return netlifyIp.trim();
  }

  const forwardedFor = getHeaderValue(event.headers, "x-forwarded-for");
  if (typeof forwardedFor === "string" && forwardedFor.trim() !== "") {
    return forwardedFor.split(",")[0].trim();
  }

  return "127.0.0.1";
}

let chatRatelimit = null;
let chatRatelimitInitialized = false;

function getChatRatelimit() {
  if (!chatRatelimitInitialized) {
    chatRatelimitInitialized = true;
    const redisUrl = hasValidHttpUrl(process.env.UPSTASH_REDIS_REST_URL)
      ? process.env.UPSTASH_REDIS_REST_URL
      : undefined;
    const redisToken = resolveOptionalRedisToken(process.env.UPSTASH_REDIS_REST_TOKEN);
    if (redisUrl && redisToken) {
      chatRatelimit = new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(
          CHAT_RATE_LIMIT_MAX_REQUESTS,
          `${CHAT_RATE_LIMIT_WINDOW_SECONDS} s`,
        ),
        analytics: true,
        prefix: "rl_portfolio_chat",
      });
    }
  }

  return chatRatelimit;
}

function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  // 1. (/privacy) Fail-Closed: Strictly deny any non-POST or missing body
  if (event.httpMethod !== 'POST' || !event.body) {
    return jsonResponse(403, { error: 'Access Denied: Malformed Request' });
  }

  // 2. (/privacy) Reject oversized payloads before parsing (UTF-8 bytes,
  // not UTF-16 code units)
  if (Buffer.byteLength(event.body, "utf8") > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Request Entity Too Large' });
  }

  // 3. (/privacy) Server-side abuse protection; the client-side message cap
  // is UX only and can be bypassed, so the real limit is enforced here.
  const ratelimit = getChatRatelimit();
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(`ip_${getClientIp(event)}`);
      if (!success) {
        return jsonResponse(
          429,
          { error: 'Too many requests. Try again shortly.' },
          { "Retry-After": String(CHAT_RATE_LIMIT_WINDOW_SECONDS) },
        );
      }
    } catch (error) {
      console.error('[AI Proxy]: Rate limiter unavailable; request allowed.', error?.message);
    }
  }

  try {
    const validation = validateChatRequest(JSON.parse(event.body));

    // 4. (/privacy) Fail-Closed on invalid or overlong prompts
    if (!validation.ok) {
      console.error("[Privacy Violation]: Missing mandatory AI parameters.");
      return jsonResponse(400, { error: 'Invalid Configuration' });
    }

    const apiKey = resolveChatApiKey(process.env);
    if (!apiKey) {
      console.error("[Privacy Violation]: Server AI credential unavailable.");
      return jsonResponse(400, { error: 'Invalid Configuration' });
    }

    // 5. (/privacy) Log Scrubbing
    console.log("[Security Hub]: Processing request for origin: ", event.headers.origin);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: validation.prompt }] }],
          systemInstruction: { parts: [{ text: SERVER_SYSTEM_PROMPT }] },
        }),
      }
    );

    if (!response.ok) {
      // 6. (/privacy) Don't leak provider details; fail gracefully
      const errBody = await response.text().catch(() => "");
      console.error('[AI Proxy] Upstream error status:', response.status, 'body:', errBody.substring(0, 300));
      return jsonResponse(502, { error: 'AI Service Temporarily Unavailable' });
    }

    const data = await response.json();
    return jsonResponse(200, data);
  } catch (error) {
    console.error('[AI Proxy Critical Failure]:', error);
    // 7. (/privacy) Fail Closed on Parse Errors
    return jsonResponse(500, { error: 'Infrastructure Error' });
  }
};
