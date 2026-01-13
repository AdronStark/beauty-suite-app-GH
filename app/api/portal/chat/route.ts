import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyD3zsn92Xxflzroa2sF0ZXLEg7jGDX3dII";

// --- HELPER FUNCTIONS (REAL DB) ---
async function getOrders(clientName: string) {
    const activeOrders = await prisma.productionBlock.findMany({
        where: {
            clientName: { contains: clientName },
            status: { in: ['PENDING', 'PLANNED', 'PRODUCED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (activeOrders.length === 0) return "No pending orders found.";
    return activeOrders.map(o => `Order #${o.orderNumber || 'N/A'}: ${o.articleDesc} (${o.units} units) - Status: ${o.status}`).join('\n');
}

async function getProjects(clientName: string) {
    const activeProjects = await prisma.offer.findMany({
        where: {
            client: { contains: clientName },
            status: { not: 'Borrador' }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
    });

    if (activeProjects.length === 0) return "No active projects found.";
    return activeProjects.map(p => `Project: ${p.product} (Status: ${p.status})`).join('\n');
}

// --- REST API TOOLS DEFINITION ---
const toolsDefinition = [
    {
        function_declarations: [
            {
                name: "get_orders",
                description: "Get the list of active production orders for the client.",
                parameters: { type: "OBJECT", properties: {}, required: [] }
            },
            {
                name: "get_projects",
                description: "Get the status of ongoing R&D projects or offers.",
                parameters: { type: "OBJECT", properties: {}, required: [] }
            },
            {
                name: "human_handoff",
                description: "Escalate the conversation to a human agent (technical or commercial).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        department: { type: "STRING", enum: ["technical", "commercial"], description: "The department to contact." }
                    },
                    required: ["department"]
                }
            }
        ]
    }
];

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientName = session.user.connectedClientName;
        const body = await req.json();
        const { message, history } = body;

        console.log(`[Chat REST] Request from ${clientName}. Target Model: gemini-2.5-flash`);

        // --- FALLBACK IF NO API KEY ---
        if (!API_KEY) {
            const msgLower = message?.toLowerCase() || '';
            if (msgLower.includes('pedido')) {
                if (!clientName) return NextResponse.json({ response: 'No client associated.' });
                const orders = await getOrders(clientName);
                return NextResponse.json({ response: `(Fallback Mode) Your orders:\n${orders}`, type: 'text' });
            }
            if (msgLower.includes('proyecto')) {
                if (!clientName) return NextResponse.json({ response: 'No client associated.' });
                const projects = await getProjects(clientName);
                return NextResponse.json({ response: `(Fallback Mode) Your projects:\n${projects}`, type: 'text' });
            }
            return NextResponse.json({ response: 'I am in Fallback Mode (No API Key). Ask about orders or projects.' });
        }

        // --- BUILD CONVERSATION HISTORY ---
        // Explicitly type contents to allow function calls
        type Part = { text?: string; functionCall?: any; functionResponse?: any };
        type Content = { role: string; parts: Part[] };

        let contents: Content[] = [
            {
                role: "user",
                parts: [{ text: `System: You are the virtual assistant for the client '${clientName}'. You have access to their real data via tools. Answer concisely. If they ask about orders/projects, call the tool. If they are angry or ask for a person, call human_handoff.` }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am ready to help the client with their data." }]
            }
        ];

        // Append Current User Message
        contents.push({
            role: "user",
            parts: [{ text: message }]
        });

        // --- CALL GEMINI API (ROUND 1) ---
        // Explicitly targeting gemini-2.5-flash via REST, same as analyze/route.ts
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const response1 = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                tools: toolsDefinition
            })
        });

        if (!response1.ok) {
            const errText = await response1.text();
            throw new Error(`Gemini API Error 1: ${response1.status} ${errText}`);
        }

        const data1 = await response1.json();
        const candidate1 = data1.candidates?.[0];
        const contentPart1 = candidate1?.content?.parts?.[0];

        // CHECK FUNCTION CALL
        if (contentPart1?.functionCall) {
            const fc = contentPart1.functionCall;
            console.log(`[Chat REST] Tool Called: ${fc.name}`);

            let functionResult = "";

            if (fc.name === "get_orders") {
                functionResult = await getOrders(clientName || '');
            } else if (fc.name === "get_projects") {
                functionResult = await getProjects(clientName || '');
            } else if (fc.name === "human_handoff") {
                const dept = fc.args?.department || 'general';
                return NextResponse.json({
                    response: `Entiendo. Quieres hablar con el departamento ${dept === 'technical' ? 'Técnico' : 'Comercial'}.`,
                    type: 'options',
                    options: [
                        { label: `Contactar ${dept === 'technical' ? 'Técnico' : 'Ventas'}`, action: `contact_${dept === 'technical' ? 'tech' : 'sales'}` }
                    ]
                });
            }

            // Append Model's Function Call to history
            contents.push({
                role: "model",
                parts: [{ functionCall: fc }]
            });

            // Append Function Response to history
            contents.push({
                role: "function",
                parts: [{
                    functionResponse: {
                        name: fc.name,
                        response: { name: fc.name, content: functionResult }
                    }
                }]
            });

            // --- CALL GEMINI API (ROUND 2) ---
            const response2 = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    tools: toolsDefinition
                })
            });

            if (!response2.ok) {
                const errText2 = await response2.text();
                throw new Error(`Gemini API Error 2: ${response2.status} ${errText2}`);
            }

            const data2 = await response2.json();
            const finalText = data2.candidates?.[0]?.content?.parts?.[0]?.text;

            return NextResponse.json({ response: finalText || "No response generated.", type: 'text' });
        }

        // NO FUNCTION CALL - Just Text
        const textResponse = contentPart1?.text;
        return NextResponse.json({ response: textResponse || "No response.", type: 'text' });

    } catch (error: any) {
        console.error('SERVER CHAT ERROR:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        }, { status: 500 });
    }
}
