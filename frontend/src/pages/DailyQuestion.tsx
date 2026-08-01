import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { getErrorMessage } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";

interface QuestionOption {
  label: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string | null;
  source: string | null;
  type: string;
  attempted: boolean;
  myAttempt?: {
    selectedAnswer: string;
    isCorrect: boolean;
    verdict: string | null;
    explanation: string | null;
  } | null;
}

const TYPES = ["UPSC", "JEE", "Finance"] as const;

export const DailyQuestionPage = () => {
  const { isAuthenticated, user } = useAuth();
  const domain = user?.domain;
  const [activeType, setActiveType] = useState<string>(domain ?? "UPSC");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [streak, setStreak] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const activeDomain = domain ?? activeType;

  const { data: question, isLoading } = useFetch<Question>(
    ["daily-question", activeDomain],
    API_ENDPOINTS.DAILY_QUESTIONS.TODAY(activeDomain),
  );

  const selectType = (type: string) => {
    setActiveType(type);
    setSelected(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await api.post(
        API_ENDPOINTS.DAILY_QUESTIONS.SUBMIT(question!.id),
        { selectedAnswer: selected },
      );
      setStreak(response.data.data.streak.currentStreak);
      queryClient.invalidateQueries({ queryKey: ["daily-question", activeDomain] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit answer"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Daily Questions</h1>
        <p className="text-gray-600 mb-6">
          Answer a question every day to build your streak.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700"
        >
          Login to start
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Daily Question</h1>
        {streak !== null && (
          <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold">
            🔥 Streak: {streak} day{streak === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex space-x-2 mb-6">
        {domain
          ? <span className="px-4 py-2 rounded font-semibold bg-blue-600 text-white">{domain}</span>
          : TYPES.map((type) => (
              <button
                key={type}
                onClick={() => selectType(type)}
                className={`px-4 py-2 rounded font-semibold ${
                  activeType === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {type}
              </button>
            ))}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      <Loading isLoading={isLoading}>
        {question ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">{question.question}</h2>

            {question.source && (
              <p className="text-sm text-gray-500 mb-4">
                Source: {question.source}
              </p>
            )}

            <div className="space-y-3">
              {question.options.map((option) => {
                const isChosen = selected === option.label;
                const showAnswer = question.attempted;
                const isCorrectOption = option.label === question.correctAnswer;
                const isMyAnswer = question.myAttempt?.selectedAnswer === option.label;

                let className =
                  "w-full text-left border rounded p-4 font-medium transition flex items-center gap-3";
                if (showAnswer) {
                  if (isCorrectOption) {
                    className += " bg-green-50 border-green-500 text-green-800";
                  } else if (isMyAnswer && !question.myAttempt?.isCorrect) {
                    className += " bg-red-50 border-red-500 text-red-800";
                  } else {
                    className += " bg-gray-50 border-gray-200 text-gray-600";
                  }
                } else if (isChosen) {
                  className += " border-blue-600 bg-blue-50 text-blue-800";
                } else {
                  className += " border-gray-300 hover:border-blue-400";
                }

                return (
                  <button
                    key={option.label}
                    disabled={question.attempted}
                    onClick={() => setSelected(option.label)}
                    className={className}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold shrink-0">
                      {option.label}
                    </span>
                    {option.text}
                  </button>
                );
              })}
            </div>

            {!question.attempted && (
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-300"
              >
                {submitting ? "Checking..." : "Submit Answer"}
              </button>
            )}

            {question.attempted && (
              <div
                className={`mt-6 p-4 rounded ${
                  question.myAttempt?.isCorrect
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="font-bold mb-1">
                  {question.myAttempt?.isCorrect
                    ? "Correct!"
                    : `Incorrect. The correct answer is ${question.correctAnswer}.`}
                </p>
                {question.myAttempt?.verdict && (
                  <p className="text-sm text-gray-600 mb-1">
                    AI verdict: {question.myAttempt.verdict}
                  </p>
                )}
                <p className="text-gray-700">
                  {question.myAttempt?.explanation || question.explanation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-10">
            No daily question available for this domain yet.
          </div>
        )}
      </Loading>
    </div>
  );
};
