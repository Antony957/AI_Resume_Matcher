import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 等待params解析 - 修复Next.js 15异步问题
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Resume ID is required",
        },
        { status: 400 },
      );
    }

    // 修复表名: resume_profiles -> resume
    const { data: resume, error } = await supabase
      .from("resume")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching resume:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: "Resume not found",
        },
        { status: 404 },
      );
    }

    // 根据新表结构调整字段映射
    const resumeData = {
      ...resume,
      full_name: resume.full_name,
      years_experience: resume.years_experience || 0,
      phone: resume.phone,
      email: resume.email,
      location: resume.location,
      highest_education_level: resume.highest_education_level,
      education_levels: resume.education_levels || [],
      tags: resume.tags || [],
      summary: resume.summary,
      // 新表结构的字段
      education: resume.education || [],
      work_experience: resume.work_experience || [],
      projects: resume.projects || [],
      skills: resume.skills || [],
      certifications: resume.certifications || [],
      languages: resume.languages || [],
      extra_sections: resume.extra_sections || {},
    };

    return NextResponse.json({
      success: true,
      data: resumeData,
      message: "Resume fetched successfully",
    });
  } catch (error) {
    console.error("Error in resume detail API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
