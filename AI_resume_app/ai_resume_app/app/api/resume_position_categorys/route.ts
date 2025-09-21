import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
function generateResumePositionCategory() {
  return [
    { id: uuidv4(), category: "技术职位" },
    { id: uuidv4(), category: "非技术职位" },
    { id: uuidv4(), category: "业务-web3" },
    { id: uuidv4(), category: "业务-AI" },
    { id: uuidv4(), category: "业务-金融：" },
  ];
}

export async function GET() {
  return NextResponse.json(generateResumePositionCategory());
}
