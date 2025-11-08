// components/custom/AppSideBar.jsx
"use client";
import React, { useContext, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Button } from "../ui/button";
import { MessageCircleCode, Settings, HelpCircle, LogOut, Plus } from "lucide-react";
import WorkspaceHistory from "./WorkspaceHistory";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useSidebar } from "@/components/ui/sidebar";
import SideBarFooter from "./SideBarFooter";

const AppSideBar = () => {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { toggleSidebar } = useSidebar();

  // <-- renamed to match the onClick usage
  const handleNewChat = () => {
    router.push("/");
    toggleSidebar();
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    router.push("/settings");
    toggleSidebar();
  };

  const handleHelp = () => {
    console.log("Help clicked");
    if (typeof window !== "undefined") window.open("https://docs.example.com", "_blank");
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    setUserDetail?.(null);
    router.push("/");
    toggleSidebar();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Image src={"/logo.png"} alt="Logo" width={30} height={30} />
          <span className="font-bold text-lg">Bolt AI</span>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Start New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-5">
        <SidebarGroup>
          <WorkspaceHistory />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 border-t">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>

          <Button variant="ghost" className="w-full justify-start" onClick={handleHelp}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help Center
          </Button>

          {userDetail && (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>

        {userDetail && (
          <div className="flex items-center gap-3 p-3 mt-4 rounded-lg bg-accent">
            <Image src={userDetail.picture} alt="User" width={40} height={40} className="rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userDetail.name}</p>
              <p className="text-xs text-gray-500 truncate">{userDetail.email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSideBar;
