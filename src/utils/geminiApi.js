/**
 * (/ai-product) Gemini Client Hardening
 * Strictly enforces Knowledge-Base rules on Instruction vs Context separation.
 * Target: Low Latency, High Security, Token Efficiency.
 */

// (/pilot) Client-side Request Cache with TTL and Max Size
const chatCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 Minutes
const MAX_CACHE_SIZE = 100;

export const generateGeminiResponse = async (prompt, systemInstruction = "") => {
  const cacheKey = `${prompt.trim()}:${systemInstruction.trim()}`;
  
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
        prompt: prompt.trim(), // Context Layer
        systemInstruction: systemInstruction.trim() // Instruction Layer
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
export const streamGeminiResponse = async (prompt, systemInstruction = "", onChunk) => {
  try {
    const result = await generateGeminiResponse(prompt, systemInstruction);
    onChunk(result);
  } catch (err) {
    onChunk("The AI is briefly offline. Please try again in 30 seconds.");
  }
};