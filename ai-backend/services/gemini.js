import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function callGemini(prompt) {
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}