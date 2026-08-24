import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
     // Direct fetch to list models API
     const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
     const response = await fetch(url);
     const data = await response.json();
     console.log("Available Models:", data.models?.map(m => m.name));
  } catch (err) {
    console.error("List Models Failed:", err);
  }
}

run();
