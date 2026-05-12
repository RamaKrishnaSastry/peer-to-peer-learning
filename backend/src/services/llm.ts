import axios from 'axios';
import { LLMVerificationResponse, LLMVerdict } from '../types/index';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export const verifyAnswerWithClaude = async (
  question: string,
  answer: string,
  category: string
): Promise<LLMVerificationResponse> => {
  try {
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

    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const content = response.data.content[0].text;
    const parsed = JSON.parse(content);

    return {
      verdict: parsed.verdict as LLMVerdict,
      confidence: parsed.confidence,
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to verify answer with Claude');
  }
};

export const generateDailyQuestion = async (category: string): Promise<string> => {
  try {
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

    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
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
  } catch (error) {
    console.error('Error generating daily question:', error);
    throw new Error('Failed to generate daily question');
  }
};
