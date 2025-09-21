import { NextResponse } from "next/server";

import { fetch } from "@/lib/supabaseApi";

export async function GET() {
  try {
    const resumeFiles = await fetch("files", {
      select: "*",
      orderBy: "created_at",
      ascending: false,
      limit: 50,
    });

    return NextResponse.json(resumeFiles || []);
  } catch (error) {
    console.error("Error fetching resume files:", error);

    return NextResponse.json(
      { error: "Failed to fetch resume files" },
      { status: 500 },
    );
  }
}
