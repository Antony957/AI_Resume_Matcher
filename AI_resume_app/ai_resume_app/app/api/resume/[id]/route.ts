import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Resume ID is required" },
        { status: 400 },
      );
    }

    // 获取简历详细信息
    const { data: resume, error } = await supabase
      .from("resume")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching resume:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: resume,
      message: "Resume fetched successfully",
    });
  } catch (error) {
    console.error("Error in resume detail API:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
