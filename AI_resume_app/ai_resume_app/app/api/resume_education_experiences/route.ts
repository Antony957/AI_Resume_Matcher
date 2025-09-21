import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
function generateResumeEductionExperiences() {
  return [
    { id: uuidv4(), eduction_experience: "不限" },
    { id: uuidv4(), eduction_experience: "初中及以上" },
    { id: uuidv4(), eduction_experience: "中专/中技及以上" },
    { id: uuidv4(), eduction_experience: "高中及以上" },
    { id: uuidv4(), eduction_experience: "大专及以上" },
    { id: uuidv4(), eduction_experience: "本科及以上" },
    { id: uuidv4(), eduction_experience: "硕士及以上" },
    { id: uuidv4(), eduction_experience: "博士" },
  ];
}

export async function GET() {
  return NextResponse.json(generateResumeEductionExperiences());
}
