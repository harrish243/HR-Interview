import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  console.log("Testing API Key:", process.env.GEMINI_API_KEY?.substring(0, 7) + "...");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = "Say 'Hello, I am working!' if you can hear me.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Success:", text);
  } catch (err) {
    console.error("API Test Failed Error:");
    console.error(err);
  }
}

run();
