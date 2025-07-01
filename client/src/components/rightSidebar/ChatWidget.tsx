import { X, Send, Loader, FileText, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { aiQueryMutationFn } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: {
    title: string;
    url: string;
  }[];
};

type ChatWidgetProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
};

const formSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

const SAMPLE_CHAT_HISTORY: Message[] = [
  {
    id: "1",
    content: "Hello! I'm your AI assistant. How can I help you today?",
    role: "assistant",
    timestamp: new Date(),
  }
];

const ChatWidget = ({ isOpen, onClose, projectId }: ChatWidgetProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(SAMPLE_CHAT_HISTORY);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  useEffect(() => {
    if (projectId) {
      setMessages(prev => [
        {
          id: Date.now().toString(),
          content: `I'm your assistant for project ${projectId}. Ask me anything!`,
          role: "assistant",
          timestamp: new Date(),
        },
        ...prev
      ]);
    }
  }, [projectId]);

  const { mutate, isPending } = useMutation({
    mutationFn: aiQueryMutationFn,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isPending) return;
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: values.query,
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    mutate(values.query, {
      onSuccess: (data: { response: string; sources?: Array<{ title?: string; url?: string }> }) => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
          sources: data.sources?.map(source => ({
            title: source.title || "Document",
            url: source.url || "#"
          }))
        };
        setMessages(prev => [...prev, assistantMessage]);
        form.reset();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const QUICK_QUESTIONS = [
    { text: "Upcoming deadlines?", icon: <Sparkles className="h-3 w-3 mr-1" /> },
    { text: "Project summary?", icon: <Sparkles className="h-3 w-3 mr-1" /> },
    { text: "Current tasks?", icon: <Sparkles className="h-3 w-3 mr-1" /> },
    { text: "Team members?", icon: <Sparkles className="h-3 w-3 mr-1" /> }
  ];

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-2">
      <div className={cn(
        "w-80 h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800",
        "rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden",
        "flex flex-col backdrop-blur-sm bg-opacity-80",
        "transition-all duration-300 ease-in-out"
      )}>
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-700 dark:to-slate-800">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <h2 className="text-sm font-medium text-white">AI Assistant</h2>
            {projectId && (
              <span className="text-xs bg-white/20 text-white/90 px-1.5 py-0.5 rounded-full">
                #{projectId}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat Messages - Main Focus */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-6 w-6 mt-0.5 flex-shrink-0">
                  <AvatarImage src="/ai-avatar.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  "transition-all duration-200",
                  message.role === "user"
                    ? "bg-black-600 text-white"
                    : "bg-white dark:bg-zinc-700/90 shadow-sm"
                )}
              >
                <p>{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-200 dark:border-zinc-600">
                    <ul className="space-y-1">
                      {message.sources.map((source, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <FileText className="h-3 w-3 opacity-70" />
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs mt-1 text-right opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Collapsible Suggested Queries */}
        {showSuggestions && (
          <div className="px-2 pb-1 border-t border-gray-200 dark:border-zinc-700">
            <div className="flex overflow-x-auto gap-1.5 py-2 scrollbar-hide">
              {QUICK_QUESTIONS.map((q, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 whitespace-nowrap bg-white/50 dark:bg-zinc-700/50 hover:bg-white dark:hover:bg-zinc-600"
                  onClick={() => {
                    form.setValue("query", q.text);
                  }}
                >
                  {q.icon}
                  {q.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Compact Input Area */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="border-t border-gray-200 dark:border-zinc-700 flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-zinc-800/50"
        >
          <Input
            type="text"
            placeholder="Message AI assistant..."
            className="flex-1 h-9 text-sm border-0 bg-white/80 dark:bg-zinc-700/80 focus-visible:ring-1"
            {...form.register("query")}
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-full h-9 w-9 p-0 from-slate-900 hover:bg-slate-700"
            disabled={isPending}
          >
            {isPending ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;