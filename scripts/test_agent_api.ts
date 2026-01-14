
import dotenv from 'dotenv';
dotenv.config();

// Access the API handler directly if possible, or easier: mock the fetch against localhost if server is running,
// OR just invoke the logic directly. 
// Since Next.js API routes are exported functions, we can try to import it, but we need to mock Request/Response objects.
// A cleaner way for integration testing is to just use 'fetch' against the running dev server.

const BASE_URL = "http://localhost:3000/api/agent";

async function testAgent() {
    console.log("Starting Agent API Test...");

    // Test 1: General Message
    console.log("\n--- Test 1: General Greeting ---");
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hola, ¿cómo estás?",
                history: []
            })
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test 1 Failed:", e);
    }

    // Test 2: Tool Call (Stats)
    console.log("\n--- Test 2: Tool Call (Offers Stats) ---");
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Cuantas ofertas tenemos en total?",
                history: []
            })
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test 2 Failed:", e);
    }
}

testAgent();
