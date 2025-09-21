import { NextRequest, NextResponse } from "next/server";

import { fetch } from "@/lib/supabaseApi";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    console.log("API: 查询文件状态，文件名:", fileName);

    if (!fileName) {
      return NextResponse.json({ error: "fileName required" }, { status: 400 });
    }

    // 根据文件名查询处理状态
    const files: any[] = await fetch("files", {
      filter: { file_name: fileName },
      select:
        "id,file_name,ocr_status,llm_status,ocr_started_at,ocr_completed_at,llm_started_at,llm_completed_at,ocr_error,llm_error",
      limit: 1,
    });

    console.log("API: 查询结果:", files);

    if (!files || files.length === 0) {
      console.log("API: 文件未找到");

      return NextResponse.json({ found: false });
    }

    const file = files[0];

    console.log("API: 找到文件记录:", file);

    // 如果LLM处理完成，同时获取解析结果
    let profile = null;

    if (file.llm_status === "completed") {
      try {
        const profiles = await fetch("resume", {
          filter: { file_id: file.id },
          select: "*",
          limit: 1,
        });

        profile = profiles && profiles.length > 0 ? profiles[0] : null;
        console.log("API: 获取简历档案:", profile ? "成功" : "失败");
      } catch (profileError) {
        console.error("Error fetching profile:", profileError);
        // 继续执行，profile为null
      }
    }

    return NextResponse.json({
      found: true,
      file,
      profile,
    });
  } catch (error) {
    console.error("Error fetching resume status:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
