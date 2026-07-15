import { useState, useEffect } from "react";
import {
  useGetNotes, useCreateNote, useUpdateNote, useDeleteNote,
  getGetNotesQueryKey, type Note
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, Pin, Star, Trash2, X, BookOpen
} from "lucide-react";

const NOTE_COLORS: { name: string; value: string; bg: string; border: string }[] = [
  { name: "white",  value: "white",  bg: "bg-white",     border: "border-gray-200" },
  { name: "yellow", value: "yellow", bg: "bg-yellow-50",  border: "border-yellow-200" },
  { name: "green",  value: "green",  bg: "bg-green-50",   border: "border-green-200" },
  { name: "blue",   value: "blue",   bg: "bg-blue-50",    border: "border-blue-200" },
  { name: "pink",   value: "pink",   bg: "bg-pink-50",    border: "border-pink-200" },
  { name: "purple", value: "purple", bg: "bg-purple-50",  border: "border-purple-200" },
  { name: "orange", value: "orange", bg: "bg-orange-50",  border: "border-orange-200" },
];

const COLOR_CIRCLE: Record<string, string> = {
  white:  "bg-white border border-gray-300",
  yellow: "bg-yellow-300",
  green:  "bg-green-400",
  blue:   "bg-blue-400",
  pink:   "bg-pink-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
};

function getColorClasses(color: string) {
  return NOTE_COLORS.find(c => c.value === color) ?? NOTE_COLORS[0];
}

export default function Notes() {
  const { data: notes = [], isLoading } = useGetNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [savedIndicator, setSavedIndicator] = useState(false);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  }, [selectedNote?.id]);

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;
    createNote.mutate({ data: { title: newNoteTitle.trim(), content: "" } }, {
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        setSelectedNote(created);
        setIsCreating(false);
        setNewNoteTitle("");
      }
    });
  };

  const handleSaveNote = () => {
    if (!selectedNote) return;
    if (editTitle !== selectedNote.title || editContent !== selectedNote.content) {
      updateNote.mutate({ id: selectedNote.id, data: { title: editTitle, content: editContent } }, {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
          setSelectedNote(updated);
          setSavedIndicator(true);
          setTimeout(() => setSavedIndicator(false), 2000);
        }
      });
    }
  };

  const handleUpdateColor = (note: Note, color: string) => {
    updateNote.mutate({ id: note.id, data: { color } }, {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        setSelectedNote(updated);
      }
    });
  };

  const handleTogglePin = (note: Note) => {
    updateNote.mutate({ id: note.id, data: { isPinned: !note.isPinned } }, {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        setSelectedNote(updated);
      }
    });
  };

  const handleToggleFavorite = (note: Note) => {
    updateNote.mutate({ id: note.id, data: { isFavorite: !note.isFavorite } }, {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        setSelectedNote(updated);
      }
    });
  };

  const handleDelete = (note: Note) => {
    if (!confirm("Delete this note?")) return;
    deleteNote.mutate({ id: note.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        if (selectedNote?.id === note.id) setSelectedNote(null);
      }
    });
  };

  const filtered = (notes as Note[])
    .filter(n => {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="pb-10 flex flex-col lg:flex-row gap-6 h-full">
      {/* Left: Notes List */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Notes</h1>
            <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {(notes as Note[]).length}
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="pl-9 rounded-xl"
              />
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-md hover:from-indigo-600 hover:to-indigo-800 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> New Note
            </Button>
          </div>
        </div>

        {/* Quick create */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex gap-2 p-3 bg-white rounded-xl border border-indigo-200 shadow-sm"
            >
              <Input
                autoFocus
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                placeholder="Note title..."
                onKeyDown={e => { if (e.key === "Enter") handleCreateNote(); if (e.key === "Escape") { setIsCreating(false); setNewNoteTitle(""); } }}
                className="flex-1"
              />
              <Button onClick={handleCreateNote} disabled={createNote.isPending || !newNoteTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create
              </Button>
              <Button variant="ghost" onClick={() => { setIsCreating(false); setNewNoteTitle(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Create your first note to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((note, i) => {
              const colorClass = getColorClasses(note.color);
              const isSelected = selectedNote?.id === note.id;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    "rounded-2xl p-4 cursor-pointer border hover:shadow-md transition-all relative group",
                    colorClass.bg,
                    colorClass.border,
                    isSelected && "ring-2 ring-indigo-500"
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-gray-900 truncate flex-1">{note.title}</span>
                    {note.isPinned && (
                      <Pin className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>

                  {/* Content preview */}
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {note.content || <span className="italic opacity-60">No content</span>}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleFavorite(note); }}
                        className="p-1 rounded hover:bg-black/5"
                      >
                        <Star className={cn("h-4 w-4", note.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400")} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(note); }}
                        className="p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Detail panel */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            key={selectedNote.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="lg:w-96 shrink-0"
          >
            <div className={cn(
              "sticky top-0 rounded-2xl border shadow-md flex flex-col h-[calc(100vh-8rem)] max-h-[700px] overflow-hidden",
              getColorClasses(selectedNote.color).bg
            )}>
              {/* Panel header */}
              <div className="flex items-center gap-2 p-4 border-b border-black/5">
                {/* Color picker */}
                <div className="flex items-center gap-1 flex-1 flex-wrap">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => handleUpdateColor(selectedNote, c.value)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-transform hover:scale-110",
                        COLOR_CIRCLE[c.value],
                        selectedNote.color === c.value && "ring-2 ring-indigo-500 ring-offset-1"
                      )}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <button
                  onClick={() => handleTogglePin(selectedNote)}
                  className={cn("p-1.5 rounded-lg hover:bg-black/5 transition-colors", selectedNote.isPinned && "text-amber-500")}
                  title={selectedNote.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className={cn("h-4 w-4", selectedNote.isPinned && "fill-amber-500")} />
                </button>
                <button
                  onClick={() => handleToggleFavorite(selectedNote)}
                  className={cn("p-1.5 rounded-lg hover:bg-black/5 transition-colors", selectedNote.isFavorite && "text-yellow-500")}
                  title={selectedNote.isFavorite ? "Unfavorite" : "Favorite"}
                >
                  <Star className={cn("h-4 w-4", selectedNote.isFavorite && "fill-yellow-400 text-yellow-400")} />
                </button>
                <button
                  onClick={() => handleDelete(selectedNote)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Editable title */}
              <div className="px-4 pt-4">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={handleSaveNote}
                  className="w-full text-2xl font-bold text-gray-900 border-none outline-none bg-transparent placeholder:text-gray-300"
                  placeholder="Untitled"
                />
              </div>

              {/* Editable content */}
              <div className="flex-1 px-4 pb-2 overflow-hidden flex flex-col">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  onBlur={handleSaveNote}
                  className="flex-1 w-full resize-none border-none outline-none bg-transparent text-sm leading-relaxed text-gray-700 placeholder:text-gray-300 py-2"
                  placeholder="Start writing..."
                />
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-black/5 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Updated {new Date(selectedNote.updatedAt).toLocaleDateString()}
                </span>
                {savedIndicator && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-emerald-500 font-medium"
                  >
                    Saved ✓
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
