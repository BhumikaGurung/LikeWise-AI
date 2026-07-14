import { useGetMe, useGetProgress } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Target, Calendar, Award } from "lucide-react";

export default function Profile() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: progress, isLoading: progressLoading } = useGetProgress();

  if (userLoading || progressLoading) {
    return <div className="animate-pulse h-[500px] bg-gray-50 rounded-2xl"></div>;
  }

  return (
    <div className="pb-10 max-w-4xl mx-auto">
      <div className="relative mb-24">
        {/* Cover Photo */}
        <div className="h-48 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        </div>
        
        {/* Profile Avatar & Info */}
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
        <div className="md:col-span-1 space-y-6">
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" /> About
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {user?.bio || "No bio added yet. Head to settings to tell us about yourself."}
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
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Joined</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Achievements</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{progress?.currentStreak || 0} Days</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Items Mastered</p>
                <p className="text-2xl font-bold text-gray-900">{(progress?.quizzesCompleted || 0) + (progress?.flashcardsReviewed || 0)}</p>
              </div>
            </div>
          </div>
          
          <Card className="border-gray-100 shadow-sm mt-8">
            <CardContent className="p-8 text-center bg-gray-50/50">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Award className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">More achievements coming soon</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Keep studying to unlock badges and see them displayed here on your profile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}