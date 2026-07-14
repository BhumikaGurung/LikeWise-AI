import { useState, useRef, useEffect } from "react";
import { useGetTutorSessions, useCreateTutorSession, TutorSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Plus, Bot, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AiTutor() {
  const { data: sessions, refetch } = useGetTutorSessions();
  const createSession = useCreateTutorSession();
  
  const [activeSession, setActiveSession] = useState<TutorSession | null>(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  
  // Auto-select first session if available and none selected
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSession) {
      setActiveSession(sessions[0]);
    }
  }, [sessions, activeSession]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectInput.trim()) return;
    
    createSession.mutate({ data: { subject: subjectInput } }, {
      onSuccess: (newSession) => {
        setSubjectInput("");
        setActiveSession(newSession);
        refetch();
      }
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeSession) return;
    
    // In a real app, this would send a message via API.
    // For now, we just clear the input to simulate sending in the placeholder shell.
    setMessageInput("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar: Session List */}
      <div className="w-80 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleCreateSession} className="flex gap-2">
            <Input 
              placeholder="New topic..." 
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              className="h-9"
              disabled={createSession.isPending}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={createSession.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions?.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group",
                activeSession?.id === session.id 
                  ? "bg-indigo-50 border border-indigo-100" 
                  : "hover:bg-gray-50 border border-transparent"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-medium truncate",
                  activeSession?.id === session.id ? "text-indigo-900" : "text-gray-700"
                )}>
                  {session.subject}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {session.messageCount}</span>
                  {session.lastMessageAt && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(session.lastMessageAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          
          {(!sessions || sessions.length === 0) && (
            <div className="text-center p-6 text-sm text-gray-500">
              No sessions yet. Create a topic to start learning!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden relative">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{activeSession.subject} Tutor</h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Placeholder */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-gray-700 leading-relaxed">
                    <p className="mb-2">Hello! I'm your AI tutor for <strong>{activeSession.subject}</strong>.</p>
                    <p>I can help you understand difficult concepts, test your knowledge, or summarize your materials.</p>
                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 shrink-0 mt-0.5 opacity-70" />
                      <div>
                        <p className="font-semibold">Coming soon: Live Conversations</p>
                        <p className="text-indigo-700/80 mt-1">The chat backend is currently being wired up. Soon you'll be able to have real-time natural language conversations right here.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Fake user message placeholder */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-4 flex-row-reverse"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="bg-indigo-600 shadow-sm p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm text-white leading-relaxed">
                    <p>Can you explain this concept to me like I'm 5?</p>
                  </div>
                </motion.div>
                
                {/* Fake AI response placeholder */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-gray-700 leading-relaxed">
                    <div className="flex gap-1.5 items-center text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-3 relative">
                <Input 
                  placeholder="Type your question..." 
                  className="pr-12 h-12 rounded-xl border-gray-200 shadow-sm focus-visible:ring-indigo-500"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700"
                  disabled={!messageInput.trim()}
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Tutor Hub</h2>
            <p className="text-gray-500 max-w-md">
              Select a session from the sidebar or create a new topic to start learning. 
              Your personalized AI tutor is ready to help.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}