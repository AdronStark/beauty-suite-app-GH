import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyD3zsn92Xxflzroa2sF0ZXLEg7jGDX3dII";

async function main() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        fs.writeFileSync('models_debug.json', JSON.stringify(data, null, 2));
        console.log("Saved models to models_debug.json");

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
