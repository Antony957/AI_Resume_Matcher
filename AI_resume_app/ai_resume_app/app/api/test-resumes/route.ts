import { NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

export async function GET() {
  try {
    // 获取所有简历数据，按有标签的优先显示
    const { data: resumes, error } = await supabase
      .from("resume")
      .select("id, full_name, tags, status")
      .in("status", ["processed", "tagged", "matched"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching test resumes:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Test resumes:", resumes);

    // 分类统计
    const withTags = resumes?.filter((r) => r.tags && r.tags.length > 0) || [];
    const withoutTags =
      resumes?.filter((r) => !r.tags || r.tags.length === 0) || [];

    // 技术标签统计
    const technicalTags = [
      "java",
      "go",
      "python",
      "rust",
      "c++",
      "后端",
      "前端",
      "全栈",
      "架构师",
    ];
    const technicalResumes = withTags.filter((r) =>
      r.tags.some((tag) =>
        technicalTags.some((techTag) =>
          tag.toLowerCase().includes(techTag.toLowerCase()),
        ),
      ),
    );

    return NextResponse.json({
      total: resumes?.length || 0,
      withTags: withTags.length,
      withoutTags: withoutTags.length,
      technicalResumes: technicalResumes.length,
      resumes: resumes || [],
      sampleTechnical: technicalResumes.slice(0, 3),
      sampleNonTechnical: withTags
        .filter((r) => !technicalResumes.includes(r))
        .slice(0, 3),
      message: "Test data fetched successfully",
    });
  } catch (error) {
    console.error("Error in test resumes API:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
