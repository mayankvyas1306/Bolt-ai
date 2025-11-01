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


const Provider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [userDetail, setUserDetail] = useState();
  const convex = useConvex();
  const [actions, setActions] = useState();
  const router=useRouter();
  

  useEffect(() => {
    IsAuthenticated();
  }, []);
  
  // ✅ FIX: Add closing brace here
  const IsAuthenticated = async () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.email) { // ✅ Add safety check
        const result = await convex.query(api.users.GetUser, { email: user?.email });
        setUserDetail(result);
        console.log(result);
        setUserDetail(result); // ✅ Set the user detail from database
      }
    }
  }; // ✅ This closing brace was missing

  return (
    <div>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY}>
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
          <MessagesContext.Provider value={{ messages, setMessages }}>
            <ActionContext.Provider value={{actions,setActions}}>
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
              {children}
                </main>
              </SidebarProvider>
            </NextThemesProvider>
            </ActionContext.Provider>
          </MessagesContext.Provider>
        </UserDetailContext.Provider>
      </GoogleOAuthProvider>
    </div>
  );
};

export default Provider;