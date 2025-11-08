import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";

export async function POST(req){
    const {prompt}=await req.json();
    try{
        const result=GenAiCode.sendMessage(prompt);
        const resp=(await result).response.text();
        return NextResponse.json(JSON.parse(resp));
    }catch(e){
        console.error("Code generation error:",e);
        return NextResponse.json(
            {error:"Code generation failed"},
            {status:500}
        );
    }
}