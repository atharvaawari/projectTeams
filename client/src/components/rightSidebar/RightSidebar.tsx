import { X, Send, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { aiQueryMutationFn } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

type RightSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

const RightSidebar = ({ isOpen, onClose }: RightSidebarProps) => {

  const { mutate, isPending } = useMutation({
    mutationFn: aiQueryMutationFn,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit = (query: FormValues)=>{
    
    if (isPending) return;

    mutate(query, {
      onSuccess: data =>{
        console.log("AI response", data);
        form.reset();
      },
      onError:(error)=>{
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    })
  }

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-[320px] bg-white dark:bg-zinc-900 shadow-lg z-50 transform transition-transform duration-300 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Hi, How Can I Help You?</h2>
        <button onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <p>This is your RAG system output, recent queries, documents, etc.</p>
        {/* Add dynamic content here */}
      </div>

      {/* Input Area */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-t flex items-center gap-2 px-4 py-3"
      >
        <Input
          type="text"
          placeholder="Type a question..."
          className="flex-1"
          {...form.register("query")}
        />
        <Button 
        type="submit" 
        size="sm" 
        className="rounded-full"
        disabled={isPending}
        >
          {isPending ? <Loader className="h-3 w-3 animate-spin" />: <Send className="h-4 w-4" />}
          
        </Button>
      </form>
    </div>
  );
};

export default RightSidebar;
