import { useGetMe, useGetProgress, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Target, Calendar, Award, Zap, BookOpen, FileText, TrendingUp, Bell, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const ALL_SUBJECTS = ["Mathematics", "Computer Science", "Physics", "Biology", "Chemistry", "History"];

export default function Profile() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", bio: "", studyGoal: "", weeklyGoalHours: 10 });
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>(["Mathematics", "Computer Science"]);

  useEffect(() => {
    if (user) {
      setEditForm({
        displayName: user.displayName ?? "",
        bio: user.bio ?? "",
        studyGoal: user.studyGoal ?? "",
        weeklyGoalHours: user.weeklyGoalHours ?? 10,
      });
    }
  }, [user]);

  const handleSave = () => {
    updateMe.mutate({ data: { displayName: editForm.displayName, bio: editForm.bio, studyGoal: editForm.studyGoal, weeklyGoalHours: editForm.weeklyGoalHours } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setIsEditing(false);
      }
    });
  };

  const toggleSubject = (subject: string) => {
    setPreferredSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  if (userLoading || progressLoading) {
    return <div className="animate-pulse h-[500px] bg-gray-50 rounded-2xl" />;
  }

  const quizzesCompleted = progress?.quizzesCompleted ?? 0;
  const totalStudyMinutes = progress?.totalStudyMinutes ?? 0;
  const flashcardsReviewed = progress?.flashcardsReviewed ?? 0;
  const currentStreak = progress?.currentStreak ?? 0;

  const learningGoals = [
    { label: "Complete 10 Quizzes", current: quizzesCompleted, target: 10 },
    { label: "Study 50 Hours", current: Math.round(totalStudyMinutes / 60), target: 50 },
    { label: "Create 5 Flashcard Sets", current: 2, target: 5 },
  ];

  return (
    <div className="pb-10 max-w-5xl mx-auto">
      {/* Cover + Avatar */}
      <div className="relative mb-24">
        <div className="h-48 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
        </div>
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="h-32 w-32 rounded-full bg-white p-1.5 shadow-xl">
            <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-indigo-500" />
              )}
            </div>
          </div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{user?.displayName || "Student"}</h1>
            <p className="text-gray-600 font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: Profile info + Settings */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-6">
              {!isEditing ? (
                <>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" /> About
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {user?.bio || "No bio added yet."}
                  </p>
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Main Goal</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-500" />
                        {user?.studyGoal || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Weekly Goal</p>
                      <p className="text-sm font-medium text-gray-900">{user?.weeklyGoalHours ?? 0} hrs/week</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Joined</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full mt-4">Edit Profile</Button>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 mb-2">Edit Profile</h3>
                  <div className="space-y-1">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={editForm.displayName}
                      onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea id="bio" rows={3} value={editForm.bio}
                      onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="studyGoal">Learning Goal</Label>
                    <Input id="studyGoal" value={editForm.studyGoal}
                      onChange={e => setEditForm(p => ({ ...p, studyGoal: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weeklyGoal">Weekly Goal (hours)</Label>
                    <Input id="weeklyGoal" type="number" min="1" max="40" value={editForm.weeklyGoalHours}
                      onChange={e => setEditForm(p => ({ ...p, weeklyGoalHours: parseInt(e.target.value, 10) || 0 }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateMe.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                      {updateMe.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings card */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Settings</h3>
              <div className="space-y-4">
                {/* Dark mode toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Dark Mode</span>
                  </div>
                  <button
                    onClick={() => setDarkMode(v => !v)}
                    className={cn("w-11 h-6 rounded-full transition-colors", darkMode ? "bg-indigo-500" : "bg-gray-200")}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full mx-1 transition-transform shadow-sm", darkMode && "translate-x-5")} />
                  </button>
                </div>
                {/* Notifications toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Notifications</span>
                  </div>
                  <button
                    onClick={() => setNotifications(v => !v)}
                    className={cn("w-11 h-6 rounded-full transition-colors", notifications ? "bg-indigo-500" : "bg-gray-200")}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full mx-1 transition-transform shadow-sm", notifications && "translate-x-5")} />
                  </button>
                </div>
                {/* Preferred subjects */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preferred Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SUBJECTS.map(subject => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                          preferredSubjects.includes(subject)
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Achievements + Stats + Goals */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Achievements</h2>

          {/* Stat cards 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Study Time", value: `${Math.round(totalStudyMinutes / 60)}h`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Quizzes Completed", value: String(quizzesCompleted), icon: Target, color: "text-purple-500", bg: "bg-purple-50" },
              { label: "Flashcards Reviewed", value: String(flashcardsReviewed), icon: BookOpen, color: "text-orange-500", bg: "bg-orange-50" },
              { label: "Current Streak", value: `${currentStreak} days`, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">{currentStreak} Days</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Items Mastered</p>
                <p className="text-2xl font-bold text-gray-900">{quizzesCompleted + flashcardsReviewed}</p>
              </div>
            </div>
          </div>

          {/* Learning Goals */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" /> Learning Goals
              </h3>
              <div className="space-y-4">
                {learningGoals.map(goal => {
                  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                  return (
                    <div key={goal.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{goal.label}</span>
                        <span className="text-gray-500">{goal.current}/{goal.target}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-8 text-center bg-gray-50/50">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Award className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">More achievements coming soon</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Keep studying to unlock badges and see them here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
