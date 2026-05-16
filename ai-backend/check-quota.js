import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function checkQuota() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env");
    process.exit(1);
  }

  console.log("🔍 Checking Gemini API Key and Quota...\n");
  console.log(`API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);

  try {
    // Test 1: List available models
    console.log("\n📋 Available Models:");
    const modelsResponse = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    const models = modelsResponse.data.models || [];
    models.forEach(model => {
      console.log(`  ✓ ${model.name}`);
    });

    // Test 2: Try a simple API call to check if key is valid
    console.log("\n🧪 Testing API Call...");
    const testResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: "Say 'API key is valid'" }]
          }
        ]
      }
    );

    console.log("✅ API Key is VALID and working!");
    console.log(`   Response: ${testResponse.data.candidates[0].content.parts[0].text}`);

    // Test 3: Check quota info from response headers
    console.log("\n📊 Quota Information:");
    const quotaHeaders = {
      "x-goog-request-params": testResponse.headers["x-goog-request-params"],
      "x-goog-api-client": testResponse.headers["x-goog-api-client"],
    };
    console.log(JSON.stringify(quotaHeaders, null, 2));

  } catch (error) {
    console.error("❌ Error:", error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 429) {
      console.error("\n⚠️  QUOTA EXCEEDED!");
      console.error("   You've hit the rate limit. Wait a few minutes and try again.");
    } else if (error.response?.status === 400) {
      console.error("\n⚠️  INVALID API KEY!");
      console.error("   The API key is not valid or not linked to a billing account.");
    } else if (error.response?.status === 403) {
      console.error("\n⚠️  PERMISSION DENIED!");
      console.error("   The API key doesn't have permission to use Gemini API.");
    }
    
    console.error("\nFull error details:");
    console.error(JSON.stringify(error.response?.data, null, 2));
  }
}

checkQuota();
