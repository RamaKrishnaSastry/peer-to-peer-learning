import axios from 'axios';
import { LLMVerificationResponse, LLMVerdict } from '../types/index';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const callGemini = async (prompt: string, maxTokens: number): Promise<string> => {
  const response = await axios.post(
    GEMINI_API_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
      params: { key: GEMINI_API_KEY },
    }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned no content');
  }
  return text;
};

const parseVerdict = (value: string): LLMVerdict => {
  const valid: LLMVerdict[] = ['CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'REQUIRES_CONTEXT'];
  return valid.includes(value as LLMVerdict) ? (value as LLMVerdict) : 'REQUIRES_CONTEXT';
};

const extractJson = (text: string): string => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return match[0];
    throw new Error('No JSON object found in Gemini response');
  }
};

export const verifyAnswerWithGemini = async (
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
    const content = await callGemini(prompt, 500);
    const parsed = JSON.parse(extractJson(content));
    return {
      verdict: parseVerdict(parsed.verdict),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      explanation: parsed.explanation || '',
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to verify answer with Gemini');
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
    return await callGemini(prompt, 1000);
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
  if (!GEMINI_API_KEY) {
    // Deterministic offline fallback so the core flow works without the API key.
    const isExact = correctAnswer !== undefined && answer.toUpperCase() === correctAnswer.toUpperCase();
    return {
      verdict: correctAnswer !== undefined ? (isExact ? 'CORRECT' : 'INCORRECT') : 'REQUIRES_CONTEXT',
      confidence: correctAnswer !== undefined ? 100 : 0,
      explanation: '',
    };
  }
  return verifyAnswerWithGemini(question, answer, category);
};
