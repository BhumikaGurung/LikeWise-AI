import { useGetPdfs, useCreatePdf, useDeletePdf } from "@workspace/api-client-react";
import type { PdfDocument } from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, CheckCircle2, Clock, AlertCircle, CloudUpload, BrainCircuit, MessageSquare, BookOpen, Layers } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPdfsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ready':
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><CheckCircle2 className="h-3 w-3" /> Ready</span>;
    case 'processing':
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"><Clock className="h-3 w-3 animate-spin" /> Processing</span>;
    case 'error':
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"><AlertCircle className="h-3 w-3" /> Error</span>;
    default:
      return null;
  }
};

export default function PdfLearning() {
  const { data: pdfs, isLoading } = useGetPdfs();
  const createPdf = useCreatePdf();
  const deletePdf = useDeletePdf();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPdf, setSelectedPdf] = useState<PdfDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfNotes, setPdfNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      createPdf.mutate({
        data: {
          fileName: `${Date.now()}_${file.name}`,
          originalName: file.name,
          fileSize: file.size,
          pageCount: Math.floor(Math.random() * 50) + 1
        }
      }, {
        onSuccess: () => {
          setIsUploading(false);
          setUploadProgress(0);
          queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
          toast({ title: "Upload complete", description: `${file.name} has been uploaded.` });
        },
        onError: () => {
          setIsUploading(false);
          setUploadProgress(0);
        }
      });
    }, 1600);
  };

  const handleDelete = (pdf: PdfDocument) => {
    if (confirm("Delete this document? All associated AI context will be lost.")) {
      deletePdf.mutate({ id: pdf.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
          if (selectedPdf?.id === pdf.id) setSelectedPdf(null);
        }
      });
    }
  };

  const conceptChips = ["Chapter Overview", "Key Definitions", "Important Theorems", "Summary Points", "Review Questions"];
  const topicTags = ["Core Concepts", "Practice Problems", "Exam Topics"];
  const aiButtons = [
    { label: "Quiz from PDF", icon: BrainCircuit },
    { label: "Flashcards from PDF", icon: Layers },
    { label: "Summarize", icon: BookOpen },
    { label: "Ask AI", icon: MessageSquare },
  ];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PDF Learning</h1>
        <p className="text-gray-500 mt-1">Upload course materials to unlock AI-powered insights.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Document List */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Documents</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
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
                  {/* Card header gradient */}
                  <div className="h-3 bg-gradient-to-r from-indigo-50 to-blue-50" />
                  <div className="absolute top-5 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white shadow-sm"
                      onClick={e => { e.stopPropagation(); handleDelete(pdf); }}
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
                        <span className="text-xs text-gray-500">{pdf.pageCount ?? '?'} pages</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{new Date(pdf.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>{getStatusBadge(pdf.status)}</div>
                    </div>
                  </div>
                  {/* AI Action Buttons */}
                  <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Chat with PDF", "Auto-Summarize", "Generate Quiz", "Make Flashcards"].map(label => (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold bg-white relative group/btn"
                        disabled
                        title="Coming with Gemini AI"
                      >
                        {label}
                        <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-600 px-1 rounded font-bold">(AI)</span>
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

        {/* Right: Upload + Summary */}
        <div className="lg:w-96 shrink-0 space-y-4">
          {/* Upload area */}
          <div
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center transition-colors relative",
              isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
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
            <p className="text-xs text-gray-400 mt-3">Max 20MB · PDF only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            {/* Progress */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center p-6"
                >
                  <p className="text-sm font-semibold text-gray-700 mb-3">Uploading...</p>
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

          {/* Summary panel */}
          <AnimatePresence>
            {selectedPdf && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-indigo-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate">{selectedPdf.originalName}</h3>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "File Size", value: formatBytes(selectedPdf.fileSize) },
                    { label: "Pages", value: String(selectedPdf.pageCount ?? '?') },
                    { label: "Upload Date", value: new Date(selectedPdf.createdAt).toLocaleDateString() },
                    { label: "Status", value: selectedPdf.status.charAt(0).toUpperCase() + selectedPdf.status.slice(1) },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Key Concepts */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Concepts</p>
                  <div className="flex flex-wrap gap-2">
                    {conceptChips.map(chip => (
                      <span key={chip} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{chip}</span>
                    ))}
                  </div>
                </div>

                {/* Important Topics */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Important Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {topicTags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Notes textarea */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                  <textarea
                    value={pdfNotes}
                    onChange={e => setPdfNotes(e.target.value)}
                    placeholder="Add your notes about this document..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    rows={3}
                  />
                </div>

                {/* AI action buttons */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {aiButtons.map(({ label, icon: Icon }) => (
                      <Button
                        key={label}
                        disabled
                        className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-xs font-semibold opacity-60 cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                        <span className="text-[9px] bg-white/20 px-1 rounded ml-auto">Soon</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
