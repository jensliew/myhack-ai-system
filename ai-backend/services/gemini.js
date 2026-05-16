import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function callGemini(prompt) {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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