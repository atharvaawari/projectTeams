import { X, Send, Loader, FileText, Sparkles, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiQueryMutationFn } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  addMessageToChatMutationFn,
  createChatMutationFn,
  getAllChatsQueryFn,
  getChatByIdQueryFn,
} from "../../lib/api";

const formSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

type Source = {
  id: string;
  text: string;
  score?: number;
};

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

const ChatWidget = ({ isOpen, onClose, projectId }: ChatWidgetProps) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [typingMessage, setTypingMessage] = useState<Message | null>(null);

  // Fetch all chats
  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: getAllChatsQueryFn,
    enabled: isOpen,
  });

  // Fetch active chat messages
  const { data: activeChatData, refetch: refetchActiveChat } = useQuery({
    queryKey: ["chat", activeChat],
    queryFn: () => (activeChat ? getChatByIdQueryFn(activeChat) : null),
    enabled: isOpen && !!activeChat,
  });

  // Convert API data to local message format
  const messages = activeChatData?.data?.messages
    ? [
        ...activeChatData.data.messages.map((msg) => ({
          id: msg._id,
          content: msg.content,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.timestamp),
          sources: msg.sources,
        })),
        ...(typingMessage ? [typingMessage] : []),
      ]
    : typingMessage
    ? [typingMessage]
    : [];

  // Create new chat mutation
  const { mutate: createChat } = useMutation({
    mutationFn: createChatMutationFn,
    onSuccess: (data) => {
      setActiveChat(data._id);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // Add message to chat mutation
  const { mutate: addMessage } = useMutation({
    mutationFn: ({
      chatId,
      content,
      role,
    }: {
      chatId: string;
      content: string;
      role: string;
    }) => addMessageToChatMutationFn({ content, role, sources: [] }, chatId),
    onSuccess: () => {
      refetchActiveChat();
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const { mutate: getAiResponse, isPending } = useMutation<
    ApiResponse,
    Error,
    string
  >({
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
      setTypingMessage({
        id: messageId,
        content: fullText.substring(0, i),
        role: "assistant",
        timestamp: new Date(),
        isTyping: true,
      });

      i++;
      if (i > fullText.length) {
        clearInterval(typingInterval);
        setTypingMessage(null);
        // Add the final message to the chat
        addMessage({
          chatId: activeChat!,
          content: fullText,
          role: "assistant",
        });
      }
    }, 20);
  };

  const onSubmit = async (values: FormValues) => {
    if (isPending) return;
    setShowSuggestions(false);

    try {
      let currentChatId = activeChat;

      // Create a new chat if none is active
      if (!currentChatId) {
        const { data: newChat }: any = createChat(
          `Project ${projectId || "New"} Chat`
        );
        currentChatId = newChat._id;
        setActiveChat(currentChatId);
      }

      // Add user message to chat
      // addMessage({
      //   chatId: currentChatId,
      //   content: values.query,
      //   role: "user",
      // });

      const tempAiMessageId = Date.now().toString() + "-temp";

      getAiResponse(values.query, {
        onSuccess: (data) => {
          typeMessage(tempAiMessageId, data.answer, data.sources);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message",
        variant: "destructive",
      });
    }
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
        {showChatHistory ? (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {chatsData?.data.chats.map((chat) => (
                <div
                  key={chat._id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                    "hover:bg-gray-100 dark:hover:bg-zinc-700/50",
                    activeChat === chat._id
                      ? "bg-gray-200 dark:bg-zinc-700"
                      : ""
                  )}
                  onClick={() => {
                    setActiveChat(chat._id);
                    setShowChatHistory(false);
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
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && !activeChat && (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>Start a new conversation</p>
                  </div>
                </div>
              )}

              {/* {messages.map((message) => {
                // Create a safe message object with defaults
                const safeMessage = {
                  ...message,
                  isTyping: message.isTyping ?? false,
                  sources: message.sources ?? [],
                };

                return (
                  <div
                    key={safeMessage.id}
                    className={cn(
                      "flex gap-2",
                      safeMessage.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    {safeMessage.role === "assistant" && (
                      <Avatar className="h-6 w-6 mt-0.5 flex-shrink-0">
                        <AvatarImage src="/ai-avatar.png" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        "transition-all duration-200",
                        safeMessage.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-zinc-700/90 shadow-sm",
                        safeMessage.isTyping ? "relative" : ""
                      )}
                    >
                      {safeMessage.isTyping ? (
                        <>
                          <p>{safeMessage.content}</p>
                          {!safeMessage.content && (
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
                          <p>{safeMessage.content}</p>
                          {safeMessage.role === "assistant" &&
                            safeMessage.sources.length > 0 && (
                              <div className="mt-1 pt-1 border-t border-gray-200 dark:border-zinc-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Sources:
                                </p>
                                <ul className="space-y-1">
                                  {safeMessage.sources?.map((source, index) => (
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
                            {formatTime(safeMessage.timestamp)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })} */}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {showSuggestions && messages.length === 0 && (
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
