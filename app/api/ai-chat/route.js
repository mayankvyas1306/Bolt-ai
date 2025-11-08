import { NextResponse } from "next/server";
import { chatSession } from "@/configs/AiModel";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req){

    const session = await getServerSession(authOptions);
    if(!session){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status: 401}
        );
    }

    const {prompt}=await req.json();
    try{
        const result=await chatSession.sendMessage(prompt);
        const AIResp=await result.response.text();

        return NextResponse.json({result:AIResp});
    }catch(e){
        console.error("AI Error:",e);
        return NextResponse.json(
            {error:"Failed to generate response"},
            {status:500}
        );

    }
}