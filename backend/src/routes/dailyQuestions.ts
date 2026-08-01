import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import prisma from '../db';
import { getTodaysQuestion, getQuestionHistory, parseOptions } from '../services/dailyQuestions';
import { verifyAnswer } from '../services/llm';
import { updateStreak, recalculateUserStats, awardBadge } from '../services/engagement';

const router = Router();

const VALID_TYPES = ['UPSC', 'JEE', 'Finance'];

// Get today's question for a domain
router.get('/today/:type', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be one of UPSC, JEE, Finance',
      });
    }

    const question = await getTodaysQuestion(type, req.userId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'No daily question available yet',
      });
    }

    return res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Get today question error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch daily question',
    });
  }
});

// Get question history with attempts
router.get('/history/:type', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be one of UPSC, JEE, Finance',
      });
    }

    const history = await getQuestionHistory(type);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch question history',
    });
  }
});

// Submit an answer to a daily question
router.post('/:id/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const selectedAnswer = (req.body.selectedAnswer || '').toUpperCase();

    if (!selectedAnswer) {
      return res.status(400).json({
        success: false,
        error: 'selectedAnswer is required',
      });
    }

    const question = await prisma.dailyQuestion.findUnique({ where: { id } });
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    const validLabels = parseOptions(question.options).map((o) => o.label.toUpperCase());
    if (!validLabels.includes(selectedAnswer)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answer option',
      });
    }

    const existing = await prisma.questionAttempt.findUnique({
      where: { userId_questionId: { userId: req.userId!, questionId: id } },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You have already answered this question',
        data: existing,
      });
    }

    const isCorrect = selectedAnswer === question.correctAnswer.toUpperCase();

    // Give the LLM the option text, not just the bare letter, so the verdict
    // is actually verifiable.
    const selectedOption = parseOptions(question.options).find(
      (o) => o.label.toUpperCase() === selectedAnswer
    );
    const answerForVerification = selectedOption
      ? `${selectedOption.label}) ${selectedOption.text}`
      : selectedAnswer;

    const verification = await verifyAnswer(
      question.question,
      answerForVerification,
      question.type,
      question.correctAnswer
    );

    const attempt = await prisma.questionAttempt.create({
      data: {
        userId: req.userId!,
        questionId: id,
        selectedAnswer,
        isCorrect,
        verdict: verification.verdict,
        explanation: verification.explanation || question.explanation,
      },
    });

    const streak = await updateStreak(req.userId!);
    await recalculateUserStats(req.userId!);
    await awardBadge(req.userId!, 'first-step');
    if (streak.currentStreak >= 7) {
      await awardBadge(req.userId!, 'streak-7');
    }

    return res.status(201).json({
      success: true,
      data: {
        attempt,
        correctAnswer: question.correctAnswer,
        streak: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
        },
      },
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit answer',
    });
  }
});

export default router;
