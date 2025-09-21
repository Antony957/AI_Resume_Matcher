import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
function generateResumeLanguages() {
  return [
    { id: uuidv4(), language: "普通话" },
    { id: uuidv4(), language: "英语" },
    { id: uuidv4(), language: "日语" },
    { id: uuidv4(), language: "法语" },
    { id: uuidv4(), language: "粤语" },
    { id: uuidv4(), language: "其他" },
  ];
}

export async function GET() {
  return NextResponse.json(generateResumeLanguages());
}
