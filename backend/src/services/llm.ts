import axios from 'axios';
import { LLMVerificationResponse, LLMVerdict } from '../types/index';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const callClaude = async (prompt: string, maxTokens: number): Promise<string> => {
  const response = await axios.post(
    CLAUDE_API_URL,
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }
  );
  return response.data.content[0].text;
};

const parseVerdict = (value: string): LLMVerdict => {
  const valid: LLMVerdict[] = ['CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'REQUIRES_CONTEXT'];
  return valid.includes(value as LLMVerdict) ? (value as LLMVerdict) : 'REQUIRES_CONTEXT';
};

export const verifyAnswerWithClaude = async (
  question: string,
  answer: string,
  category: string
): Promise<LLMVerificationResponse> => {
  const prompt = `
You are an expert fact-checker for educational content. Your job is to verify if an answer is correct.

Question (${category}): ${question}
Answer: ${answer}

Please analyze this answer and provide:
1. A verdict: CORRECT, PARTIALLY_CORRECT, INCORRECT, or REQUIRES_CONTEXT
2. A confidence score (0-100)
3. A brief explanation

Format your response as JSON:
{
  "verdict": "CORRECT|PARTIALLY_CORRECT|INCORRECT|REQUIRES_CONTEXT",
  "confidence": 85,
  "explanation": "..."
}
  `;

  try {
    const content = await callClaude(prompt, 500);
    const parsed = JSON.parse(content);
    return {
      verdict: parseVerdict(parsed.verdict),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      explanation: parsed.explanation || '',
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to verify answer with Claude');
  }
};

export const generateDailyQuestion = async (category: string): Promise<string> => {
  const prompt = `
Generate a relevant ${category} exam question for daily practice.
The question should be:
- Multiple choice with 4 options (A, B, C, D)
- Appropriately difficult
- Based on current curriculum

Format:
Question: [question text]
A) [option a]
B) [option b]
C) [option c]
D) [option d]
Correct Answer: [A/B/C/D]
Explanation: [brief explanation]
  `;

  try {
    return await callClaude(prompt, 1000);
  } catch (error) {
    console.error('Error generating daily question:', error);
    throw new Error('Failed to generate daily question');
  }
};

export const verifyAnswer = async (
  question: string,
  answer: string,
  category: string,
  correctAnswer?: string
): Promise<LLMVerificationResponse> => {
  if (!CLAUDE_API_KEY) {
    // Deterministic offline fallback so the core flow works without the API key.
    const isExact = correctAnswer !== undefined && answer.toUpperCase() === correctAnswer.toUpperCase();
    return {
      verdict: correctAnswer !== undefined ? (isExact ? 'CORRECT' : 'INCORRECT') : 'REQUIRES_CONTEXT',
      confidence: correctAnswer !== undefined ? 100 : 0,
      explanation: '',
    };
  }
  return verifyAnswerWithClaude(question, answer, category);
};
