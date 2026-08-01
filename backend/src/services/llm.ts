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

export const isLlmConfigured = (): boolean => !!GEMINI_API_KEY;

export interface GeneratedQuestion {
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

// Generates a fresh, original MCQ on the same topic as a trusted reference
// question (e.g. a real PYQ or NCERT-sourced question), keeping the topic
// grounded in the reference's source so output stays credible.
export const generateQuestionVariant = async (exemplar: {
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string | null;
  source: string | null;
  type: string;
}): Promise<GeneratedQuestion> => {
  const prompt = `
You are a question writer for ${exemplar.type} exam preparation.

Here is a trusted reference question grounded in the source "${exemplar.source}":
Question: ${exemplar.question}
Options: ${exemplar.options}
Correct Answer: ${exemplar.correctAnswer}
Explanation: ${exemplar.explanation}

Write a NEW, original multiple-choice question on the SAME topic at a SIMILAR difficulty.
Do NOT copy the reference question or its options verbatim — create a fresh question that tests related knowledge from the same source.
Return JSON only:
{
  "question": "...",
  "options": [
    {"label": "A", "text": "..."},
    {"label": "B", "text": "..."},
    {"label": "C", "text": "..."},
    {"label": "D", "text": "..."}
  ],
  "correctAnswer": "A|B|C|D",
  "explanation": "..."
}
  `;

  try {
    const content = await callGemini(prompt, 700);
    const parsed = JSON.parse(extractJson(content));

    if (
      !parsed.question ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      !parsed.correctAnswer
    ) {
      throw new Error('Gemini returned a malformed question');
    }

    return {
      question: parsed.question,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation || '',
    };
  } catch (error) {
    console.error('Gemini question generation error:', error);
    throw new Error('Failed to generate question variant');
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
