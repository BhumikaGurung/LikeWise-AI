import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGetTutorSessions,
  useCreateTutorSession,
  useDeleteTutorSession,
  useGetTutorMessages,
  getGetTutorMessagesQueryKey,
  getGetTutorSessionsQueryKey,
  type TutorSession,
  type ChatMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Bot,
  User,
  Plus,
  Trash2,
  Send,
  Copy,
  RefreshCw,
  X,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function streamMessage(
  sessionId: number,
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  const res = await fetch(`${BASE}/api/tutor/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok || !res.body) {
    onError("Failed to connect");
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.content) onChunk(parsed.content);
        if (parsed.done) onDone();
        if (parsed.error) onError(parsed.error);
      } catch {}
    }
  }
}

const SUGGESTED_PROMPTS = [
  "Explain Binary Trees",
  "Explain Operating System",
  "Explain DBMS",
  "Explain Java OOP",
  "Explain Python Functions",
  "Explain Computer Networks",
];

function renderInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="bg-gray-100 text-indigo-700 rounded px-1 py-0.5 text-xs font-mono"
        >
          {match[3]}
        </code>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MessageBubble({ msg }: { msg: ChatMessage & { streaming?: boolean; streamingText?: string } }) {
  const isUser = msg.role === "user";
  const content = msg.streaming ? (msg.streamingText ?? "") : msg.content;
  const showTypingDots = msg.streaming && (msg.streamingText ?? "") === "";

  const lines = content.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
          isUser ? "bg-indigo-600" : "bg-indigo-100",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-indigo-600" />
        )}
      </div>
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
              : "bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-none",
          )}
        >
          {showTypingDots ? (
            <div className="flex gap-1.5 items-center py-1">
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              <span
                className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          ) : (
            <div>
              {lines.map((line, i) => (
                <span key={i}>
                  {renderInlineMarkdown(line)}
                  {i < lines.length - 1 && <br />}
                </span>
              ))}
              {msg.streaming && (
                <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>
        <span
          className={cn(
            "text-xs text-gray-400",
            isUser ? "text-right" : "text-left",
          )}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}

export default function AiTutor() {
  const queryClient = useQueryClient();
  const { data: sessions } = useGetTutorSessions();
  const createSession = useCreateTutorSession();
  const deleteSession = useDeleteTutorSession();

  const [activeSession, setActiveSession] = useState<TutorSession | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [newTopicInput, setNewTopicInput] = useState("");
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: dbMessages } = useGetTutorMessages(activeSession?.id ?? 0, {
    query: { enabled: !!activeSession, queryKey: getGetTutorMessagesQueryKey(activeSession?.id ?? 0) },
  });

  const displayedMessages: (ChatMessage & { streaming?: boolean; streamingText?: string })[] = [
    ...(dbMessages ?? []),
    ...(isStreaming
      ? [
          {
            id: -1,
            role: "assistant" as const,
            content: streamingText,
            sessionId: activeSession?.id ?? 0,
            createdAt: new Date().toISOString(),
            streaming: true,
            streamingText,
          },
        ]
      : []),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages.length, streamingText]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || !activeSession || isStreaming) return;
      setMessageInput("");
      setIsStreaming(true);
      setStreamingText("");

      await streamMessage(
        activeSession.id,
        content,
        (chunk) => setStreamingText((prev) => prev + chunk),
        () => {
          setIsStreaming(false);
          setStreamingText("");
          queryClient.invalidateQueries({
            queryKey: getGetTutorMessagesQueryKey(activeSession.id),
          });
          queryClient.invalidateQueries({
            queryKey: getGetTutorSessionsQueryKey(),
          });
        },
        () => {
          setIsStreaming(false);
          setStreamingText("");
        },
      );
    },
    [activeSession, isStreaming, queryClient],
  );

  const handleSubmitInput = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(messageInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(messageInput);
    }
  };

  const handleCreateSession = (topic: string) => {
    if (!topic.trim()) return;
    createSession.mutate(
      { data: { subject: topic.trim() } },
      {
        onSuccess: (newSession) => {
          setActiveSession(newSession);
          setShowNewChatInput(false);
          setNewTopicInput("");
          queryClient.invalidateQueries({
            queryKey: getGetTutorSessionsQueryKey(),
          });
        },
      },
    );
  };

  const handleSuggestedPrompt = (prompt: string) => {
    createSession.mutate(
      { data: { subject: prompt } },
      {
        onSuccess: (newSession) => {
          setActiveSession(newSession);
          setShowNewChatInput(false);
          setNewTopicInput("");
          queryClient.invalidateQueries({
            queryKey: getGetTutorSessionsQueryKey(),
          });
          // send prompt as first message after a tick
          setTimeout(() => handleSend(prompt), 100);
        },
      },
    );
  };

  const handleDeleteSession = (session: TutorSession) => {
    if (!confirm(`Delete "${session.subject}" session?`)) return;
    deleteSession.mutate(
      { id: session.id },
      {
        onSuccess: () => {
          if (activeSession?.id === session.id) setActiveSession(null);
          queryClient.invalidateQueries({
            queryKey: getGetTutorSessionsQueryKey(),
          });
        },
      },
    );
  };

  const handleCopyLast = () => {
    const lastAI = [...(dbMessages ?? [])]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAI) return;
    navigator.clipboard.writeText(lastAI.content);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleRegenerate = () => {
    const lastUser = [...(dbMessages ?? [])]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUser) return;
    handleSend(lastUser.content);
  };

  const handleClearChat = () => {
    if (!activeSession) return;
    const subject = activeSession.subject;
    deleteSession.mutate(
      { id: activeSession.id },
      {
        onSuccess: () => {
          setActiveSession(null);
          createSession.mutate(
            { data: { subject } },
            {
              onSuccess: (newSession) => {
                setActiveSession(newSession);
                queryClient.invalidateQueries({
                  queryKey: getGetTutorSessionsQueryKey(),
                });
              },
            },
          );
        },
      },
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-3 lg:gap-4">
      {/* Sidebar */}
      <div className="w-full lg:w-80 max-h-80 lg:max-h-none flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">AI Tutor</h2>
            <button
              onClick={() => setShowNewChatInput((v) => !v)}
              className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors"
            >
              {showNewChatInput ? (
                <X className="h-4 w-4 text-white" />
              ) : (
                <Plus className="h-4 w-4 text-white" />
              )}
            </button>
          </div>
          <AnimatePresence>
            {showNewChatInput && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateSession(newTopicInput);
                }}
                className="flex gap-2 overflow-hidden"
              >
                <input
                  autoFocus
                  placeholder="Topic name..."
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={createSession.isPending || !newTopicInput.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                >
                  Start
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions && sessions.length > 0 ? (
            sessions.map((session) => {
              const isActive = activeSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group border",
                    isActive
                      ? "bg-indigo-50 border-indigo-200 border-l-4 border-l-indigo-500"
                      : "border-transparent hover:bg-gray-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-indigo-900" : "text-gray-700",
                      )}
                    >
                      {session.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {session.messageCount} messages
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <span
                      className={cn(
                        "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {session.messageCount}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session);
                      }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md hover:bg-red-50 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-center text-sm text-gray-400 py-6">
              Start a new chat above
            </p>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="p-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Suggested
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestedPrompt(prompt)}
                disabled={createSession.isPending}
                className="text-xs px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {activeSession ? (
          <>
            {/* Chat header */}
            <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">
                    {activeSession.subject} Tutor
                  </h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyLast}
                  title="Copy last AI response"
                  className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors relative"
                >
                  <Copy className="h-4 w-4 text-gray-500" />
                  <AnimatePresence>
                    {copiedMsg && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded whitespace-nowrap"
                      >
                        Copied!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={handleRegenerate}
                  title="Regenerate"
                  disabled={isStreaming}
                  className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={handleClearChat}
                  title="Clear chat"
                  disabled={isStreaming}
                  className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="max-w-3xl mx-auto flex flex-col gap-5">
                {displayedMessages.length === 0 && !isStreaming && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <Bot className="h-10 w-10 mx-auto mb-3 text-indigo-200" />
                    <p>Ask anything about <strong className="text-gray-600">{activeSession.subject}</strong></p>
                  </div>
                )}
                {displayedMessages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0">
              <form
                onSubmit={handleSubmitInput}
                className="max-w-3xl mx-auto relative"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={`Ask anything about ${activeSession.subject}...`}
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  className="w-full resize-none pr-12 pl-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-800 placeholder-gray-400 disabled:opacity-60 min-h-[48px] max-h-[120px]"
                  style={{ height: "48px" }}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isStreaming}
                  className="absolute right-2 bottom-2 h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-5">
              <Bot className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI Tutor Hub
            </h2>
            <p className="text-gray-500 max-w-md mb-8">
              Select a session from the sidebar or start a new topic. Your
              personalized AI tutor is ready to help.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={createSession.isPending}
                  className="text-sm px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
