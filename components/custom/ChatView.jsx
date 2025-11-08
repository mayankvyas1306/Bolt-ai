"use client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessagesContext } from "@/context/MessagesContext";
import Colors from "@/data/Colors";
import { UserDetailContext } from "@/context/UserDetailContext";
import Image from "next/image";
import Lookup from "@/data/Lookup";
import { ArrowRight, Link, Loader2Icon } from "lucide-react";
import Prompt from "@/data/Prompt";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useSidebar } from "../ui/sidebar";
import remarkGfm from 'remark-gfm';

const ChatView = () => {
  const { id } = useParams();
  const convex = useConvex();
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailContext);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const UpdateMessages = useMutation(api.workspace.UpdateWorkspace);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    if (id) {
      GetWorkspaceData();
    }
  }, [id]);

  // Get workspace data
  const GetWorkspaceData = async () => {
    try {
      const result = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });
      setMessages(result?.messages || []);
      console.log("📂 Workspace data loaded:", result);
    } catch (error) {
      console.error("❌ Error loading workspace:", error);
    }
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log("Last message:", lastMessage);
      if (lastMessage.role === "user") {
        GetAiResponse();
      }
    }
  }, [messages]);

  // Get AI response
  const GetAiResponse = async () => {
    console.log("🔵 Getting AI Response...");
    setLoading(true);

    try {
      const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;
      console.log("📤 Sending prompt to AI");

      const result = await axios.post("/api/ai-chat", {
        prompt: PROMPT,
      });

      console.log("📥 AI Response received:", result.data);

      if (!result.data.result) {
        throw new Error("No response from AI");
      }

      const aiResp = {
        role: "ai",
        content: result.data.result,
      };

      // Update messages state
      const updatedMessages = [...messages, aiResp];
      setMessages(updatedMessages);

      // Update in database
      await UpdateMessages({
        messages: updatedMessages,
        workspaceId: id,
      });

      console.log("✅ AI response added successfully");
    } catch (error) {
      console.error("❌ Error getting AI response:", error);
      // Show error to user
      const errorResp = {
        role: "ai",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorResp]);
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = (input) => {
    if (!input?.trim()) return;

    console.log("💬 User input:", input);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: input,
      },
    ]);
    setUserInput("");
  };

  return (
    <div className="flex flex-col h-[85vh] relative">
      <div className="flex-1 overflow-y-auto scrollbar-hide pl-5">
        {messages?.map((msg, index) => (
          <div
            key={index}
            className="p-3 rounded-lg mb-2 flex gap-2 items-start leading-7"
            style={{
              backgroundColor: Colors.CHAT_BACKGROUND,
            }}
          >
            {msg?.role === "user" && userDetail?.picture && (
              <Image
                src={userDetail.picture}
                alt="userImage"
                width={35}
                height={35}
                className="rounded-full flex-none"
              />
            )}
            {msg?.role === "ai" && (
              <div className="w-[35px] h-[35px] bg-blue-500 rounded-full flex items-center justify-center text-white flex-none text-xs font-bold">
                AI
              </div>
            )}
            <div className="flex-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                a:({node, ...props})=>null,
                script:()=>null,
                iframe: ()=>null,
              }}>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div
            className="p-3 rounded-lg mb-2 flex gap-2 items-start"
            style={{
              backgroundColor: Colors.CHAT_BACKGROUND,
            }}
          >
            <Loader2Icon className="animate-spin" />
            <h2>Generating response...</h2>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="flex gap-2 items-end">
        {userDetail && 
          <Image
            onClick={toggleSidebar}
            src={userDetail?.picture}
            className="rounded-full cursor-pointer"
            alt="user"
            width={30}
            height={30}
          />
        }
      <div className="p-5 border rounded-xl max-w-xl w-full mt-3" style=
        {{
          backgroundColor: Colors.BACKGROUND,
        }}>
        <div className="flex gap-2">
          <textarea
            placeholder={Lookup.INPUT_PLACEHOLDER}
            className="outline-none bg-transparent w-full h-32 max-h-30 resize-none"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onGenerate(userInput);
              }
            }}
          />
          {userInput && (
            <ArrowRight
              onClick={() => onGenerate(userInput)}
              className="bg-green-700 p-2 h-9 w-8 rounded-md cursor-pointer flex-none"
            />
          )}
        </div>
        <div>
          <Link className="h-5 w-5" />
        </div>
      </div>
    </div>
    </div>
  );
};

export default ChatView;
