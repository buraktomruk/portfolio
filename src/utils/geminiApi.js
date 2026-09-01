/**
 * (/ai-product) Gemini Client Hardening
 * Only the user prompt leaves the browser; the system prompt is owned by
 * the server proxy (netlify/functions/chat.js) and cannot be influenced
 * by client code.
 * Target: Low Latency, High Security, Token Efficiency.
 */

// (/pilot) Client-side Request Cache with TTL and Max Size
const chatCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 Minutes
const MAX_CACHE_SIZE = 100;

export const generateGeminiResponse = async (prompt) => {
  const context = prompt.trim();
  const cacheKey = context;

  // (/pilot) Check and prune expired cache
  if (chatCache.has(cacheKey)) {
    const { value, expiry } = chatCache.get(cacheKey);
    if (Date.now() < expiry) {
      console.log("[AIProduct Cache] Hit for query: ", prompt.substring(0, 15));
      return value;
    }
    chatCache.delete(cacheKey);
  }

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: context, // Context Layer only
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway Status: ${response.status}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No AI feedback available.";
    
    // (/pilot) Cache Pruning (LRU style)
    if (chatCache.size >= MAX_CACHE_SIZE) {
      const firstEntry = chatCache.keys().next().value;
      chatCache.delete(firstEntry);
    }
    
    // (/pilot) Cache with Expiry
    chatCache.set(cacheKey, { 
      value: result, 
      expiry: Date.now() + CACHE_TTL 
    });
    return result;
  } catch (error) {
    console.error("[AIProduct Failure]:", error);
    throw error;
  }
};

/**
 * (/ai-product) SSE/Streaming Fallback
 * Current architecture uses Netlify Function Proxy.
 */
export const streamGeminiResponse = async (prompt, onChunk) => {
  try {
    const result = await generateGeminiResponse(prompt);
    onChunk(result);
  } catch (err) {
    onChunk("The AI is briefly offline. Please try again in 30 seconds.");
  }
};