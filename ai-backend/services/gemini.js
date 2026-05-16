import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function callGemini(prompt) {
  // Use gemini-2.0-flash which is the latest stable model
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}