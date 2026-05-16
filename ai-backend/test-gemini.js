import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testGemini() {
  try {
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,      {
        contents: [
          {
            parts: [
              { text: "Say hello in JSON format with a message field" }
            ]
          }
        ]
      }
    );

    console.log(
      response.data.candidates[0].content.parts[0].text
    );
  } catch (err) {
    console.log("Error:", err.response?.data || err.message);
  }
}

testGemini();