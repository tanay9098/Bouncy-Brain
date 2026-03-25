const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function chunkTask(text) {
  const prompt = `
You are an ADHD productivity assistant.

Break this task into small actionable steps.

Rules:
- 3 to 6 steps
- Each step <= 20 minutes
- Keep it simple

Task:
"${text}"

Return JSON:
["step1", "step2", "step3"]
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch {
    return content.split("\n").filter(Boolean);
  }
}

module.exports = { chunkTask };