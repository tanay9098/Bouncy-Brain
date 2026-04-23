import OpenAI from 'openai';
import { Response } from 'express';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  res: Response
): Promise<void> {
  const client = getClient();
  if (!client) {
    res.status(503).json({ error: 'AI service not configured' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

export async function chunkTask(
  title: string,
  description?: string,
  estimatedMinutes?: number
): Promise<Array<{ title: string }>> {
  const client = getClient();
  if (!client) {
    return [{ title: `${title} — part 1` }, { title: `${title} — part 2` }];
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Break this task into 3-6 actionable subtasks (each under 20 minutes):\n"${title}"${description ? `\nDescription: ${description}` : ''}${estimatedMinutes ? `\nEstimated time: ${estimatedMinutes} minutes` : ''}\n\nReturn JSON: [{"title": "subtask 1"}, {"title": "subtask 2"}]`,
        },
      ],
    });

    const content = response.choices[0].message.content || '[]';
    const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(stripped);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [{ title: `${title} — part 1` }, { title: `${title} — part 2` }];
  }
}
