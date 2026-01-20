import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAppManual } from "@/lib/ai/knowledgeBase";
import { toolsDefinition, toolsImplementation } from "@/lib/ai/tools";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
    // Auth check
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting - 10 requests per minute per user
    const response = new NextResponse();
    const userId = session.user.email || session.user.name || 'anonymous';
    if (limiter.check(response, 10, userId)) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
    }

    if (!process.env.GOOGLE_API_KEY) {
        return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    try {
        const { messages } = await req.json();

        // 1. Setup Gemini
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: toolsDefinition,
            systemInstruction: `Eres un asistente experto en la aplicación "Beauty App Suite" (Gestión de laboratorio cosmético).
            
            TU TRABAJO:
            1. Ayudar a los usuarios a usar la app explicando cómo funcionan los módulos (Ofertas, Fórmulas, etc.).
            2. Consultar datos reales de la base de datos usando las herramientas disponibles cuando el usuario pregunte por estadísticas o datos (ej: "cuantas ofertas hay?").
            
            MANUAL DE USUARIO (CONOCIMIENTO):
            ${getAppManual()}
            
            REGLAS:
            - Sé breve, amable y profesional.
            - Si te preguntan algo que requiere datos, USA LA HERRAMIENTA. No inventes números.
            - Si no sabes algo, dilo.
            `
        });

        // 2. Start Chat
        // Convert stored messages to Gemini format
        // We trim history to avoid token limits if needed, usually last 10 is fine
        const chatHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history: chatHistory,
        });

        // 3. Send Message
        const result = await chat.sendMessage(lastMessage);
        const response = result.response;

        // 4. Handle Tool Calls
        const call = response.functionCalls();
        if (call && call.length > 0) {
            // Execute the function
            const firstCall = call[0];
            const fnName = firstCall.name;
            const args = firstCall.args;

            console.log(`[AI] Calling tool: ${fnName}`, args);

            let toolResultStr = '';
            if ((toolsImplementation as any)[fnName]) {
                toolResultStr = await (toolsImplementation as any)[fnName](args);
            } else {
                toolResultStr = "Error: Herramienta no encontrada.";
            }

            // Feed result back to model
            const result2 = await chat.sendMessage([{
                functionResponse: {
                    name: fnName,
                    response: { result: toolResultStr }
                }
            }]);

            return NextResponse.json({ reply: result2.response.text() });
        }

        // Normal text response
        return NextResponse.json({ reply: response.text() });

    } catch (error: any) {
        console.error("Chat Generic Error:", error);
        // Log deep error details if available
        if (error.response) {
            console.error("Gemini Response Error:", await error.response.text());
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
