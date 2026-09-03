/**
 * Server-owned AI proxy. The browser submits only a visitor prompt.
 * Runs on Netlify's v2 Functions API so it can carry a custom route
 * (required for Netlify's native, platform-side function rate limiting).
 */
import { RESUME_CONTEXT } from '../../src/data/resumeData.js';

export const MAX_BODY_BYTES = 4 * 1024;
export const MAX_PROMPT_CHARS = 1000;
export const CHAT_RATE_LIMIT_MAX_REQUESTS = 10;
export const CHAT_RATE_LIMIT_WINDOW_SECONDS = 60;

export const SERVER_SYSTEM_PROMPT = `[IDENTITY]: You are the dedicated personal AI for Burak Tomruk, a Senior Software Engineer based in Munich, Germany. You represent ONLY the person described in the context below.
[ANTI-HALLUCINATION]: NEVER suggest Burak is an actor or any other celebrity. He is a Senior Software Engineer and full-stack developer with a frontend focus, with expertise in React, TypeScript, and Satellite TV systems.
[CONTEXT]: ${RESUME_CONTEXT}
[RULE]: Speak ONLY about the Software Engineer. ALWAYS reply in English. Keep answers extremely short and professional.
[RESPOND STYLE]: Enthusiastic, helpful, and concise.`;

export function validateChatRequest(body) {
  if (!body || typeof body !== 'object' || typeof body.prompt !== 'string') {
    return { ok: false, error: 'Invalid Request' };
  }
  const prompt = body.prompt.trim();
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
    return { ok: false, error: 'Invalid Request' };
  }
  return { ok: true, prompt };
}

export function resolveChatApiKey(env = process.env) {
  const rawKey = env.GEMINI_API_KEY;
  if (typeof rawKey !== 'string') return null;
  const key = rawKey.replace(/["']+/g, '').trim();
  return key && !key.startsWith('ey') ? key : null;
}

function jsonResponse(statusCode, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

export default async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(403, { error: 'Access Denied: Malformed Request' });
  }

  const rawBody = await req.text().catch(() => '');
  if (!rawBody) {
    return jsonResponse(403, { error: 'Access Denied: Malformed Request' });
  }

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Request Entity Too Large' });
  }

  try {
    const validation = validateChatRequest(JSON.parse(rawBody));
    if (!validation.ok) {
      return jsonResponse(400, { error: 'Invalid Configuration' });
    }

    const apiKey = resolveChatApiKey(process.env);
    if (!apiKey) {
      console.error('[Privacy Violation]: Server AI credential unavailable.');
      return jsonResponse(400, { error: 'Invalid Configuration' });
    }

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
      // Don't leak provider details; fail gracefully
      const errBody = await response.text().catch(() => '');
      console.error('[AI Proxy] Upstream error status:', response.status, 'body:', errBody.substring(0, 300));
      return jsonResponse(502, { error: 'AI Service Temporarily Unavailable' });
    }

    const data = await response.json();
    return jsonResponse(200, data);
  } catch (error) {
    console.error('[AI Proxy Critical Failure]:', error);
    // Fail Closed on Parse Errors
    return jsonResponse(500, { error: 'Infrastructure Error' });
  }
};

// Netlify's function bundler extracts this config via static analysis of the
// AST, not runtime evaluation -- these values must stay literal (not
// references to CHAT_RATE_LIMIT_MAX_REQUESTS/CHAT_RATE_LIMIT_WINDOW_SECONDS
// above) or the whole `rateLimit` block is silently dropped.
export const config = {
  path: '/api/chat',
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
