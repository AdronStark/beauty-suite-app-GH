
const https = require('https');

// Read directly from .env if possible, or use the fallback (which might be the issue if invalid)
// But node scripts don't read .env automatically without dotenv. 
// I'll grab the key from the file content if I can, but ideally the user has set it.
// For now, I'll rely on the one hardcoded in the previous step or assume the env var is set if running with next/dotenv (which this isn't).
// I will blindly read the .env file line to find the key to be sure.

const fs = require('fs');
const path = require('path');

let apiKey = "AIzaSyD3zsn92Xxflzroa2sF0ZXLEg7jGDX3dII"; // Default fallback
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
        if (match && match[1]) {
            apiKey = match[1].trim();
            console.log("Using API Key from .env");
        }
    }
} catch (e) {
    console.log("Could not read .env, using fallback");
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Querying: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", JSON.stringify(json.error, null, 2));
            } else if (json.models) {
                console.log("\nAVAILABLE MODELS:");
                json.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log("No models found or unexpected format:", JSON.stringify(json, null, 2));
            }
        } catch (e) { console.error("Parse Error:", e.message, "\nExceprt:", data.substring(0, 100)); }
    });
}).on('error', e => console.error("Req Error:", e.message));
