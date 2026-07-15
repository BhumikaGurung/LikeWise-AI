import { useGetStudyPlans, useCreateStudyPlan, useUpdateStudyPlan, useDeleteStudyPlan } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, Clock, Trash2, CheckCircle, Play, Pause, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetStudyPlansQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PLAN_META_KEY = "learnwise_plan_meta";
const getPlanMeta = (id: number): Record<string, unknown> => {
  try { return (JSON.parse(localStorage.getItem(PLAN_META_KEY) || "{}") as Record<number, Record<string, unknown>>)[id] ?? {}; } catch { return {}; }
};
const setPlanMeta = (id: number, meta: object) => {
  try {
    const all = JSON.parse(localStorage.getItem(PLAN_META_KEY) || "{}") as Record<number, object>;
    localStorage.setItem(PLAN_META_KEY, JSON.stringify({ ...all, [id]: meta }));
  } catch {}
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SAMPLE_TASKS = ["Review Chapter 1", "Practice Problems", "Take Practice Quiz"];

export default function StudyPlanner() {
  const { data: plans, isLoading } = useGetStudyPlans();
  const createPlan = useCreateStudyPlan();
  const updatePlan = useUpdateStudyPlan();
  const deletePlan = useDeleteStudyPlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"plans" | "calendar">("plans");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "", subject: "", durationWeeks: "4", hoursPerWeek: "5",
    examDate: "", priority: "medium" as "low" | "medium" | "high", learningGoal: ""
  });
  // per-plan task completion state (local memory)
  const [taskChecks, setTaskChecks] = useState<Record<number, Record<number, boolean>>>({});

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
      onSuccess: (plan) => {
        setPlanMeta(plan.id, { examDate: formData.examDate, priority: formData.priority, learningGoal: formData.learningGoal });
        setIsDialogOpen(false);
        setFormData({ title: "", subject: "", durationWeeks: "4", hoursPerWeek: "5", examDate: "", priority: "medium", learningGoal: "" });
        queryClient.invalidateQueries({ queryKey: getGetStudyPlansQueryKey() });
      }
    });
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updatePlan.mutate({ id, data: { status: newStatus as "active" | "paused" | "completed" } }, {
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

  const toggleTask = (planId: number, taskIdx: number) => {
    setTaskChecks(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [taskIdx]: !(prev[planId]?.[taskIdx] ?? false) }
    }));
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700"
    };
    return (
      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", map[priority] ?? "bg-gray-100 text-gray-600")}>
        {priority}
      </span>
    );
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Planner</h1>
          <p className="text-gray-500 mt-1">Organize your goals into actionable weekly schedules.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
              <Plus className="h-4 w-4 mr-2" /> Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>New Study Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal / Plan Title</Label>
                <Input id="title" placeholder="e.g. Pass Biology 101"
                  value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g. Biology"
                  value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Weeks)</Label>
                  <Input id="duration" type="number" min="1" max="52"
                    value={formData.durationWeeks} onChange={e => setFormData(p => ({ ...p, durationWeeks: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours/Week</Label>
                  <Input id="hours" type="number" min="1" max="40"
                    value={formData.hoursPerWeek} onChange={e => setFormData(p => ({ ...p, hoursPerWeek: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date (optional)</Label>
                <Input id="examDate" type="date" value={formData.examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData(p => ({ ...p, examDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map(p => (
                    <button key={p} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-semibold border capitalize transition-colors",
                        formData.priority === p
                          ? p === "low" ? "bg-green-500 text-white border-green-500"
                            : p === "medium" ? "bg-yellow-500 text-white border-yellow-500"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      )}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Learning Goal (optional)</Label>
                <textarea id="goal" rows={2} placeholder="What do you want to achieve?"
                  value={formData.learningGoal}
                  onChange={e => setFormData(p => ({ ...p, learningGoal: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <Button type="submit" disabled={createPlan.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {createPlan.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["plans", "calendar"] as const).map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-colors",
              activeTab === tab ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >{tab}</button>
        ))}
      </div>

      {/* ─── PLANS TAB ─── */}
      {activeTab === "plans" && (
        isLoading ? (
          <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : plans && plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan, pi) => {
              const meta = getPlanMeta(plan.id) as { examDate?: string; priority?: string; learningGoal?: string };
              const priority = meta.priority ?? "medium";
              const completedTasks = SAMPLE_TASKS.filter((_, ti) => taskChecks[plan.id]?.[ti]).length;
              const hoursPerDay = Math.round(plan.durationWeeks * plan.hoursPerWeek / 7 * 10) / 10;

              return (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          plan.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          plan.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200')}>
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </span>
                        {getPriorityBadge(priority)}
                        {meta.examDate && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Exam: {new Date(meta.examDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-emerald-600 mb-4">{plan.subject}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{plan.durationWeeks} Weeks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{plan.hoursPerWeek} hrs/week</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1 max-w-sm mb-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-gray-700">Progress</span>
                          <span className="text-emerald-600">{plan.progressPercent ?? 0}%</span>
                        </div>
                        <Progress value={plan.progressPercent ?? 0} className="h-2" />
                      </div>

                      {/* Daily Tasks */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Daily Tasks · {completedTasks}/{SAMPLE_TASKS.length} Completed
                        </p>
                        <div className="space-y-1">
                          {SAMPLE_TASKS.map((task, ti) => (
                            <label key={ti} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox"
                                checked={taskChecks[plan.id]?.[ti] ?? false}
                                onChange={() => toggleTask(plan.id, ti)}
                                className="rounded text-emerald-600"
                              />
                              <span className={cn("text-sm", taskChecks[plan.id]?.[ti] && "line-through text-gray-400")}>{task}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Weekly calendar strip */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Weekly Schedule</p>
                        <div className="flex gap-1">
                          {DAYS.map(day => (
                            <div key={day} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-xs text-gray-400">{day}</span>
                              <div className="w-full rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold text-center py-1">
                                {hoursPerDay}h
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                      <Button variant="outline" className="w-full justify-start"
                        onClick={() => handleToggleStatus(plan.id, plan.status)}>
                        {plan.status === 'active' ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Resume</>}
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                        <CheckCircle className="h-4 w-4 mr-2" /> Complete
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-gray-500"
                        onClick={() => toast({ title: "Export coming soon", description: "PDF export will be available soon." })}>
                        <Download className="h-4 w-4 mr-2" /> Export PDF
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
        )
      )}

      {/* ─── CALENDAR TAB ─── */}
      {activeTab === "calendar" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Study Calendar</h2>
            {plans && plans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4 uppercase tracking-wider">Plan</th>
                      {DAYS.map(d => (
                        <th key={d} className="text-center text-xs font-semibold text-gray-500 pb-3 px-2 uppercase tracking-wider">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans.filter(p => p.status === "active").map((plan, pi) => {
                      const hoursPerDay = Math.round(plan.durationWeeks * plan.hoursPerWeek / 7 * 10) / 10;
                      const colors = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700"];
                      const color = colors[pi % colors.length];
                      return (
                        <tr key={plan.id} className="border-t border-gray-50">
                          <td className="py-3 pr-4 font-medium text-gray-800 whitespace-nowrap">{plan.subject}</td>
                          {DAYS.map(day => (
                            <td key={day} className="py-3 px-2 text-center">
                              <span className={cn("inline-block px-2 py-1 rounded text-xs font-semibold", color)}>
                                {hoursPerDay}h
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {plans.filter(p => p.status === "active").length === 0 && (
                  <p className="text-center text-gray-400 py-8">No active plans to display.</p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-12">No plans created yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
