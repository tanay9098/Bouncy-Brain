import { Request, Response, NextFunction } from 'express';
import { streamChatResponse, ChatMessage } from '../services/ai.service';

const SYSTEM_PROMPT = `You are Bouncy Brain, a friendly and focused AI study assistant.
You help students manage tasks, study effectively, and stay motivated.
Be concise, supportive, and practical.`;

export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages, system } = req.body as { messages: ChatMessage[]; system?: string };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' }); return;
    }
    await streamChatResponse(messages, system || SYSTEM_PROMPT, res);
  } catch (err) {
    if (res.headersSent) { res.end(); } else { next(err); }
  }
}

export async function healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ configured: !!process.env.OPENAI_API_KEY, model: 'gpt-4o' });
  } catch (err) { next(err); }
}
