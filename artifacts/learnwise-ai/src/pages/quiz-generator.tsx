import { useState, useRef, useEffect } from "react";
import {
  useGetQuizzes,
  useCreateQuiz,
  useDeleteQuiz,
  useGetQuiz,
  useSubmitQuiz,
  getGetQuizzesQueryKey,
  type Quiz,
  type QuizQuestion,
  type QuizResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Zap,
  Star,
  Flame,
} from "lucide-react";

type View = "config" | "taking" | "results";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: Quiz["status"] }) {
  const map: Record<Quiz["status"], { label: string; cls: string }> = {
    generating: { label: "Generating", cls: "bg-gray-100 text-gray-600" },
    ready: { label: "Ready", cls: "bg-blue-100 text-blue-700" },
    in_progress: { label: "In Progress", cls: "bg-yellow-100 text-yellow-700" },
    completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
    archived: { label: "Archived", cls: "bg-gray-100 text-gray-500" },
  };
  const { label, cls } = map[status] ?? map.ready;
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cls)}>
      {label}
    </span>
  );
}

function DifficultyIcon({ difficulty }: { difficulty: Quiz["difficulty"] }) {
  if (difficulty === "easy") return <Zap className="h-5 w-5 text-green-500" />;
  if (difficulty === "hard") return <Flame className="h-5 w-5 text-red-500" />;
  return <Star className="h-5 w-5 text-amber-500" />;
}

export default function QuizGenerator() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("config");
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Config form
  const [formData, setFormData] = useState({
    subject: "Computer Science",
    topic: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    questionType: "mcq" as "mcq" | "true_false" | "fill_blank" | "short_answer",
    questionCount: 10,
  });

  // Taking state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { data: quizzes, isLoading: quizzesLoading } = useGetQuizzes();
  const createQuiz = useCreateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const submitQuiz = useSubmitQuiz();

  const { data: quiz } = useGetQuiz(activeQuizId ?? 0, {
    query: { enabled: !!activeQuizId, queryKey: ["/api/quizzes/" + (activeQuizId ?? 0)] as const },
  });

  // Timer
  useEffect(() => {
    if (view === "taking") {
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  const questions = (quiz?.questions ?? []) as QuizQuestion[];
  const q = questions[currentIdx];

  const handleGenerate = () => {
    createQuiz.mutate(
      {
        data: {
          title: formData.topic
            ? `${formData.topic} Quiz`
            : `${formData.subject} Quiz`,
          subject: formData.subject,
          topic: formData.topic || formData.subject,
          difficulty: formData.difficulty,
          questionType: formData.questionType,
          questionCount: formData.questionCount,
        },
      },
      {
        onSuccess: (result) => {
          setActiveQuizId(result.id);
          setCurrentIdx(0);
          setAnswers({});
          setElapsed(0);
          setShowSubmitConfirm(false);
          queryClient.invalidateQueries({ queryKey: getGetQuizzesQueryKey() });
          setView("taking");
        },
      },
    );
  };

  const handleDeleteQuiz = (id: number) => {
    if (!confirm("Delete this quiz?")) return;
    deleteQuiz.mutate(
      { id },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getGetQuizzesQueryKey() }),
      },
    );
  };

  const handleTakeQuiz = (quizId: number) => {
    setActiveQuizId(quizId);
    setCurrentIdx(0);
    setAnswers({});
    setElapsed(0);
    setShowSubmitConfirm(false);
    setView("taking");
  };

  const unansweredCount = questions.length - Object.keys(answers).length;

  const handleSubmitQuiz = () => {
    if (!activeQuizId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    submitQuiz.mutate(
      {
        id: activeQuizId,
        data: {
          answers: Object.entries(answers).map(([qId, answer]) => ({
            questionId: Number(qId),
            answer,
          })),
          timeTakenSeconds: elapsed,
        },
      },
      {
        onSuccess: (result) => {
          setQuizResult(result);
          queryClient.invalidateQueries({ queryKey: getGetQuizzesQueryKey() });
          setView("results");
        },
      },
    );
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setAnswers({});
    setElapsed(0);
    setShowSubmitConfirm(false);
    setView("taking");
  };

  // ── CONFIG VIEW ──────────────────────────────────────────────────────────────
  if (view === "config") {
    return (
      <div className="pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Quiz Generator
          </h1>
          <p className="text-gray-500 mt-1">
            Generate and take AI-powered quizzes.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* Left: quiz history */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Quiz History
            </h2>
            {quizzesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-36 bg-gray-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : quizzes && quizzes.length > 0 ? (
              <div className="space-y-4">
                {quizzes.map((qz) => (
                  <motion.div
                    key={qz.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DifficultyIcon difficulty={qz.difficulty} />
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {qz.title}
                        </h3>
                      </div>
                      <StatusBadge status={qz.status} />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {qz.topic} · {qz.subject}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium",
                          qz.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : qz.difficulty === "hard"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {qz.difficulty.charAt(0).toUpperCase() +
                          qz.difficulty.slice(1)}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                        {qz.questionType === "mcq"
                          ? "MCQ"
                          : qz.questionType === "true_false"
                            ? "True/False"
                            : qz.questionType === "fill_blank"
                              ? "Fill Blank"
                              : "Short Answer"}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {qz.questionCount} Qs
                      </span>
                      {qz.status === "completed" && qz.score !== null && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                          {qz.score}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {qz.status !== "generating" && (
                        <button
                          onClick={() => handleTakeQuiz(qz.id)}
                          className="flex-1 text-sm py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                        >
                          {qz.status === "completed" ? "Retake Quiz" : "Take Quiz"} →
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuiz(qz.id)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors group"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <BrainCircuit className="h-10 w-10 text-indigo-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No quizzes yet. Generate your first one →
                </p>
              </div>
            )}
          </div>

          {/* Right: generate form */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                Generate Quiz
              </h2>
              <div className="space-y-5">
                {/* Subject */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, Mathematics"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, subject: e.target.value }))
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Trees, Recursion, OOP"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, topic: e.target.value }))
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setFormData((p) => ({ ...p, difficulty: d }))
                        }
                        className={cn(
                          "flex-1 py-2 rounded-xl text-sm font-medium transition-colors border",
                          formData.difficulty === d
                            ? d === "easy"
                              ? "bg-green-500 text-white border-green-500"
                              : d === "hard"
                                ? "bg-red-500 text-white border-red-500"
                                : "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions count */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Questions
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() =>
                          setFormData((p) => ({ ...p, questionCount: n }))
                        }
                        className={cn(
                          "flex-1 py-2 rounded-xl text-sm font-medium transition-colors border",
                          formData.questionCount === n
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Type
                  </label>
                  <div className="flex gap-1 border-b border-gray-200">
                    {(
                      [
                        { value: "mcq", label: "MCQ" },
                        { value: "true_false", label: "True/False" },
                        { value: "fill_blank", label: "Fill Blank" },
                        { value: "short_answer", label: "Short Answer" },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setFormData((p) => ({ ...p, questionType: value }))
                        }
                        className={cn(
                          "flex-1 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                          formData.questionType === value
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={createQuiz.isPending || !formData.subject.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {createQuiz.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {createQuiz.isPending ? "Generating..." : "Generate Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TAKING VIEW ──────────────────────────────────────────────────────────────
  if (view === "taking") {
    const expectedSeconds = (quiz?.questionCount ?? 10) * 60;
    const timeWarning = elapsed > expectedSeconds * 0.8;

    return (
      <div className="pb-10 min-h-screen">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setView("config")}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[40%]">
              {quiz?.title ?? "Quiz"}
            </h1>
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-mono font-semibold",
                timeWarning ? "text-red-500" : "text-gray-600",
              )}
            >
              <Clock className="h-4 w-4" />
              {formatTime(elapsed)}
            </div>
          </div>
          {/* Progress bar */}
          {questions.length > 0 && (
            <div className="h-1 bg-gray-100">
              <motion.div
                className="h-full bg-indigo-600"
                animate={{
                  width: `${((currentIdx + 1) / questions.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {!quiz || questions.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-8 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="space-y-3 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-6 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">
                Question {currentIdx + 1} of {questions.length}
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {q.question}
              </h2>

              {/* MCQ */}
              {q.type === "mcq" && (
                <div className="space-y-3">
                  {(q.options ?? []).map((opt, i) => {
                    const letter = ["A", "B", "C", "D"][i] ?? String(i + 1);
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                        }
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left text-sm transition-all",
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700",
                        )}
                      >
                        <span
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                            selected
                              ? "bg-indigo-500 text-white"
                              : "bg-gray-100 text-gray-600",
                          )}
                        >
                          {letter}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {q.type === "true_false" && (
                <div className="flex gap-4">
                  {["True", "False"].map((v) => {
                    const selected = answers[q.id] === v;
                    return (
                      <button
                        key={v}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: v }))
                        }
                        className={cn(
                          "flex-1 py-5 rounded-xl border-2 text-sm font-semibold transition-all",
                          selected
                            ? v === "True"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700",
                        )}
                      >
                        {v === "True" ? "✓ True" : "✗ False"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill blank */}
              {q.type === "fill_blank" && (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    {q.question.replace(/_{2,}/g, "[   ]")}
                  </p>
                  <input
                    type="text"
                    placeholder="Your answer..."
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    className="w-full text-sm border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Short answer */}
              {q.type === "short_answer" && (
                <textarea
                  rows={4}
                  placeholder="Your answer..."
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  className="w-full text-sm border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 resize-none"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              {/* Dots */}
              <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
                {questions.map((question, i) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      i === currentIdx
                        ? "bg-indigo-600 ring-2 ring-indigo-300 scale-125"
                        : answers[question.id]
                          ? "bg-indigo-400"
                          : "bg-gray-200",
                    )}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={currentIdx === questions.length - 1}
                className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>

              {(unansweredCount === 0 ||
                currentIdx === questions.length - 1) && (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Submit Quiz →
                </button>
              )}
            </div>

            {/* Submit confirm */}
            <AnimatePresence>
              {showSubmitConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-lg"
                >
                  {unansweredCount > 0 && (
                    <p className="text-sm text-amber-600 font-medium mb-3">
                      ⚠️ You have {unansweredCount} unanswered{" "}
                      {unansweredCount === 1 ? "question" : "questions"}.
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mb-4">
                    Are you sure you want to submit?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitQuiz.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitQuiz.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Confirm Submit
                    </button>
                    <button
                      onClick={() => setShowSubmitConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ── RESULTS VIEW ─────────────────────────────────────────────────────────────
  if (view === "results" && quizResult) {
    const pct = quizResult.percentage;
    const scoreColor =
      pct >= 70
        ? "text-green-600"
        : pct >= 40
          ? "text-yellow-500"
          : "text-red-500";
    const ringColor =
      pct >= 70
        ? "border-green-500"
        : pct >= 40
          ? "border-yellow-400"
          : "border-red-500";

    return (
      <div className="pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Score card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center"
          >
            {/* Circle */}
            <div
              className={cn(
                "w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center mx-auto mb-5",
                ringColor,
              )}
            >
              <span className={cn("text-5xl font-black", scoreColor)}>
                {pct}
              </span>
              <span className="text-sm text-gray-500 font-medium">%</span>
            </div>

            <p className="text-xl font-bold text-gray-900 mb-1">
              {pct >= 70
                ? "Excellent!"
                : pct >= 40
                  ? "Good effort!"
                  : "Keep practicing!"}
            </p>
            <p className="text-gray-500 text-sm mb-5">
              {quizResult.totalCorrect} / {quizResult.totalCorrect + quizResult.totalWrong} Correct
            </p>

            {/* Stats row */}
            <div className="flex gap-3 justify-center mb-7">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                ✓ {quizResult.totalCorrect} Correct
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700">
                ✗ {quizResult.totalWrong} Wrong
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                ⏱ {formatTime(quizResult.timeTakenSeconds)}
              </span>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 rounded-xl border border-indigo-300 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors"
              >
                Retry Quiz
              </button>
              <button
                onClick={() => {
                  setView("config");
                  setActiveQuizId(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                New Quiz
              </button>
            </div>
          </motion.div>

          {/* Per-question review */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Review Answers
            </h2>
            {quizResult.results.map((r, i) => (
              <motion.div
                key={r.questionId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "bg-white rounded-xl border-l-4 border shadow-sm p-5",
                  r.isCorrect ? "border-l-green-500" : "border-l-red-500",
                )}
              >
                <p className="text-xs text-gray-400 font-semibold mb-1">
                  Q{i + 1}
                </p>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {r.question}
                </p>

                <div className="space-y-1.5 mb-3">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      r.isCorrect ? "text-green-600" : "text-red-500",
                    )}
                  >
                    Your answer:{" "}
                    <span className="font-semibold">
                      {r.yourAnswer || "(no answer)"}
                    </span>
                  </p>
                  {!r.isCorrect && (
                    <p className="text-xs font-medium text-green-600">
                      Correct answer:{" "}
                      <span className="font-semibold">{r.correctAnswer}</span>
                    </p>
                  )}
                </div>

                {/* MCQ options */}
                {r.options && r.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.options.map((opt) => {
                      const isCorrect = opt === r.correctAnswer;
                      const isYours = opt === r.yourAnswer;
                      return (
                        <span
                          key={opt}
                          className={cn(
                            "text-xs px-2 py-1 rounded-lg border",
                            isCorrect
                              ? "bg-green-50 border-green-300 text-green-700 font-semibold"
                              : isYours && !r.isCorrect
                                ? "bg-red-50 border-red-300 text-red-700"
                                : "bg-gray-50 border-gray-200 text-gray-500",
                          )}
                        >
                          {isCorrect ? "✓ " : isYours && !r.isCorrect ? "✗ " : ""}
                          {opt}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {r.explanation && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <p className="text-xs italic text-indigo-800">
                      💡 {r.explanation}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
