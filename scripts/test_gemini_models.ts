import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyD3zsn92Xxflzroa2sF0ZXLEg7jGDX3dII";

async function main() {
    console.log("Checking models with Key:", API_KEY ? "Present" : "Missing");
    try {
        if (!API_KEY) throw new Error("No API Key");

        // Not all SDK versions support listModels directly on the client, usually it's on a specific manager
        // But let's try a direct fetch which is safer to debug raw availability
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available 'Flash' Models:");
            data.models.forEach((m: any) => {
                if (m.name.includes("flash")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.error("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

main();
