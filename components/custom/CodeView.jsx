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
  const [generatedRawText, setGeneratedRawText] = useState(null);
  const [showRawViewer, setShowRawViewer] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const GetFiles = async () => {
    setLoading(true);
    try {
      const result = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });
      const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result?.fileData };
      setFiles(mergedFiles);
    } catch (e) {
      console.error("GetFiles error:", e);
      showNotification("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages?.length - 1]?.role;
      if (role === "user") {
        GenerateAiCode();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Handle export and deploy actions
  useEffect(() => {
    if (actions?.actionType === "export") {
      handleExport();
    } else if (actions?.actionType === "deploy") {
      handleDeploy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);

  const GenerateAiCode = async () => {
    setLoading(true);
    setGeneratedRawText(null);
    setShowRawViewer(false);

    // Build prompt
    const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;

    try {
      const result = await axios.post("/api/gen-ai-code", { prompt: PROMPT });

      if (result.status === 200) {
        const aiResp = result.data || {};

        // Prefer parsed (our robust route returns parsed and rawText)
        const parsed = aiResp.parsed || aiResp.files || aiResp.text || null;
        const rawText = aiResp.rawText || (typeof aiResp === "string" ? aiResp : null);

        if (parsed && parsed.files) {
          // If parsed has the JSON schema we expect
          const mergedFiles = { ...Lookup.DEFAULT_FILE, ...parsed.files };
          setFiles(mergedFiles);
          try {
            await UpdateFiles({ workspaceId: id, files: parsed.files || {} });
          } catch (updErr) {
            console.warn("Failed to persist generated files:", updErr);
          }
          showNotification("Code generated and loaded!");
        } else if (parsed && !parsed.files && parsed.projectTitle && parsed.files) {
          // defensive fallback (rare)
          const mergedFiles = { ...Lookup.DEFAULT_FILE, ...(parsed.files || {}) };
          setFiles(mergedFiles);
          try {
            await UpdateFiles({ workspaceId: id, files: parsed.files || {} });
          } catch (updErr) {
            console.warn("Failed to persist generated files:", updErr);
          }
          showNotification("Code generated and loaded!");
        } else if (aiResp.files && Object.keys(aiResp.files).length > 0) {
          // older shape: aiResp.files at root
          const mergedFiles = { ...Lookup.DEFAULT_FILE, ...aiResp.files };
          setFiles(mergedFiles);
          try {
            await UpdateFiles({ workspaceId: id, files: aiResp.files || {} });
          } catch (updErr) {
            console.warn("Failed to persist generated files:", updErr);
          }
          showNotification("Code generated and loaded!");
        } else {
          // No structured files — show raw text in a single file and show raw viewer
          const fallbackRaw = rawText || aiResp?.text || aiResp?.result || JSON.stringify(aiResp);
          setGeneratedRawText(fallbackRaw);
          setShowRawViewer(true);
          // Put raw output into Sandpack so user can see/copy it easily
          const rawFile = { "/AI_OUTPUT.txt": { code: fallbackRaw } };
          const mergedFiles = { ...Lookup.DEFAULT_FILE, ...rawFile };
          setFiles(mergedFiles);
          try {
            await UpdateFiles({ workspaceId: id, files: {} });
          } catch (updErr) {
            console.warn("Failed to persist placeholder files:", updErr);
          }
          showNotification("AI returned raw output (not structured). See Raw Output.");
        }
      } else {
        console.error("gen-ai-code unexpected response:", result);
        showNotification("Code generation failed.");
      }
    } catch (err) {
      console.error("Error calling /api/gen-ai-code:", err?.response ?? err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Server error while generating code.";
      showNotification(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportProject(files, "bolt-ai-project");
      showNotification(result.message);
    } catch (e) {
      console.error("Export error:", e);
      showNotification("Export failed.");
    }
  };

  const handleDeploy = async () => {
    try {
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
    } catch (e) {
      console.error("Deploy error:", e);
      showNotification("Failed to prepare deployment.");
    }
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(files);
    showNotification(result.message);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 4000);
  };

  // Download generated project as ZIP by calling server route /api/download-code
  const downloadGeneratedProject = async (parsedOrFiles) => {
    setLoading(true);
    try {
      // If parsedOrFiles has parsed.files, use that; if it's files object, use it directly.
      const payload = parsedOrFiles?.files ? { parsed: parsedOrFiles } : { files: parsedOrFiles || files };

      const resp = await fetch("/api/download-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        showNotification("Download failed: " + (err.error || resp.statusText));
        setLoading(false);
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-project.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotification("Downloaded generated project ZIP");
    } catch (e) {
      console.error("downloadGeneratedProject error:", e);
      showNotification("Failed to download project");
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center flex-wrap shrink-0 bg-black p-1 w-[200px] gap-3 justify-center">
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
            onClick={() => downloadGeneratedProject(files)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            title="Download generated project (ZIP)"
          >
            <Download className="h-4 w-4" />
            Download ZIP
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            title="Export project"
          >
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
              <SandpackFileExplorer style={{ height: "70vh" }} />
              <SandpackCodeEditor style={{ height: "70vh" }} />
            </>
          ) : (
            <SandpackPreview style={{ height: "70vh" }} showNavigator={true} />
          )}
        </SandpackLayout>
      </SandpackProvider>

      {/* Raw Viewer — show when we have raw output (fallback) */}
      {showRawViewer && (
        <div className="mt-3 p-3 bg-gray-900 rounded-md border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm text-white">Raw AI Output</h3>
            <div className="flex gap-2">
              <button
                onClick={() => downloadGeneratedProject({ "/AI_OUTPUT.txt": { code: generatedRawText } })}
                className="px-2 py-1 text-sm bg-gray-700 rounded text-white"
              >
                Download Raw
              </button>
              <button
                onClick={() => { setShowRawViewer(prev => !prev); }}
                className="px-2 py-1 text-sm bg-gray-700 rounded text-white"
              >
                {showRawViewer ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={generatedRawText || ""}
            rows={10}
            className="w-full bg-black text-white p-2 rounded text-sm font-mono"
          />
        </div>
      )}

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
