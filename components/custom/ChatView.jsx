"use client";
import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessagesContext } from "@/context/MessagesContext";
import Colors from "@/data/Colors";
import { UserDetailContext } from "@/context/UserDetailContext";
import Image from "next/image";
import Lookup from "@/data/Lookup";
import { ArrowRight, Link as LinkIcon, Loader2Icon, Paperclip } from "lucide-react";
import Prompt from "@/data/Prompt";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useSidebar } from "../ui/sidebar";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

const ChatView = () => {
  const { id } = useParams();
  const convex = useConvex();
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailContext);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const UpdateMessages = useMutation(api.workspace.UpdateWorkspace);
  const { toggleSidebar } = useSidebar();

  const workspaceData = useQuery(
    api.workspace.GetWorkspace,
    id ? { workspaceId: id } : "skip"
  );

  useEffect(() => {
    if (workspaceData?.messages) {
      setMessages(workspaceData.messages);
    }
  }, [workspaceData]);

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
      toast.error("Failed to load workspace");
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
      console.log("📤 Sending prompt to AI:", PROMPT.substring(0, 100) + "...");

      const result = await axios.post("/api/ai-chat", { prompt: PROMPT });
      
      if (result.status === 200 && result.data?.result) {
        const aiResp = { role: "ai", content: result.data.result };
        const updatedMessages = [...messages, aiResp];
        setMessages(updatedMessages);
        await UpdateMessages({ messages: updatedMessages, workspaceId: id });
        toast.success("AI responded!");
      } else {
        console.warn("ai-chat unexpected response:", result);
        toast.error("Unexpected AI response");
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "AI returned an unexpected response." },
        ]);
      }
    } catch (err) {
      console.error("❌ Error calling /api/ai-chat:", err);
      
      let errorMessage = "Failed to get AI response";
      
      if (err?.response) {
        errorMessage = err.response.data?.error || err.response.data?.detail || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Sorry, I encountered an error: ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = (input) => {
    if (!input?.trim()) {
      toast.error("Please enter a message");
      return;
    }

    console.log("💬 User input:", input);
    
    let content = input;
    if (attachedFiles.length > 0) {
      content += "\n\nAttached files: " + attachedFiles.map(f => f.name).join(", ");
    }
    
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: content,
      },
    ]);
    setUserInput("");
    setAttachedFiles([]);
  };

  // Handle file attachment
  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(files);
      toast.success(`${files.length} file(s) attached`);
    }
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => null,
                  script: () => null,
                  iframe: () => null,
                }}
              >
                {msg.content}
              </ReactMarkdown>
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
        {userDetail && (
          <Image
            onClick={toggleSidebar}
            src={userDetail?.picture}
            className="rounded-full cursor-pointer"
            alt="user"
            width={30}
            height={30}
          />
        )}
        <div
          className="p-5 border rounded-xl max-w-xl w-full mt-3"
          style={{
            backgroundColor: Colors.BACKGROUND,
          }}
        >
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachedFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

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
              disabled={loading}
            />
            {userInput && (
              <button
                onClick={() => onGenerate(userInput)}
                disabled={loading}
                className="bg-green-700 p-2 h-9 w-8 rounded-md cursor-pointer flex-none transition-all duration-200 hover:bg-blue-500 hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <ArrowRight className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
          
          {/* Link/Attach button */}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleAttachFile}
              className="text-gray-400 hover:text-white transition-colors"
              title="Attach files"
              disabled={loading}
            >
              <LinkIcon className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;