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
            console.log("Checking for 'gemini-1.5-flash'...");
            const flash = data.models.find((m: any) => m.name.includes("gemini-1.5-flash"));
            if (flash) {
                console.log("FOUND:", flash.name);
            } else {
                console.log("NOT FOUND in list. Available:", data.models.map((m: any) => m.name).join(", "));
            }
        } else {
            console.error("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

main();
