"use client"
import Colors from "@/data/Colors";
import Lookup from "@/data/Lookup";
import { ArrowRight, Link, Sparkles } from "lucide-react";
import React, { useContext, useState } from "react";
import SigninDialog from "./SigninDialog";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useRouter } from "next/navigation";
import { useMutation,useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

function Hero() {
  const [userInput, setUserInput] = useState("");
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);
  const convex = useConvex();
  const router = useRouter();
  
  const dbUser = useQuery(
  api.users.GetUser,
  userDetail?.email ? { email: userDetail.email } : "skip"
);
  const onGenerate = async (input) => {
    if (!userDetail?.email) {
      setOpenDialog(true);
      return;
    }

    if (!input?.trim()) return;

    setLoading(true);

    try {
      const dbUser = await convex.query(api.users.GetUser, {
        email: userDetail.email
      });

      if (!dbUser || !dbUser._id) {
        console.error("User not found in database");
        setOpenDialog(true);
        return;
      }

      console.log("📝 Creating workspace for user:", dbUser._id);

      const newMessage = {
        role: 'user',
        content: input
      };

      const workspaceId = await CreateWorkspace({
        user: dbUser._id,
        messages: [newMessage]
      });

      console.log("✅ Workspace created:", workspaceId);

      setMessages([newMessage]);
      setUserInput("");
      router.push('/workspace/' + workspaceId);
    } catch (error) {
      console.error("❌ Error creating workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-36 xl:mt-42 gap-2 px-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-10 w-10 text-blue-500 animate-pulse" />
        <h2 className="font-bold text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          {Lookup.HERO_HEADING}
        </h2>
      </div>
      <p className="text-gray-400 font-medium text-center max-w-2xl">
        {Lookup.HERO_DESC}
      </p>

      <div
        className="p-5 border rounded-xl max-w-2xl w-full mt-6 shadow-lg hover:shadow-xl transition-shadow"
        style={{
          backgroundColor: Colors.BACKGROUND
        }}
      >
        <div className="flex gap-2">
          <textarea
            placeholder={Lookup.INPUT_PLACEHOLDER}
            className="outline-none bg-transparent w-full h-32 max-h-30 resize-none text-gray-200"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !loading) {
                e.preventDefault();
                onGenerate(userInput);
              }
            }}
            disabled={loading}
          />
          {userInput && !loading && (
            <button
              onClick={() => onGenerate(userInput)}
              className="bg-green-700 p-2 h-9 w-8 rounded-md cursor-pointer flex-none transition-all duration-200 hover:bg-blue-500 hover:scale-110 hover:shadow-lg active:scale-95"
              aria-label="Generate"
            >
              <ArrowRight className="h-5 w-5 text-white" />
            </button>
          )}
          {loading && (
            <div className="bg-blue-500 p-2 h-9 w-8 rounded-md flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <div className="mt-2">
          <Link className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      <div className="flex flex-wrap max-w-3xl justify-center gap-3 items-center mt-8">
        {(Lookup?.SUGGESTIONS ?? []).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => !loading && onGenerate(suggestion)}
            disabled={loading}
            className="p-2 px-4 border rounded-full text-sm text-gray-400 hover:text-white hover:bg-blue-500 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <SigninDialog openDialog={openDialog} closeDialog={(v) => setOpenDialog(v)} />
    </div>
  );
}

export default Hero;