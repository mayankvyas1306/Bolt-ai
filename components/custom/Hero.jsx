"use client"
import Colors from "@/data/Colors";
import Lookup from "@/data/Lookup";
import { ArrowRight, Link } from "lucide-react";
import React, { useContext, useState, useEffect } from "react";
import SigninDialog from "./SigninDialog";
import { MessagesContext } from "@/context/MessagesContext"; 
import { UserDetailContext } from "@/context/UserDetailContext"; 
import { useRouter } from "next/navigation";
import { useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

function Hero() {
  const [userInput, setUserInput] = useState();
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);
  const convex = useConvex();
  const router = useRouter();

  const onGenerate = async (input) => {
    if (!userDetail?.email) {
      setOpenDialog(true);
      return;
    }

    try {
      // ✅ FIX: Get the user from Convex database to get the _id
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

      // ✅ Now use the dbUser._id which is the Convex ID
      const workspaceId = await CreateWorkspace({
        user: dbUser._id,  // ✅ This is the correct Convex user ID
        messages: [newMessage]
      });

      console.log("✅ Workspace created:", workspaceId);
      
      // Update context
      setMessages([newMessage]);
      
      // Navigate to workspace
      router.push('/workspace/' + workspaceId);
    } catch (error) {
      console.error("❌ Error creating workspace:", error);
    }
  };

  return (
    <div className="flex flex-col items-center mt-36 xl:mt-42 gap-2">
      <h2 className="font-bold text-4xl">{Lookup.HERO_HEADING}</h2>
      <p className="text-gray-400 font-medium">{Lookup.HERO_DESC}</p>
      <div 
        className="p-5 border rounded-xl mx-xl w-150 mt-3" 
        style={{
          backgroundColor: Colors.BACKGROUND
        }}
      >
        <div className="flex gap-2">
          <textarea 
            placeholder={Lookup.INPUT_PLACEHOLDER} 
            className="outline-none bg-transparent w-full h-32 max-h-30 resize-none" 
            onChange={(event) => setUserInput(event.target.value)}
          />
          {userInput && (
            <ArrowRight 
              onClick={() => onGenerate(userInput)} 
              className="bg-green-700 p-2 h-9 w-8 rounded-md cursor-pointer" 
            />
          )}
        </div>
        <div>
          <Link className="h-5 w-5" />
        </div>
      </div>
      <div className="flex flex-wrap max-w-2xl justify-center gap-3 items-center mt-8">
        {(Lookup?.SUGGESTIONS ?? []).map((suggestion, index) => (
          <h2 
            key={index} 
            onClick={() => onGenerate(suggestion)}
            className="p-1 px-2 border rounded-full text-sm text-gray-400 hover:text-white cursor-pointer"
          >
            {suggestion}
          </h2>
        ))}
      </div>
      <SigninDialog openDialog={openDialog} closeDialog={(v) => setOpenDialog(v)} />
    </div>
  );
}

export default Hero;