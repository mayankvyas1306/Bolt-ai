"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import Header from "@/components/custom/Header";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSideBar from "@/components/custom/AppSideBar";
import { useRouter } from "next/navigation";
import { ActionContext } from "@/context/ActionContext";
import { Toaster } from "react-hot-toast";

const Provider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [userDetail, setUserDetail] = useState(null);
  const [actions, setActions] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const convex = useConvex();
  const router = useRouter();

  useEffect(() => {
    IsAuthenticated();
  }, []);

  const IsAuthenticated = async () => {
    try {
      setIsLoading(true);
      
      // Check session from cookie first
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (sessionData?.user?.email) {
        console.log("✅ Session found:", sessionData.user.email);
        
        // Get user from Convex
        const result = await convex.query(api.users.GetUser, { 
          email: sessionData.user.email 
        });
        
        if (result) {
          console.log("✅ User loaded from Convex:", result);
          setUserDetail(result);
        } else {
          console.log("⚠️ User not found in Convex, clearing session");
          setUserDetail(null);
        }
      } else {
        console.log("ℹ️ No active session");
        setUserDetail(null);
      }
    } catch (error) {
      console.error("❌ Authentication check failed:", error);
      setUserDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY}>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <MessagesContext.Provider value={{ messages, setMessages }}>
          <ActionContext.Provider value={{ actions, setActions }}>
            <NextThemesProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarProvider defaultOpen={false}>
                <AppSideBar />
                <main className="w-full">
                  <Header />
                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading...</p>
                      </div>
                    </div>
                  ) : (
                    children
                  )}
                </main>
              </SidebarProvider>
              <Toaster position="top-right" />
            </NextThemesProvider>
          </ActionContext.Provider>
        </MessagesContext.Provider>
      </UserDetailContext.Provider>
    </GoogleOAuthProvider>
  );
};

export default Provider;