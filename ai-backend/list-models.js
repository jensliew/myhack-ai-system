import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );

    console.log("AVAILABLE MODELS:");
    console.log(response.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
}

listModels();