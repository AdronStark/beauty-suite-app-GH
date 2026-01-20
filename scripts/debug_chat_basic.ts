
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: '.env' });

async function debugModel() {
    if (!process.env.GOOGLE_API_KEY) {
        console.error("Missing API Key");
        return;
    }

    try {
        console.log("Initializing Gemini (Basic)...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Model initialized. Sending message...");
        const result = await model.generateContent("Hola, ¿estás funcionando?");
        console.log("Response:", result.response.text());

    } catch (e: any) {
        console.error("FULL ERROR:", JSON.stringify(e, null, 2));
        console.error("ERROR MESSAGE:", e.message);
    }
}

debugModel();
