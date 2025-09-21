import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
function generateResumeCollegeRequirements() {
  return [
    { id: uuidv4(), college_requirement: "统招本科" },
    { id: uuidv4(), college_requirement: "985" },
    { id: uuidv4(), college_requirement: "211" },
    { id: uuidv4(), college_requirement: "双一流" },
    { id: uuidv4(), college_requirement: "海外留学" },
    { id: uuidv4(), college_requirement: "其他" },
  ];
}

export async function GET() {
  return NextResponse.json(generateResumeCollegeRequirements());
}
