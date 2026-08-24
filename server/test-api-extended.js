import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hi");
    console.log(`Success with ${modelName}:`, result.response.text().substring(0, 20));
    return true;
  } catch (err) {
    console.log(`Failed with ${modelName}: STATUS ${err.status}`);
    return false;
  }
}

async function run() {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
  for (const m of models) {
    await testModel(m);
  }
}

run();
