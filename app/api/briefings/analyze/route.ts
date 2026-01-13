import { NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyD3zsn92Xxflzroa2sF0ZXLEg7jGDX3dII";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { image, context } = body;

        if (!API_KEY) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        // Construct prompt for Cosmetic Briefing
        const systemPrompt = `
      You are an expert Cosmetic Product Developer. 
      Analyze the provided image (which may be a reference product, moodboard, or texture) and the user's context description.
      
      Generate a detailed technical briefing in JSON format exactly matching this structure. 
      Do NOT return markdown fences, just the raw JSON.
      Infer missing details based on "Luxury/Premium" industry standards if not specified.
      
      CRITICAL LANGUAGE INSTRUCTION:
      - The output MUST be in SPANISH (Español).
      - EXCEPT for the "formula" (INCI names) which must remain in standard INCI nomenclature (Latin/English mix).
      - All other fields (claims, decoration, packaging description, quality tests) MUST be in Spanish.

      Structure:
      {
        "clientName": "string (Infer from context or default to 'Client')",
        "productName": "string (Creative name)",
        "category": "string (Facial, Corporal, Capilar, Solar, Higiene, Perfumería)",
        "unitsPerYear": "string (number)",
        "targetPrice": "string (number)",
        "distributionChannels": ["string"],
        "launchDate": "YYYY-MM-DD",
        "targetAudience": "string",
        "claims": "string (Marketing claims)",
        "benchmarkProduct": "string",
        "benchmarkUrl": "string",
        "formulaOwnership": "new",
        "targetBulkCost": "string (number)",
        "pao": "string (e.g. 12M)",
        "texture": "string",
        "color": "string",
        "fragrance": "string",
        "formula": [
          { 
            "name": "string (INCI Name)", 
            "percentage": "string (number)",
            "cost": "string (number, estimated €/kg)" 
          }
        ],
        "forbiddenIngredients": "string",
        "qualityTests": ["string (Select IDs from: stability, compatibility, challenge, clinical, dermatological, ophthalmological)"],
        "packagingType": "string (Select from: Jar, Bottle, Tube, Airless, Dropper)",
        "capacity": "string",
        "primaryMaterial": "string",
        "decoration": "string",
        "targetPricePrimary": "string",
        "supplierPrimary": "string",
        "secondaryPackaging": ["string (Select IDs from: FoldingBox, RigidBox, Cello, Spatula, Leaflet, SecurityLabel)"],
        "unitsPerBox": "string",
        "palletType": "string"
      }
      
      IMPORTANT Instructions for "formula":
      - Act as a Senior Formulator.
      - Generate a REALISTIC, COMPLETE qualitative formula (INCI list).
      - Include water (Aqua), functional ingredients (emulsifiers, preservatives), and ACTIVE ingredients.
      - Percentages must sum precisely to 100%. Use realistic ranges (e.g., Aqua ~60-80%, Preservatives <1%).
      - ESTIMATE the market cost (€/kg) for each raw material based on standard cosmetic industry bulk prices.
      
      IMPORTANT Instructions for "qualityTests" and "secondaryPackaging":
      - ONLY use the provided IDs (e.g., "stability", "FoldingBox"). Do not invent new keys.

      User Context: ${context}
    `;

        // Prepare payload for Gemini 1.5 Flash
        const payload = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt },
                        ...(image ? [{
                            inline_data: {
                                mime_type: "image/jpeg", // Assuming jpeg/png, standard for base64
                                data: image.split(',')[1] // Remove data:image/xxx;base64, prefix
                            }
                        }] : [])
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 8192, // Increased to prevent JSON truncation
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error Detail:", errorText);
            throw new Error(`Gemini API Error (${response.status} ${response.statusText}): ${errorText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("No content generated");
        }

        console.log("AI Raw Response:", generatedText.substring(0, 500) + "..."); // Log first 500 chars for debug

        // Clean markdown if present: extract JSON component

        // Clean markdown if present: extract JSON component
        let jsonStr = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            jsonStr = jsonStr.substring(start, end + 1);
        }

        const result = JSON.parse(jsonStr);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Analysis failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to analyze briefing' }, { status: 500 });
    }
}
