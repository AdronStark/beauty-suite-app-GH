
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function testChat() {
    console.log('--- TEST 1: General Question (Knowledge Base) ---');
    await ask("¿Cómo creo una nueva oferta?");

    console.log('\n--- TEST 2: Data Question (Tool Call) ---');
    await ask("¿Cuántas ofertas hay en total?");
}

async function ask(question: string) {
    try {
        console.log(`User: ${question}`);
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: question }] })
        });
        const data = await res.json();
        console.log(`Assistant: ${data.reply}`);
    } catch (e) {
        console.error(e);
    }
}

testChat();
