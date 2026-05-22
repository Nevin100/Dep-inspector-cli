import Groq from "groq-sdk";
import { config } from "dotenv";
config();
const cache = new Map();
export async function analyzeWithAI(input) {
    try {
        if (cache.has(input))
            return cache.get(input);
        const client = new Groq({ apiKey: process.env["GROQ_API_KEY"] });
        const prompt = `
You are a senior software security engineer with 10+ years of experience.
Provide detailed and actionable insights for each issue found.

Analyze the following:
${input}

Respond in this format:
1. Issue
2. Impact
3. Security Risk
4. Fix
5. Alternative
`;
        const res = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.3,
        });
        const output = res.choices[0]?.message?.content?.trim() ?? "⚠️ No response";
        cache.set(input, output);
        return output;
    }
    catch {
        return "⚠️ AI analysis failed.";
    }
}
//# sourceMappingURL=ai.js.map