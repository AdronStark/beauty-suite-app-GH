
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Helper to log debug info (only name, not args for privacy)
const debugLog = (msg: string, ...args: any[]) => {
    // In production, avoid logging args unless necessary for debugging errors
    if (process.env.NODE_ENV === 'development') {
        console.log(`[AI-AGENT] ${msg}`, ...args);
    } else {
        console.log(`[AI-AGENT] ${msg}`);
    }
};

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// --- Tool Logic (Same as before) ---
async function getOffersStats(args: { startDate?: string, endDate?: string, status?: string }) {
    debugLog("Tool call: getOffersStats", args);
    try {
        const where: any = {};
        if (args.startDate || args.endDate) {
            where.createdAt = {};
            if (args.startDate) where.createdAt.gte = new Date(args.startDate);
            if (args.endDate) where.createdAt.lte = new Date(args.endDate);
        }
        if (args.status) {
            where.status = { contains: args.status };
        }
        const count = await prisma.offer.count({ where });
        return { count, filter: args, message: `Found ${count} offers matching criteria.` };
    } catch (error) {
        console.error("Error in getOffersStats:", error);
        return { error: "Failed to fetch offer stats." };
    }
}

async function getClientStats(args: { countOnly?: boolean, name?: string }) {
    debugLog("Tool call: getClientStats", args);
    try {
        if (args.name) {
            const clients = await prisma.client.findMany({
                where: { name: { contains: args.name } },
                select: { name: true, businessName: true, source: true }
            });
            return { clients, count: clients.length };
        }
        const count = await prisma.client.count();
        return { count, totalClients: count };
    } catch (error) {
        return { error: "Failed to fetch client stats." };
    }
}

// REST Tool Definitions
const toolConfig = {
    function_declarations: [
        {
            name: "getOffersStats",
            description: "Returns the number of offers created within a date range or with a specific status.",
            parameters: {
                type: "OBJECT",
                properties: {
                    startDate: { type: "STRING", description: "Start date in YYYY-MM-DD format" },
                    endDate: { type: "STRING", description: "End date in YYYY-MM-DD format" },
                    status: { type: "STRING", description: "Filter by status (e.g., 'Borrador', 'Enviada', 'Aceptada')" }
                },
            }
        },
        {
            name: "getClientStats",
            description: "Returns statistics about clients or searches for specific clients.",
            parameters: {
                type: "OBJECT",
                properties: {
                    countOnly: { type: "BOOLEAN", description: "If true, returns only the total count of clients." },
                    name: { type: "STRING", description: "Search for a client by name." }
                },
            }
        }
    ]
};

// --- REST Helper ---

async function callGemini(contents: any[], tools: any[] = []) {
    if (!API_KEY) throw new Error("Missing API Key");

    const body: any = {
        contents: contents,
        system_instruction: {
            parts: [{
                text: `You are 'BeautyConfig AI', an intelligent assistant for the Labery Beauty App Suite.
      
      Your purpose is to help workers (chemists, sales, managers) with:
      1. Using the application (Briefings, Offers, Formulas, Planner, CRM).
      2. Retrieving data and statistics (e.g., "How many offers did we send last month?").
      
      You have access to REAL-TIME data via tools. 
      - ALWAYS use 'getOffersStats' if the user asks for offer counts, volume, or specific status counts.
      - ALWAYS use 'getClientStats' for client related queries.
      
      When specifying dates for tools, use YYYY-MM-DD format. Today is ${new Date().toISOString().split('T')[0]}.
      
      Be profesional, concise, and helpful. Respond in Spanish (Español).` }]
        }
    };

    if (tools.length > 0) {
        body.tools = tools;
    }

    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 404) {
            throw new Error("Model not found or API key lacks access to this model. Check Google Cloud Console.");
        }
        throw new Error(`Gemini API Error ${response.status}: ${errText}`);
    }

    return await response.json();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { history, message } = body;

        // Convert history from simple structure to Gemini REST structure if needed
        // Expecting frontend to send: { role: 'user'|'model', text }
        // Gemini REST expects: { role: 'user'|'model', parts: [{ text: ... }] }
        // AgentChat already sends 'parts'. But check role 'model' vs 'function'.

        // Ensure history structure
        const formattedHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: msg.parts || [{ text: msg.text }]
        }));

        // Add current message
        formattedHistory.push({
            role: "user",
            parts: [{ text: message }]
        });

        const toolsList = [toolConfig];

        // 1. First Call
        let data = await callGemini(formattedHistory, toolsList);

        // Check for function calls
        // Response structure: candidates[0].content.parts[0].functionCall
        let candidate = data.candidates?.[0];
        let content = candidate?.content;
        let parts = content?.parts || [];

        const functionCalls = parts.filter((p: any) => p.functionCall);

        if (functionCalls.length > 0) {
            // Add the model's response (with function call) to history to maintain context
            formattedHistory.push(content);

            // Execute tools
            // We need to send a "functionResponse" part back in a new turn
            const toolResponses = [];

            for (const part of functionCalls) {
                const call = part.functionCall;
                debugLog(`Executing Tool: ${call.name}`);

                let result = {};
                if (call.name === "getOffersStats") {
                    result = await getOffersStats(call.args);
                } else if (call.name === "getClientStats") {
                    result = await getClientStats(call.args);
                } else {
                    result = { error: "Unknown tool" };
                }

                toolResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { name: call.name, content: result } // Gemini expects 'response' field often as object
                    }
                });
            }

            // Send tool results back
            formattedHistory.push({
                role: "function",
                parts: toolResponses
            });

            // 2. Second Call (Follow-up)
            data = await callGemini(formattedHistory, toolsList);
            candidate = data.candidates?.[0];
            parts = candidate?.content?.parts || [];
        }

        const text = parts.map((p: any) => p.text).join('') || "No text response";

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("AI Agent Error:", error);
        return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 });
    }
}
