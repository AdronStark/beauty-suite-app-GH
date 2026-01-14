
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Mock tools logic for the script (we don't need prisma for this connectivity test if we target Gemini API error)
const tools = [
    {
        functionDeclarations: [
            {
                name: "getOffersStats",
                description: "Returns the number of offers created within a date range or with a specific status.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        startDate: { type: SchemaType.STRING, description: "Start date in YYYY-MM-DD format" },
                        endDate: { type: SchemaType.STRING, description: "End date in YYYY-MM-DD format" },
                        status: { type: SchemaType.STRING, description: "Filter by status (e.g., 'Borrador', 'Enviada', 'Aceptada')" }
                    },
                }
            }
        ]
    }
];

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

async function main() {
    console.log("Debug Agent: Start");
    console.log("Key available:", !!apiKey, "Length:", apiKey?.length);

    if (!apiKey) {
        console.log("NO KEY");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const model = genAI.getGenerativeModel({
            model: "models/gemini-1.5-flash",
        });

        console.log("Model initialized. Starting chat...");
        const chat = model.startChat({
            history: [],
        });

        const result = await chat.sendMessage("Hola test");
        const response = await result.response;
        console.log("Response text:", response.text());

    } catch (e: any) {
        console.log("FULL ERROR LOGGING:"); // Use log, not error
        console.log(e.message);
        console.log(JSON.stringify(e, Object.getOwnPropertyNames(e)));
    }
}

main();
