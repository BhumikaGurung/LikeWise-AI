import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    studyGoal: "",
    weeklyGoalHours: 5,
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (user && !initialized.current) {
      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        studyGoal: user.studyGoal || "",
        weeklyGoalHours: user.weeklyGoalHours || 5,
      });
      initialized.current = true;
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({
      data: {
        displayName: formData.displayName,
        bio: formData.bio,
        studyGoal: formData.studyGoal,
        weeklyGoalHours: formData.weeklyGoalHours,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Settings saved", description: "Your profile has been updated successfully." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to save settings. Please try again." });
      }
    });
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-gray-100 rounded w-1/4"></div>
      <div className="h-[400px] bg-gray-100 rounded-xl"></div>
    </div>;
  }

  return (
    <div className="pb-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and learning goals.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-gray-100 shadow-sm mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>This is how others will see you on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-indigo-500" />
                )}
              </div>
              <Button type="button" variant="outline" size="sm">Change Avatar</Button>
            </div>
            
            <div className="space-y-2 max-w-md">
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                placeholder="A little bit about yourself..."
                className="resize-none"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Learning Goals</CardTitle>
            <CardDescription>Set targets to keep your study streak alive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studyGoal">Main Objective</Label>
              <Input 
                id="studyGoal" 
                placeholder="e.g. Master Machine Learning concepts"
                value={formData.studyGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, studyGoal: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="weeklyHours">Weekly Study Goal (Hours)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="weeklyHours" 
                  type="number"
                  min="1"
                  max="100"
                  value={formData.weeklyGoalHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, weeklyGoalHours: parseInt(e.target.value) || 0 }))}
                />
                <span className="text-sm text-gray-500 font-medium">hours</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" disabled={updateMe.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMe.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}