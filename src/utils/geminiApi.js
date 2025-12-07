export const generateGeminiResponse = async (prompt, systemInstruction = "") => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("API Key missing! Please set VITE_GEMINI_API_KEY in your .env file or Netlify Environment Variables.");
    return "API key is missing! Please check your VITE_GEMINI_API_KEY environment variable in Netlify settings or your local .env file.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Connection issue. Please try again later.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection error. Please check your internet connection.";
  }
};