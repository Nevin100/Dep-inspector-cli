import { ChatGroq } from "@langchain/groq";
import { config } from "dotenv";
config();
const model = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
});
// In-memory cache
const cache = new Map();
export async function analyzeWithAI(input) {
    try {
        if (cache.has(input)) {
            return cache.get(input);
        }
        const prompt = `
You are a senior software security engineer.

Analyze the following dependency issues:

${input}

Respond in this format:

1. Issue
2. Impact
3. Security Risk
4. Fix
5. Alternative
`;
        const res = await model.invoke(prompt);
        let finalOutput = "";
        if (typeof res.content === "string") {
            finalOutput = res.content.trim();
        }
        else {
            finalOutput = JSON.stringify(res.content, null, 2);
        }
        cache.set(input, finalOutput);
        return finalOutput;
    }
    catch {
        return "⚠️ AI analysis failed.";
    }
}
//# sourceMappingURL=ai.js.map