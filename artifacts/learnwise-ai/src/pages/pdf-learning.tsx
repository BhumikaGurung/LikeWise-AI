import { useGetPdfs, useCreatePdf, useDeletePdf } from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPdfsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function PdfLearning() {
  const { data: pdfs, isLoading } = useGetPdfs();
  const createPdf = useCreatePdf();
  const deletePdf = useDeletePdf();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Simulate upload by just registering the metadata
    createPdf.mutate({
      data: {
        fileName: `${Date.now()}_${file.name}`,
        originalName: file.name,
        fileSize: file.size,
        pageCount: Math.floor(Math.random() * 50) + 1 // mock
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFile(null);
        queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this document? All associated AI context will be lost.")) {
      deletePdf.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPdfsQueryKey() })
      });
    }
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PDF Learning</h1>
          <p className="text-gray-500 mt-1">Upload course materials to unlock AI-powered insights.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  id="pdf-upload"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 mb-1">Click to select a file</span>
                  <span className="text-xs text-gray-500">PDFs up to 50MB</span>
                </Label>
              </div>
              
              {file && (
                <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between border border-blue-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-blue-900 truncate">{file.name}</span>
                  </div>
                  <span className="text-xs text-blue-600 shrink-0 ml-4">{formatBytes(file.size)}</span>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={!file || createPdf.isPending} className="w-full bg-blue-600">
                  {createPdf.isPending ? "Uploading..." : "Upload & Process"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : pdfs && pdfs.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={pdf.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all relative"
            >
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white"
                  onClick={() => handleDelete(pdf.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 truncate pr-8" title={pdf.originalName}>{pdf.originalName}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                    <span className="text-xs text-gray-500">{formatBytes(pdf.fileSize)}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{pdf.pageCount || '?'} pages</span>
                  </div>
                  <div>{getStatusBadge(pdf.status)}</div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs font-semibold bg-white" disabled={pdf.status !== 'ready'}>
                  Chat with PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs font-semibold bg-white" disabled={pdf.status !== 'ready'}>
                  Auto-Summarize
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Upload your first PDF to generate summaries, quizzes, and ask questions about it.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">Upload PDF</Button>
        </div>
      )}
    </div>
  );
}