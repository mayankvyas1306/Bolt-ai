import ChatView from "@/components/custom/ChatView";
import CodeView from "@/components/custom/CodeView";
import { Code,Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import React from "react";

const Workspace = () => {
  return (
    <div className="p-3 pr-5 mt-3">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2Icon className="animate-spin h-10 w-10" />
          <p className="ml-3">Loading workspace...</p>
        </div>
      }>
        <div className="grid grid-cols-4 gap-10">
          <ChatView />
          <div className="col-span-3">
            <CodeView />
          </div>
        </div>
      </Suspense>
    </div>
  );
};

export default Workspace;
