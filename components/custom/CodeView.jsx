"use client";
import React, { useState, useEffect, useContext } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import axios from "axios";
import { MessagesContext } from "@/context/MessagesContext";
import Prompt from "@/data/Prompt";
import { useConvex, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Loader2Icon, Download, Rocket, Copy } from "lucide-react";
import { ActionContext } from "@/context/ActionContext";
import {
  exportProject,
  prepareForDeployment,
  copyToClipboard,
} from "@/utils/exportDeploy";

const CodeView = () => {
  const [activeTab, setActiveTab] = useState("code");
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
  const { messages } = useContext(MessagesContext);
  const { actions } = useContext(ActionContext);
  const UpdateFiles = useMutation(api.workspace.UpdateFiles);
  const { id } = useParams();
  const convex = useConvex();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");

  const workspaceData = useQuery(
    api.workspace.GetWorkspace,
    id ? { workspaceId: id } : "skip"
  );

  useEffect(() => {
    if (workspaceData?.fileData) {
      const mergedFiles = { ...Lookup.DEFAULT_FILE, ...workspaceData.fileData };
      setFiles(mergedFiles);
    }
  }, [workspaceData]);
  useEffect(() => {
    if (id) GetFiles();
  }, [id]);

  const GetFiles = async () => {
    setLoading(true);
    const result = await convex.query(api.workspace.GetWorkspace, {
      workspaceId: id,
    });
    const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result?.fileData };
    setFiles(mergedFiles);
    setLoading(false);
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages?.length - 1]?.role;
      if (role === "user") {
        GenerateAiCode();
      }
    }
  }, [messages]);

  // Handle export and deploy actions
  useEffect(() => {
    if (actions?.actionType === "export") {
      handleExport();
    } else if (actions?.actionType === "deploy") {
      handleDeploy();
    }
  }, [actions]);

  const GenerateAiCode = async () => {
    setLoading(true);
    const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;
    try {
      const result = await axios.post("/api/gen-ai-code", { prompt: PROMPT });
      if (result.status === 200) {
        const aiResp = result.data;
        const mergedFiles = {
          ...Lookup.DEFAULT_FILE,
          ...(aiResp?.files || aiResp?.text?.files || {}),
        };
        setFiles(mergedFiles);
        await UpdateFiles({ workspaceId: id, files: aiResp?.files || {} });
      } else {
        console.error("gen-ai-code unexpected response:", result);
        showNotification("Code generation failed.");
      }
    } catch (err) {
      console.error("Error calling /api/gen-ai-code:", err?.response ?? err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Server error while generating code.";
      showNotification(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const result = await exportProject(files, "bolt-ai-project");
    showNotification(result.message);
  };

  const handleDeploy = async () => {
    const result = prepareForDeployment(files);
    if (result.success) {
      // Download deployment guide
      const blob = new Blob([result.guide], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DEPLOYMENT_GUIDE.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    showNotification(result.message);
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(files);
    showNotification(result.message);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="relative">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top">
          {notification}
        </div>
      )}

      <div className="bg-[#181818] w-full p-2 border flex items-center justify-between">
        <div className="flex items-center flex-wrap shrink-0 bg-black p-1 w-[140px] gap-3 justify-center">
          <h2
            onClick={() => setActiveTab("code")}
            className={`text-sm cursor-pointer ${activeTab === "code" && "text-blue-100 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full"}`}
          >
            Code
          </h2>
          <h2
            onClick={() => setActiveTab("preview")}
            className={`text-sm cursor-pointer ${activeTab === "preview" && "text-blue-100 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full"}`}
          >
            Preview
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            title="Export project"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleDeploy}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
            title="Get deployment guide"
          >
            <Rocket className="h-4 w-4" />
            Deploy Guide
          </button>
        </div>
      </div>

      <SandpackProvider
        files={files}
        customSetup={{
          dependencies: {
            ...Lookup.DEPENDANCY,
          },
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
        template="react"
        theme={"dark"}
      >
        <SandpackLayout>
          {activeTab === "code" ? (
            <>
              <SandpackFileExplorer style={{ height: "80vh" }} />
              <SandpackCodeEditor style={{ height: "80vh" }} />
            </>
          ) : (
            <SandpackPreview style={{ height: "80vh" }} showNavigator={true} />
          )}
        </SandpackLayout>
      </SandpackProvider>

      {loading && (
        <div className="p-10 bg-gray-900 opacity-80 absolute top-0 rounded-lg w-full h-full flex items-center justify-center">
          <Loader2Icon className="animate-spin h-10 w-10 text-white" />
          <h2 className="text-white ml-3">Generating your files...</h2>
        </div>
      )}
    </div>
  );
};

export default CodeView;
