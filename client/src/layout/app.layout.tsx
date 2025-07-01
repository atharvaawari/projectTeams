import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/auth-provider";
import Asidebar from "@/components/asidebar/asidebar";
import ChatWidget from "@/components/rightSidebar/ChatWidget";
import Header from "@/components/header";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import CreateProjectDialog from "@/components/workspace/project/create-project-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming you're using shadcn/ui
import { MessageSquare } from "lucide-react"; // Or any other chat icon you prefer

const AppLayout = () => {

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <SidebarProvider>
        <Asidebar />
        <SidebarInset className="overflow-x-hidden ">
          <div className="w-full">
            <>
              <Header  />
              <div className="px-3 lg:px-20 py-3">
                <Outlet />
              </div>
            </>
            <CreateWorkspaceDialog />
            <CreateProjectDialog />
          </div>
        </SidebarInset>
        
      </SidebarProvider>
      <ChatWidget
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
        />

      {/* AI Chat Button and Box */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <Button
          onClick={() => setIsRightSidebarOpen((isOpen)=> !isOpen )}
          className="rounded-full w-12 h-12 p-0"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>
    </AuthProvider>
  );
};

export default AppLayout;
