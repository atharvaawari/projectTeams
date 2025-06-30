import { X, Send, Loader, FileText, Users, Clock, CheckCircle } from "lucide-react";
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
import { useMediaQuery } from "@/hooks/use-media-query";

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

type RightSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
};

const formSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

// Sample chat history data
const SAMPLE_CHAT_HISTORY: Message[] = [
  {
    id: "1",
    content: "Welcome to the Project Assistant! How can I help you today?",
    role: "assistant",
    timestamp: new Date(Date.now() - 3600000 * 3), // 3 hours ago
  },
  {
    id: "2",
    content: "You can ask me about tasks, deadlines, team members, or project documents.",
    role: "assistant",
    timestamp: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: "3",
    content: "What's the status of the current sprint?",
    role: "user",
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
  },
  {
    id: "4",
    content: "The current sprint is 75% complete with 3 tasks remaining. The deadline is Friday.",
    role: "assistant",
    timestamp: new Date(Date.now() - 3600000 * 2),
    sources: [
      { title: "Sprint Report", url: "#" },
      { title: "Project Timeline", url: "#" }
    ]
  },
  {
    id: "5",
    content: "Who is working on the authentication module?",
    role: "user",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: "6",
    content: "Sarah Johnson and Michael Chen are assigned to the authentication module.",
    role: "assistant",
    timestamp: new Date(Date.now() - 3600000),
    sources: [
      { title: "Team Assignments", url: "#" }
    ]
  }
];

const RightSidebar = ({ isOpen, onClose, projectId }: RightSidebarProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(SAMPLE_CHAT_HISTORY);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Initialize with project-specific message if projectId is provided
  useEffect(() => {
    if (projectId) {
      setMessages(prev => [
        {
          id: Date.now().toString(),
          content: `Welcome to the Project Assistant for project ${projectId}!`,
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
            title: source.title || "Project Document",
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full bg-white dark:bg-zinc-900 border-l z-50 transform transition-transform duration-300 flex flex-col",
        isDesktop ? "w-[30vw]" : "w-[80vw]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Project Assistant</h2>
          {projectId && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
              Project #{projectId}
            </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                <AvatarImage src="/ai-avatar.png" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-zinc-800"
              )}
            >
              <p>{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-700">
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Sources:
                  </p>
                  <ul className="space-y-1">
                    {message.sources.map((source, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
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

      {/* Suggested Queries */}
      <div className="px-2 py-2 border-t">
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
          Try asking:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => form.setValue("query", "What are the upcoming deadlines?")}
          >
            <Clock className="h-3 w-3 mr-1" />
            Deadlines
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => form.setValue("query", "Sumarize the project?")}
          >
            <Users className="h-3 w-3 mr-1" />
            Team
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => form.setValue("query", "What are the current project goals?")}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Goals
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => form.setValue("query", "Show me pending tasks")}
          >
            <FileText className="h-3 w-3 mr-1" />
            Tasks
          </Button>
        </div>
      </div>

      {/* Input Area */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-t flex items-center gap-2 px-4 py-3"
      >
        <Input
          type="text"
          placeholder="Ask about the project..."
          className="flex-1"
          {...form.register("query")}
        />
        <Button
          type="submit"
          size="sm"
          className="rounded-full"
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
  );
};

export default RightSidebar;