import { useGetPdfs, useDeletePdf, useReprocessPdf } from "@workspace/api-client-react";
import type { PdfDocument } from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, Trash2, CheckCircle2, Clock, AlertCircle, CloudUpload,
  BrainCircuit, MessageSquare, BookOpen, Layers, RotateCcw, ChevronDown, ChevronUp,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPdfsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ready":
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><CheckCircle2 className="h-3 w-3" /> Ready</span>;
    case "processing":
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"><Clock className="h-3 w-3 animate-spin" /> Processing</span>;
    case "error":
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"><AlertCircle className="h-3 w-3" /> Error</span>;
    default:
      return null;
  }
};

type ActiveSection = "summary" | "keyPoints" | "questions" | "flashcards" | "quiz";

export default function PdfLearning() {
  const { data: pdfs, isLoading } = useGetPdfs();
  const deletePdf = useDeletePdf();
  const reprocessPdf = useReprocessPdf();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPdf, setSelectedPdf] = useState<PdfDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("summary");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Poll while any PDF is processing ──────────────────────────────────────
  useEffect(() => {
    const hasProcessing = pdfs?.some((p) => p.status === "processing");
    if (!hasProcessing) return;
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
    }, 3000);
    return () => clearInterval(id);
  }, [pdfs, queryClient]);

  // ── Keep selectedPdf in sync with refreshed data ──────────────────────────
  useEffect(() => {
    if (!selectedPdf || !pdfs) return;
    const updated = pdfs.find((p) => p.id === selectedPdf.id);
    if (updated && updated.status !== selectedPdf.status) {
      setSelectedPdf(updated);
      if (updated.status === "ready") {
        toast({ title: "Analysis complete", description: `${updated.originalName} is ready.` });
      }
    }
  }, [pdfs, selectedPdf, toast]);

  // ── Real file upload via multipart FormData ───────────────────────────────
  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20 MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Animated progress bar (visual only during upload)
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? 90 : prev + Math.floor(Math.random() * 15) + 5));
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pdfs/upload", { method: "POST", body: formData });
      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Upload failed (${res.status})`);
      }

      const doc = (await res.json()) as PdfDocument;
      await queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
      setSelectedPdf(doc);
      toast({ title: "Upload complete", description: `${file.name} is being analysed by AI…` });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (pdf: PdfDocument) => {
    if (confirm("Delete this document? All associated AI content will be lost.")) {
      deletePdf.mutate({ id: pdf.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
          if (selectedPdf?.id === pdf.id) setSelectedPdf(null);
          toast({ title: "Deleted", description: `${pdf.originalName} removed.` });
        },
      });
    }
  };

  const handleReprocess = (pdf: PdfDocument) => {
    reprocessPdf.mutate({ id: pdf.id }, {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
        setSelectedPdf(updated);
        toast({ title: "Retrying", description: "AI analysis restarted." });
      },
      onError: () => {
        toast({ title: "Retry failed", description: "Could not restart processing.", variant: "destructive" });
      },
    });
  };

  const selectAndActivate = (pdf: PdfDocument, section: ActiveSection) => {
    setSelectedPdf(pdf);
    setActiveSection(section);
  };

  const aiCardButtons = [
    { label: "Auto-Summarize", icon: BookOpen, section: "summary" as ActiveSection },
    { label: "Make Flashcards", icon: Layers, section: "flashcards" as ActiveSection },
    { label: "Generate Quiz", icon: BrainCircuit, section: "quiz" as ActiveSection },
    { label: "Key Questions", icon: MessageSquare, section: "questions" as ActiveSection },
  ];

  const aiPanelTabs: { label: string; section: ActiveSection }[] = [
    { label: "Summary", section: "summary" },
    { label: "Key Points", section: "keyPoints" },
    { label: "Questions", section: "questions" },
    { label: "Flashcards", section: "flashcards" },
    { label: "Quiz", section: "quiz" },
  ];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PDF Learning</h1>
        <p className="text-gray-500 mt-1">Upload course materials to unlock AI-powered insights.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Document List ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Documents</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : pdfs && pdfs.length > 0 ? (
            <div className="space-y-3">
              {pdfs.map((pdf, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={pdf.id}
                  onClick={() => setSelectedPdf(pdf)}
                  className={cn(
                    "bg-white rounded-2xl border overflow-hidden flex flex-col group hover:shadow-md transition-all cursor-pointer relative",
                    selectedPdf?.id === pdf.id ? "ring-2 ring-indigo-500 border-indigo-200" : "border-gray-100 shadow-sm"
                  )}
                >
                  <div className="h-3 bg-gradient-to-r from-indigo-50 to-blue-50" />
                  <div className="absolute top-5 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white shadow-sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(pdf); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 truncate" title={pdf.originalName}>{pdf.originalName}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <span className="text-xs text-gray-500">{formatBytes(pdf.fileSize)}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{pdf.pageCount ?? "?"} pages</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{new Date(pdf.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(pdf.status)}
                        {pdf.status === "processing" && (
                          <span className="text-xs text-blue-500 animate-pulse">AI is analysing…</span>
                        )}
                        {pdf.status === "error" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-red-600 hover:bg-red-50 px-2"
                            onClick={(e) => { e.stopPropagation(); handleReprocess(pdf); }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* AI Action Buttons */}
                  <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {aiCardButtons.map(({ label, icon: Icon, section }) => (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs font-semibold bg-white",
                          pdf.status !== "ready" && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={pdf.status !== "ready"}
                        title={pdf.status !== "ready" ? "Available once processing is complete" : label}
                        onClick={(e) => { e.stopPropagation(); if (pdf.status === "ready") selectAndActivate(pdf, section); }}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No documents yet</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload your first PDF to unlock AI insights.</p>
            </div>
          )}
        </div>

        {/* ── Right: Upload + Detail Panel ─────────────────────────────────── */}
        <div className="lg:w-96 shrink-0 space-y-4">
          {/* Upload area */}
          <div
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center transition-colors relative",
              isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <CloudUpload className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Drag & drop your PDF here</p>
            <p className="text-xs text-gray-500 mb-4">or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isUploading}
            >
              Browse Files
            </Button>
            <p className="text-xs text-gray-400 mt-3">Max 20 MB · PDF only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center p-6"
                >
                  <p className="text-sm font-semibold text-gray-700 mb-3">Uploading…</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-2 bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{Math.min(uploadProgress, 100)}%</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selectedPdf && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{selectedPdf.originalName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">{getStatusBadge(selectedPdf.status)}</div>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "File Size", value: formatBytes(selectedPdf.fileSize) },
                    { label: "Pages", value: String(selectedPdf.pageCount ?? "?") },
                    { label: "Upload Date", value: new Date(selectedPdf.createdAt).toLocaleDateString() },
                    { label: "Status", value: selectedPdf.status.charAt(0).toUpperCase() + selectedPdf.status.slice(1) },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Processing state ───────────────────────────────────── */}
                {selectedPdf.status === "processing" && (
                  <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
                    <Clock className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">AI is analysing your document…</p>
                      <p className="text-xs text-blue-600 mt-0.5">This usually takes 15–30 seconds. The page updates automatically.</p>
                    </div>
                  </div>
                )}

                {/* ── Error state ────────────────────────────────────────── */}
                {selectedPdf.status === "error" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Processing failed</p>
                        {selectedPdf.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 break-words">{selectedPdf.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                      onClick={() => handleReprocess(selectedPdf)}
                      disabled={reprocessPdf.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {reprocessPdf.isPending ? "Retrying…" : "Retry Processing"}
                    </Button>
                  </div>
                )}

                {/* ── AI Content (status === "ready") ────────────────────── */}
                {selectedPdf.status === "ready" && (
                  <div className="space-y-3">
                    {/* Tab bar */}
                    <div className="flex flex-wrap gap-1">
                      {aiPanelTabs.map(({ label, section }) => (
                        <button
                          key={section}
                          onClick={() => setActiveSection(section)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                            activeSection === section
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Summary */}
                    {activeSection === "summary" && selectedPdf.summary && (
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto pr-1">
                        {selectedPdf.summary}
                      </div>
                    )}

                    {/* Key Points */}
                    {activeSection === "keyPoints" && selectedPdf.keyPoints && selectedPdf.keyPoints.length > 0 && (
                      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedPdf.keyPoints.map((point, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Important Questions */}
                    {activeSection === "questions" && selectedPdf.importantQuestions && selectedPdf.importantQuestions.length > 0 && (
                      <ol className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedPdf.importantQuestions.map((q, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-indigo-500 font-semibold shrink-0 min-w-[1.25rem]">{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Flashcards */}
                    {activeSection === "flashcards" && selectedPdf.flashcards && selectedPdf.flashcards.length > 0 && (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedPdf.flashcards.map((card, i) => (
                          <div
                            key={i}
                            className="border border-gray-100 rounded-xl overflow-hidden cursor-pointer"
                            onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                          >
                            <div className="bg-indigo-50 px-3 py-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-indigo-800">{card.front}</p>
                              {expandedCard === i ? <ChevronUp className="h-3 w-3 text-indigo-500 shrink-0" /> : <ChevronDown className="h-3 w-3 text-indigo-500 shrink-0" />}
                            </div>
                            <AnimatePresence>
                              {expandedCard === i && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="px-3 py-2 text-xs text-gray-700 bg-white">{card.back}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quiz */}
                    {activeSection === "quiz" && selectedPdf.quiz && selectedPdf.quiz.length > 0 && (
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                        {selectedPdf.quiz.map((q, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-semibold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                            <div className="space-y-1">
                              {q.options.map((opt, j) => (
                                <div
                                  key={j}
                                  className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs border",
                                    opt === q.correctAnswer
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                                      : "bg-gray-50 border-gray-100 text-gray-600"
                                  )}
                                >
                                  {opt === q.correctAnswer && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                                  {opt}
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-gray-500 italic">{q.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
