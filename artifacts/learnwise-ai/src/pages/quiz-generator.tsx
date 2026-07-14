import { useGetQuizzes, useCreateQuiz, useDeleteQuiz, Quiz } from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BrainCircuit, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetQuizzesQueryKey } from "@workspace/api-client-react";

export default function QuizGenerator() {
  const { data: quizzes, isLoading } = useGetQuizzes();
  const createQuiz = useCreateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", topic: "", questionCount: "10" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createQuiz.mutate({
      data: {
        title: formData.title,
        topic: formData.topic,
        questionCount: parseInt(formData.questionCount, 10)
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ title: "", topic: "", questionCount: "10" });
        queryClient.invalidateQueries({ queryKey: getGetQuizzesQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      deleteQuiz.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetQuizzesQueryKey() })
      });
    }
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quiz Generator</h1>
          <p className="text-gray-500 mt-1">Test your knowledge with AI-generated questions.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Generate Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate a New Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Midterm Prep" 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Material</Label>
                <Input 
                  id="topic" 
                  placeholder="e.g. Cellular Respiration" 
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Number of Questions</Label>
                <Input 
                  id="count" 
                  type="number" 
                  min="1" max="50"
                  value={formData.questionCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionCount: e.target.value }))}
                  required
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={createQuiz.isPending} className="w-full bg-indigo-600">
                  {createQuiz.isPending ? "Generating..." : "Generate Quiz"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200">
                      {quiz.status === 'completed' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{quiz.topic}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5"><BrainCircuit className="h-4 w-4" /> {quiz.questionCount} Qs</span>
                  {quiz.score !== null && quiz.score !== undefined && (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium"><CheckCircle2 className="h-4 w-4" /> Score: {quiz.score}%</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:bg-indigo-50 px-0">
                  {quiz.status === 'completed' ? 'Review Answers' : 'Take Quiz'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 -mr-2"
                  onClick={() => handleDelete(quiz.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Generate your first quiz based on your study materials to test your knowledge.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600">Create Quiz</Button>
        </div>
      )}
    </div>
  );
}