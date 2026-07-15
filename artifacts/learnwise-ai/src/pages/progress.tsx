import { useGetProgress } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from "recharts";
import { Target, TrendingUp, Calendar, Zap, BookOpen, FileText, ListChecks, Star, CheckSquare } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MONTHLY_RAW = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  quizzes: Math.floor((i * 7 + 3) % 3),
  flashcards: Math.floor((i * 13 + 5) % 8),
}));

const monthlyData = MONTHLY_RAW.reduce((acc, d, i) => {
  const prev = acc[i - 1] ?? { day: 0, quizzes: 0, flashcards: 0 };
  acc.push({ day: d.day, quizzes: prev.quizzes + d.quizzes, flashcards: prev.flashcards + d.flashcards });
  return acc;
}, [] as { day: number; quizzes: number; flashcards: number }[]);

const areaData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.8 },
  { day: "Wed", hours: 1.5 },
  { day: "Thu", hours: 4.2 },
  { day: "Fri", hours: 3.0 },
  { day: "Sat", hours: 5.5 },
  { day: "Sun", hours: 2.0 },
];

const UPCOMING_TASKS = [
  { id: 1, title: "Complete Calculus Quiz", subject: "Mathematics", due: "Tomorrow" },
  { id: 2, title: "Review Biology Chapter 4", subject: "Biology", due: "In 2 days" },
  { id: 3, title: "Practice Spanish Flashcards", subject: "Language", due: "In 3 days" },
];

export default function Progress() {
  const { data: progress } = useGetProgress();
  const [taskChecks, setTaskChecks] = useState<Record<number, boolean>>({});

  const weeklyData = [
    { name: "Mon", hours: 2.5 },
    { name: "Tue", hours: 3.8 },
    { name: "Wed", hours: 1.5 },
    { name: "Thu", hours: 4.2 },
    { name: "Fri", hours: 3.0 },
    { name: "Sat", hours: 5.5 },
    { name: "Sun", hours: Math.round((progress?.weeklyMinutesStudied || 0) / 60) },
  ];

  const activityData = [
    { name: "Quizzes", value: progress?.quizzesCompleted || 10, color: "hsl(271 81% 56%)" },
    { name: "Flashcards", value: progress?.flashcardsReviewed || 25, color: "hsl(34 100% 50%)" },
    { name: "Reading", value: progress?.pdfsUploaded || 5, color: "hsl(199 89% 48%)" },
  ];

  const weeklyGoalPct = progress?.weeklyGoalHours
    ? Math.round(((progress.weeklyMinutesStudied || 0) / 60 / progress.weeklyGoalHours) * 100)
    : 0;

  const statCards1 = [
    { label: "Current Streak", value: `${progress?.currentStreak || 0}`, unit: "days", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Total Study Time", value: `${Math.round((progress?.totalStudyMinutes || 0) / 60)}`, unit: "hrs", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Quizzes Completed", value: String(progress?.quizzesCompleted || 0), unit: "", icon: Target, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Avg Score", value: "82", unit: "%", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  const statCards2 = [
    { label: "Flashcards Reviewed", value: String(progress?.flashcardsReviewed || 0), unit: "", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "PDFs Uploaded", value: String(progress?.pdfsUploaded || 0), unit: "", icon: FileText, color: "text-blue-400", bg: "bg-blue-50" },
    { label: "Active Study Plans", value: String(progress?.studyPlansActive || 0), unit: "", icon: ListChecks, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Weekly Goal", value: `${weeklyGoalPct}`, unit: "%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Progress Analytics</h1>
        <p className="text-gray-500 mt-1">Track your learning journey and stay motivated.</p>
      </div>

      {/* Row 1 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {statCards1.map(card => (
          <Card key={card.label} className="border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{card.label}</CardTitle>
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {card.value}<span className="text-base font-medium text-gray-400 ml-1">{card.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards2.map(card => (
          <Card key={card.label} className="border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{card.label}</CardTitle>
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {card.value}<span className="text-base font-medium text-gray-400 ml-1">{card.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Study Hours */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Weekly Study Hours</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: "#F3F4F6" }} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={activityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {activityData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-medium text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Progress Line */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Monthly Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData.filter((_, i) => i % 3 === 0)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                <Legend />
                <Line type="monotone" dataKey="quizzes" stroke="hsl(271 81% 56%)" strokeWidth={2} dot={false} name="Quizzes" />
                <Line type="monotone" dataKey="flashcards" stroke="hsl(34 100% 50%)" strokeWidth={2} dot={false} name="Flashcards" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Learning Trend Area */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Learning Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(249 89% 66%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(249 89% 66%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                <Area type="monotone" dataKey="hours" stroke="hsl(249 89% 66%)" strokeWidth={2} fill="url(#colorHours)" name="Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming tasks */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-500" /> Upcoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {UPCOMING_TASKS.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={taskChecks[task.id] ?? false}
                    onChange={() => setTaskChecks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                    className="rounded text-indigo-600"
                  />
                  <div>
                    <p className={cn("text-sm font-medium text-gray-800", taskChecks[task.id] && "line-through text-gray-400")}>{task.title}</p>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{task.subject}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{task.due}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
