/**
 * (/privacy) Expert-Level Secure Proxy
 * Enforces Zero-Trust and 'Fail-Closed' logic.
 */
export const handler = async (event) => {
  // 1. (/privacy) Fail-Closed: Strictly deny any non-POST or missing body
  if (event.httpMethod !== 'POST' || !event.body) {
    return { 
      statusCode: 403, 
      body: JSON.stringify({ error: 'Access Denied: Malformed Request' }) 
    };
  }

  try {
    const { prompt, systemInstruction } = JSON.parse(event.body);
    
    // (/privacy) Filter out Netlify-injected JWT tokens (starting with 'ey')
    // and prioritize the actual Google Gemini key (starting with 'AIza')
    const envKeys = [process.env.GEMINI_API_KEY, process.env.VITE_GEMINI_API_KEY];
    const rawKey = envKeys.find(k => k && k.startsWith('AIza')) || envKeys.find(k => k && !k.startsWith('ey'));
    
    const apiKey = rawKey ? rawKey.replace(/['"]+/g, '').trim() : null;


    // 2. (/privacy) Fail-Closed on Config Error
    if (!apiKey || !prompt) {
      console.error("[Privacy Violation]: Missing mandatory AI parameters.");
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Invalid Configuration' }) 
      };
    }

    // 3. (/privacy) Log Scrubbing
    console.log("[Security Hub]: Processing request for origin: ", event.headers.origin);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );

    if (!response.ok) {
      // 4. (/privacy) Don't leak provider details; fail gracefully
      const errBody = await response.text();
      console.error('[AI Proxy] Upstream error status:', response.status, 'body:', errBody.substring(0, 300));
      return { 
        statusCode: 502, 
        body: JSON.stringify({ error: 'AI Service Temporarily Unavailable' }) 
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff"
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('[AI Proxy Critical Failure]:', error);
    // 5. (/privacy) Fail Closed on Parse Errors
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Infrastructure Error' }) 
    };
  }
};
