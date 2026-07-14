import { useGetStudyPlans, useCreateStudyPlan, useUpdateStudyPlan, useDeleteStudyPlan } from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, Clock, Trash2, CheckCircle, Play, Pause } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetStudyPlansQueryKey } from "@workspace/api-client-react";

export default function StudyPlanner() {
  const { data: plans, isLoading } = useGetStudyPlans();
  const createPlan = useCreateStudyPlan();
  const updatePlan = useUpdateStudyPlan();
  const deletePlan = useDeleteStudyPlan();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", subject: "", durationWeeks: "4", hoursPerWeek: "5" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan.mutate({
      data: {
        title: formData.title,
        subject: formData.subject,
        durationWeeks: parseInt(formData.durationWeeks, 10),
        hoursPerWeek: parseInt(formData.hoursPerWeek, 10)
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ title: "", subject: "", durationWeeks: "4", hoursPerWeek: "5" });
        queryClient.invalidateQueries({ queryKey: getGetStudyPlansQueryKey() });
      }
    });
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updatePlan.mutate({
      id,
      data: { status: newStatus as any }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetStudyPlansQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this study plan?")) {
      deletePlan.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetStudyPlansQueryKey() })
      });
    }
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Planner</h1>
          <p className="text-gray-500 mt-1">Organize your goals into actionable weekly schedules.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Study Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal / Plan Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Pass Biology 101" 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="e.g. Biology" 
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Weeks)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="1" max="52"
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationWeeks: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours per Week</Label>
                  <Input 
                    id="hours" 
                    type="number" 
                    min="1" max="40"
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, hoursPerWeek: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={createPlan.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {createPlan.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    plan.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    plan.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm font-medium text-emerald-600 mb-6">{plan.subject}</p>
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{plan.durationWeeks} Weeks total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{plan.hoursPerWeek} Hours/week</span>
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-emerald-600">{plan.progressPercent || 0}%</span>
                  </div>
                  <Progress value={plan.progressPercent || 0} className="h-2" />
                </div>
              </div>
              
              <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleToggleStatus(plan.id, plan.status)}
                >
                  {plan.status === 'active' ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Resume</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Complete
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(plan.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No study plans</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Create a schedule to stay on track with your learning goals.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">Create Plan</Button>
        </div>
      )}
    </div>
  );
}