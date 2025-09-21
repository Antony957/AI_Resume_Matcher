import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // 修复：改为Promise类型
) {
  try {
    // 修复：添加await等待params解析
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Position ID is required",
        },
        { status: 400 },
      );
    }

    // 获取职位详细信息
    const { data: position, error } = await supabase
      .from("positions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching position:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    if (!position) {
      return NextResponse.json(
        {
          success: false,
          error: "Position not found",
        },
        { status: 404 },
      );
    }

    // 根据新表结构调整字段处理
    const positionData = {
      ...position,
      position_name: position.position_name,
      company_name: position.company_name,
      location: position.location,
      salary_range: position.salary_range,
      job_description: position.job_description,
      requirements: position.requirements,
      tags: position.tags || [],
      required_skills: position.required_skills || [],
      tech_stack: position.tech_stack || [],
      min_years_experience: position.min_years_experience || 0,
      max_years_experience: position.max_years_experience || 20,
      min_education_level: position.min_education_level,
      preferred_education_level: position.preferred_education_level,
      education_levels: position.education_levels || [],
      university_levels: position.university_levels || [],
      degree_levels: position.degree_levels || [],
      // 新增：硬性关键字
      mandatory_keywords: position.mandatory_keywords || [],
      mandatory_logic: position.mandatory_logic || 'all',
      // 保持向后兼容
      requirement_details: position.requirement_json || {},
    };

    return NextResponse.json({
      success: true,
      data: positionData,
      message: "Position fetched successfully",
    });
  } catch (error) {
    console.error("Error in position detail API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
