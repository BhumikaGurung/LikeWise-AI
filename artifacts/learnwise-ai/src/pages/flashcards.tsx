import { useGetFlashcardSets, useCreateFlashcardSet, useDeleteFlashcardSet } from "@workspace/api-client-react";
import type { FlashcardSet, FlashcardCard } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Layers, Trash2, ChevronLeft, ChevronRight, RotateCcw, Shuffle, CheckCircle, Bookmark } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFlashcardSetsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type CardState = { isLearned: boolean; isBookmarked: boolean };

export default function Flashcards() {
  const { data: sets, isLoading } = useGetFlashcardSets();
  const createSet = useCreateFlashcardSet();
  const deleteSet = useDeleteFlashcardSet();
  const queryClient = useQueryClient();

  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<Record<number, CardState>>({});
  const [search, setSearch] = useState("");
  const [shuffled, setShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<FlashcardCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", topic: "", cardCount: "10" });

  useEffect(() => {
    if (!isFlipped) return;
    setIsFlipped(false);
  }, [currentIdx]);

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
        setFormData({ title: "", topic: "", cardCount: "10" });
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

  const startStudy = (set: FlashcardSet) => {
    setStudyingSet(set);
    setCurrentIdx(0);
    setIsFlipped(false);
    setShuffled(false);
    setShuffledCards(set.cards ? [...set.cards] : []);
    setCardStates({});
  };

  const stopStudy = () => {
    setStudyingSet(null);
    setCurrentIdx(0);
    setIsFlipped(false);
    setShuffled(false);
  };

  const getCards = (): FlashcardCard[] => {
    if (!studyingSet) return [];
    const base = studyingSet.cards ?? [];
    return shuffled ? shuffledCards : base;
  };

  const handleShuffle = () => {
    const cards = studyingSet?.cards ? [...studyingSet.cards] : [];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    setShuffledCards(cards);
    setShuffled(true);
    setCurrentIdx(0);
    setIsFlipped(false);
  };

  const toggleLearned = (card: FlashcardCard) => {
    setCardStates(prev => ({
      ...prev,
      [card.id]: { ...prev[card.id] ?? { isLearned: false, isBookmarked: false }, isLearned: !(prev[card.id]?.isLearned ?? false) }
    }));
  };

  const toggleBookmark = (card: FlashcardCard) => {
    setCardStates(prev => ({
      ...prev,
      [card.id]: { ...prev[card.id] ?? { isLearned: false, isBookmarked: false }, isBookmarked: !(prev[card.id]?.isBookmarked ?? false) }
    }));
  };

  const filteredSets = (sets ?? []).filter(s => {
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q);
  });

  const getDifficultyBadge = (diff?: string) => {
    if (!diff) return null;
    const map: Record<string, string> = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" };
    return <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", map[diff] ?? "bg-gray-100 text-gray-600")}>{diff}</span>;
  };

  // ─── STUDY MODE ───────────────────────────────────────────────────────────
  if (studyingSet) {
    const cards = getCards();
    const card = cards[currentIdx];
    const learnedCount = Object.values(cardStates).filter(s => s.isLearned).length;
    const bookmarkedCount = Object.values(cardStates).filter(s => s.isBookmarked).length;
    const learnedPct = cards.length > 0 ? Math.round((learnedCount / cards.length) * 100) : 0;

    return (
      <div className="pb-10 max-w-2xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <Button variant="ghost" onClick={stopStudy} className="flex items-center gap-1 text-gray-600">
            <ChevronLeft className="h-5 w-5" /> Back
          </Button>
          <div className="text-center flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{studyingSet.title}</h2>
            <p className="text-sm text-gray-500">Card {currentIdx + 1} of {cards.length}</p>
          </div>
          <div className="text-right text-xs text-gray-500 leading-relaxed">
            <span className="text-emerald-600 font-semibold">{learnedCount}</span> Learned ·{" "}
            <span className="text-indigo-600 font-semibold">{bookmarkedCount}</span> Bookmarked
          </div>
        </div>

        {card ? (
          <>
            {/* Difficulty badge */}
            {card.difficulty && (
              <div className="flex justify-center mb-3">
                {getDifficultyBadge(card.difficulty)}
              </div>
            )}

            {/* Flip card */}
            <div style={{ perspective: "1000px" }} className="w-full aspect-[3/2] cursor-pointer mb-6" onClick={() => setIsFlipped(f => !f)}>
              <div style={{
                transformStyle: "preserve-3d",
                transition: "transform 0.6s",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                position: "relative",
                width: "100%",
                height: "100%"
              }}>
                {/* Front */}
                <div style={{ backfaceVisibility: "hidden", position: "absolute", width: "100%", height: "100%" }}
                  className="bg-white rounded-2xl border-2 border-gray-100 shadow-xl flex flex-col items-center justify-center p-8">
                  <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">Question</span>
                  <p className="text-xl font-bold text-gray-900 text-center leading-relaxed">{card.front}</p>
                  <span className="absolute bottom-4 text-xs text-gray-400">Click to reveal answer</span>
                </div>
                {/* Back */}
                <div style={{ backfaceVisibility: "hidden", position: "absolute", width: "100%", height: "100%", transform: "rotateY(180deg)" }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-xl flex flex-col items-center justify-center p-8">
                  <span className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-4">Answer</span>
                  <p className="text-base text-gray-800 text-center leading-relaxed">{card.back}</p>
                </div>
              </div>
            </div>

            {/* Controls row 1 */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button variant="ghost" size="icon" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex gap-1.5">
                {cards.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentIdx ? "bg-indigo-500 w-4" : cardStates[c.id]?.isLearned ? "bg-emerald-400" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              <Button variant="ghost" size="icon" disabled={currentIdx === cards.length - 1} onClick={() => setCurrentIdx(i => i + 1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Controls row 2 */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={handleShuffle} className="gap-1.5">
                <Shuffle className="h-4 w-4" /> Shuffle
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => toggleLearned(card)}
                className={cn("gap-1.5", cardStates[card.id]?.isLearned && "border-emerald-400 text-emerald-600 bg-emerald-50")}
              >
                <CheckCircle className="h-4 w-4" /> {cardStates[card.id]?.isLearned ? "Learned!" : "Mark Learned"}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => toggleBookmark(card)}
                className={cn("gap-1.5", cardStates[card.id]?.isBookmarked && "border-indigo-400 text-indigo-600 bg-indigo-50")}
              >
                <Bookmark className={cn("h-4 w-4", cardStates[card.id]?.isBookmarked && "fill-indigo-500")} /> Bookmark
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsFlipped(f => !f)} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> Flip
              </Button>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span className="font-semibold text-emerald-600">{learnedPct}% Learned</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-emerald-400 rounded-full transition-all" style={{ width: `${learnedPct}%` }} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-500">No cards in this set.</div>
        )}
      </div>
    );
  }

  // ─── SETS LIST ────────────────────────────────────────────────────────────
  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Flashcard Sets</h1>
            <p className="text-gray-500 mt-1">Master concepts with spaced repetition.</p>
          </div>
          {sets && (
            <span className="bg-orange-100 text-orange-700 text-sm font-semibold px-2.5 py-0.5 rounded-full self-start mt-1">
              {sets.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sets..."
              className="rounded-xl"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md shrink-0">
                <Plus className="h-4 w-4 mr-2" /> New Set
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Flashcard Set</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Set Title</Label>
                  <Input id="title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Source Material</Label>
                  <Input id="topic" value={formData.topic} onChange={e => setFormData(p => ({ ...p, topic: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Number of Cards</Label>
                  <div className="flex gap-2">
                    {["5", "10", "15", "20"].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, cardCount: n }))}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors",
                          formData.cardCount === n ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={createSet.isPending} className="w-full bg-orange-500 hover:bg-orange-600">
                    {createSet.isPending ? "Generating..." : "Generate Set"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredSets.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set, i) => {
            const learnedCount = (set.cards ?? []).filter(c => cardStates[c.id]?.isLearned).length;
            const total = set.cardCount || 1;
            const pct = Math.round((learnedCount / total) * 100);
            return (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative group overflow-hidden flex flex-col"
              >
                {/* Accent bar */}
                <div className="h-1 bg-gradient-to-r from-orange-400 to-yellow-400" />

                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(set.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <Layers className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{set.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{set.topic}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{set.cardCount} Cards</span>
                    <span className="text-xs text-gray-400">· 4 Easy · 3 Med · 3 Hard</span>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{pct}% Learned</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700 shadow-sm"
                    onClick={() => startStudy(set)}
                  >
                    Study Now
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No flashcard sets</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Create your first set to start memorizing important concepts.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">Create Set</Button>
        </div>
      )}
    </div>
  );
}
