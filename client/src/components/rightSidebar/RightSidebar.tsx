import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type RightSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const RightSidebar = ({ isOpen, onClose }: RightSidebarProps) => {
  

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-[320px] bg-white dark:bg-zinc-900 shadow-lg z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 ">
        <h2 className="text-lg font-semibold">Hi, How Can I help You</h2>
        <button onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto h-full">
        {/* Add your content here */}
        <p>This is your RAG system output, recent queries, documents, etc.</p>
      </div>
    </div>
  );
};

export default RightSidebar;
