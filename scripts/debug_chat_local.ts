
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toolsDefinition } from "@/lib/ai/tools";

dotenv.config({ path: '.env' });

async function debugModel() {
    if (!process.env.GOOGLE_API_KEY) {
        console.error("Missing API Key");
        return;
    }

    try {
        console.log("Initializing Gemini...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: toolsDefinition as any
        });

        console.log("Model initialized. Starting chat...");
        const chat = model.startChat({
            history: []
        });

        const result = await chat.sendMessage("Hola");
        console.log("Response:", result.response.text());

    } catch (e: any) {
        console.error("ERROR INITIALIZING MODEL:", JSON.stringify(e, null, 2));
        if (e.message) console.error("Message:", e.message);
    }
}

debugModel();
