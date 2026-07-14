import { useGetFlashcardSets, useCreateFlashcardSet, useDeleteFlashcardSet } from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Layers, Trash2, BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFlashcardSetsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function Flashcards() {
  const { data: sets, isLoading } = useGetFlashcardSets();
  const createSet = useCreateFlashcardSet();
  const deleteSet = useDeleteFlashcardSet();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", topic: "", cardCount: "20" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSet.mutate({
      data: {
        title: formData.title,
        topic: formData.topic,
        cardCount: parseInt(formData.cardCount, 10)
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ title: "", topic: "", cardCount: "20" });
        queryClient.invalidateQueries({ queryKey: getGetFlashcardSetsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this flashcard set?")) {
      deleteSet.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFlashcardSetsQueryKey() })
      });
    }
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Flashcard Sets</h1>
          <p className="text-gray-500 mt-1">Master definitions and concepts with spaced repetition.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              New Set
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Flashcard Set</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Set Title</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Source Material</Label>
                <Input 
                  id="topic" 
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Number of Cards (approx.)</Label>
                <Input 
                  id="count" 
                  type="number" 
                  min="5" max="100"
                  value={formData.cardCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardCount: e.target.value }))}
                  required
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={createSet.isPending} className="w-full bg-orange-500 hover:bg-orange-600">
                  {createSet.isPending ? "Generating..." : "Generate Set"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : sets && sets.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sets.map((set, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={set.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all hover:-translate-y-1 relative"
            >
              <div className="absolute top-0 right-0 p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 shadow-sm"
                  onClick={() => handleDelete(set.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-orange-500 shadow-inner group-hover:scale-110 transition-transform">
                  <Layers className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{set.title}</h3>
                <p className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">{set.cardCount} Cards</p>
                <div className="mt-4 w-full pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 truncate">{set.topic}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Button className="w-full bg-white border border-gray-200 text-gray-800 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors shadow-sm">
                  <BookOpen className="h-4 w-4 mr-2" /> Study Now
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No flashcards yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Create your first set to start memorizing important concepts.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">Create Set</Button>
        </div>
      )}
    </div>
  );
}