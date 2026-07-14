import { useGetActivity, useGetProgress, useGetQuizzes, useGetFlashcardSets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  ArrowRight,
  BookOpen, 
  BrainCircuit, 
  Clock, 
  Flame, 
  Layers, 
  Target 
} from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: progress } = useGetProgress();
  const { data: activities } = useGetActivity();
  const { data: quizzes } = useGetQuizzes();
  const { data: flashcards } = useGetFlashcardSets();

  const recentQuizzes = quizzes?.slice(0, 2) || [];
  const recentFlashcards = flashcards?.slice(0, 2) || [];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back!</h1>
        <p className="text-gray-500 mt-1">Here's your learning overview for today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Study Streak", value: `${progress?.currentStreak || 0} days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Weekly Goal", value: `${progress?.weeklyGoalHours || 0} hours`, icon: Target, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Time Studied", value: `${Math.round((progress?.weeklyMinutesStudied || 0) / 60)}h ${Math.round((progress?.weeklyMinutesStudied || 0) % 60)}m`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Materials", value: `${(progress?.quizzesCompleted || 0) + (progress?.flashcardsReviewed || 0)} items`, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`${stat.bg} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions & Continue Learning */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Continue Learning</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {recentQuizzes.map((quiz) => (
                <div key={`quiz-${quiz.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-50 p-2 rounded-md text-indigo-600">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{quiz.title}</h3>
                      <p className="text-xs text-gray-500">Quiz • {quiz.questionCount} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-medium text-indigo-600">Resume Quiz</span>
                    <ArrowRight className="h-4 w-4 text-indigo-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              ))}
              {recentFlashcards.map((set) => (
                <div key={`fc-${set.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-50 p-2 rounded-md text-orange-600">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{set.title}</h3>
                      <p className="text-xs text-gray-500">Flashcards • {set.cardCount} cards</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-medium text-orange-600">Study Now</span>
                    <ArrowRight className="h-4 w-4 text-orange-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              ))}
              {recentQuizzes.length === 0 && recentFlashcards.length === 0 && (
                <div className="sm:col-span-2 text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500">No active materials yet. Let's create some!</p>
                  <div className="mt-4 flex gap-3 justify-center">
                    <Link href="/quiz-generator" className="text-sm font-medium text-indigo-600 hover:underline">Generate a Quiz</Link>
                    <Link href="/flashcards" className="text-sm font-medium text-indigo-600 hover:underline">Create Flashcards</Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions Panel */}
          <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <BrainCircuit className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Need help studying?</h2>
              <p className="text-indigo-100 mb-6 max-w-md">Our AI Tutor is ready to explain complex concepts, quiz you verbally, or help you organize your thoughts.</p>
              <Link href="/ai-tutor" className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors bg-white text-indigo-600 hover:bg-indigo-50 h-10 px-6 shadow-sm">
                Chat with AI Tutor
              </Link>
            </div>
          </section>

        </div>

        {/* Right Column: Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Activity</h2>
            </div>
            <div className="space-y-6">
              {activities && activities.length > 0 ? activities.map((item, i) => (
                <div key={item.id} className="flex gap-4 relative">
                  {i !== activities.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-gray-100" />
                  )}
                  <div className="relative z-10 bg-white mt-1">
                    <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No activity yet. Start learning!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}