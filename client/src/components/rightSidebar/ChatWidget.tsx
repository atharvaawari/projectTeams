import { X, Send, Loader, FileText, Sparkles, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  aiQueryMutationFn,
  getAllChatsQueryFn,
  getChatByIdQueryFn,
} from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Source } from "@/types/api.type";

type ApiResponse = {
  answer: string;
  sources?: Source[];
};

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: Source[];
  isTyping?: boolean;
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
  },
  {
    id: "2",
    content: "Hello! I'm your user. what is project name?",
    role: "user",
    timestamp: new Date(),
  },
];

const ChatWidget = ({ isOpen, onClose }: ChatWidgetProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(SAMPLE_CHAT_HISTORY);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const { data: chatsData, isLoading: chatsIsLoading } = useQuery({
    queryKey: ["all-chats"],
    queryFn: () => getAllChatsQueryFn(),
    staleTime: 0,
  });

  const getMostRecentChatId = (chats: any[]): string | null => {
    if (!chats || chats.length === 0) return null;
    const sorted = [...chats].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return sorted[0]._id;
  };

  const recentChatId = getMostRecentChatId(chatsData?.data.chats || []);

  // Set the most recent chat as active on initial load
  useEffect(() => {
    if (recentChatId && !activeChat) {
      setActiveChat(recentChatId);
    }
  }, [recentChatId]);

  //get chat by Id
  const { data: activeChatData, isLoading: activeChatIsLoading } = useQuery({
    queryKey: ["singleChat", activeChat],
    queryFn: () => getChatByIdQueryFn(activeChat!),
    enabled: !!activeChat, // Only fetch if recentChatId exists
    staleTime: Infinity,
  });

  //format data
  useEffect(() => {
    if (activeChatData?.data) {
      const formattedMessages = activeChatData.data.messages.map((msg) => ({
        id: msg._id,
        content: msg.content || "",
        role: msg.role as "user" | "assistant",
        timestamp: new Date(msg.timestamp),
        sources: msg.sources?.map((src) => ({
          text: src.text,
          id: src.id,
          score: src.score,
        })),
      }));
      setMessages(
        formattedMessages.length > 0 ? formattedMessages : SAMPLE_CHAT_HISTORY
      );
    }
  }, [activeChatData]);

  const { mutate, isPending } = useMutation<ApiResponse, Error, string>({
    mutationFn: aiQueryMutationFn,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const typeMessage = (
    messageId: string,
    fullText: string,
    sources?: Source[]
  ) => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: fullText.substring(0, i),
              isTyping: true,
            };
          }
          return msg;
        })
      );

      i++;
      if (i > fullText.length) {
        clearInterval(typingInterval);
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                isTyping: false,
                sources: sources?.map((source) => ({
                  text: source.text,
                  id: source.id,
                  score: source.score,
                })),
              };
            }
            return msg;
          })
        );
      }
    }, 20);
  };

  const onSubmit = (values: FormValues) => {
    if (isPending) return;
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: values.query,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const tempAiMessageId = Date.now().toString() + "-temp";
    const tempAiMessage: Message = {
      id: tempAiMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, tempAiMessage]);

    mutate(values.query, {
      onSuccess: (data) => {
        typeMessage(tempAiMessageId, data.answer, data.sources);
        form.reset();
      },
      onError: (error) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempAiMessageId));
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const QUICK_QUESTIONS = [
    {
      text: "Upcoming deadlines?",
      icon: <Sparkles className="h-3 w-3 mr-1" />,
    },
    { text: "Project summary?", icon: <Sparkles className="h-3 w-3 mr-1" /> },
    { text: "Current tasks?", icon: <Sparkles className="h-3 w-3 mr-1" /> },
    { text: "Team members?", icon: <Sparkles className="h-3 w-3 mr-1" /> },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-2">
      <div
        className={cn(
          "w-80 h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800",
          "rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden",
          "flex flex-col backdrop-blur-sm bg-opacity-80",
          "transition-all duration-300 ease-in-out",
          "lg:w-[450px] md:w-[400px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-2 px-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <h2 className="text-sm font-medium">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className="p-1 rounded-full hover:bg-white/10"
              aria-label="Chat history"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat History List */}
        {chatsIsLoading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : showChatHistory ? (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {chatsData?.data.chats.map((chat) => (
                <div
                  key={chat._id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                    "hover:bg-gray-100 dark:hover:bg-zinc-700/50",
                    activeChatData?.data._id === chat._id
                      ? "bg-gray-200 dark:bg-zinc-700"
                      : ""
                  )}
                  onClick={() => {
                    setActiveChat(chat._id);
                    setShowChatHistory(false);
                    // In a real app, you would load the chat messages here
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {chat.messages[chat.messages.length - 1]?.content ||
                        "No messages"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                    {formatDate(new Date(chat.updatedAt))}
                  </div>
                </div>
              )) || "No Chats Yet"}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
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
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-zinc-700/90 shadow-sm",
                      message.isTyping ? "relative" : ""
                    )}
                  >
                    {message.isTyping ? (
                      <>
                        <p>{message.content}</p>
                        {!message.content && (
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                            <div
                              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p>{message.content}</p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-gray-200 dark:border-zinc-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Sources:
                            </p>
                            <ul className="space-y-1">
                              {message.sources.map((source, index) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3 opacity-70" />
                                  <span className="text-xs text-gray-700 dark:text-gray-300">
                                    {source.text}
                                  </span>
                                  {source.score && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({Math.round(source.score * 100)}%)
                                    </span>
                                  )}
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
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
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

            {/* Input Area */}
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
                className="rounded-full h-9 w-9 p-0 bg-slate-900 hover:bg-slate-700"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
