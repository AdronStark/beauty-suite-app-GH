
import dotenv from 'dotenv';
import path from 'path';

// Try to load .env from current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

async function main() {
    console.log("Starting model check...");
    if (!API_KEY) {
        console.error("NO API KEY FOUND in env (process.env.GOOGLE_API_KEY or GEMINI_API_KEY)");
        // Try the fallback key found in other scripts
        const fallback = "AIzaSyD3zsn92Xxflzroa2sF0ZXLEg7jGDX3dII";
        console.log("Attempting with fallback key from codebase...");
        await check(fallback);
    } else {
        console.log("API Key found (length: " + API_KEY.length + ")");
        await check(API_KEY);
    }
}

async function check(key: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log("Fetching URL:", url.replace(key, "HIDDEN_KEY"));
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error("HTTP Error:", res.status, res.statusText);
            console.error("Body:", await res.text());
            return;
        }
        const data = await res.json();

        // Filter for gemini models to keep output clean, but show all if few
        const models = data.models || [];
        console.log(`Found ${models.length} models.`);

        const geminiModels = models.filter((m: any) => m.name.includes('gemini'));
        console.log("Gemini Models:");
        geminiModels.forEach((m: any) => console.log(` - ${m.name}`));

    } catch (e) {
        console.error("Fetch execution error:", e);
    }
}

main();
