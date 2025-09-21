import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

/**
 * LLM智能匹配API路由
 * 支持职位匹配简历和简历匹配职位的双向匹配
 */

// GET - 获取匹配结果
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'position' | 'resume' | 'statistics'
    const id = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "10");

    
    if (type === "position" && id) {
      // 获取职位的推荐简历
      const { data, error } = await supabase
        .from("llm_position_matches")
        .select(
          `
          resume_id,
          rank_order,
          overall_score,
          skill_match_score,
          experience_match_score,
          education_match_score,
          potential_score,
          match_reasons,
          risk_factors,
          created_at,
          resume_profiles!inner(
            id,
            full_name,
            headline,
            years_experience,
            location,
            skills
          )
        `,
        )
        .eq("position_id", id)
        .order("rank_order", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("获取职位匹配结果失败:", error);

        return NextResponse.json(
          { success: false, error: "获取匹配结果失败" },
          { status: 500 },
        );
      }

      const formattedData = data?.map((item) => ({
        resume_id: item.resume_id,
        rank_order: item.rank_order,
        overall_score: item.overall_score,
        skill_match_score: item.skill_match_score,
        experience_match_score: item.experience_match_score,
        education_match_score: item.education_match_score,
        potential_score: item.potential_score,
        match_reasons: item.match_reasons,
        risk_factors: item.risk_factors,
        matched_at: item.created_at,
        candidate_info: {
          full_name: item.resume_profiles?.full_name,
          headline: item.resume_profiles?.headline,
          years_experience: item.resume_profiles?.years_experience,
          location: item.resume_profiles?.location,
          skills: item.resume_profiles?.skills?.slice(0, 10) || [],
        },
      }));

      return NextResponse.json({
        success: true,
        data: formattedData || [],
        total: formattedData?.length || 0,
      });
    } else if (type === "resume" && id) {
      // 获取简历的推荐职位
      const { data, error } = await supabase
        .from("llm_resume_matches")
        .select(
          `
          position_id,
          rank_order,
          overall_score,
          skill_fit_score,
          experience_relevance_score,
          career_growth_score,
          company_culture_fit,
          match_reasons,
          development_suggestions,
          created_at,
          positions!inner(
            id,
            position_name,
            company_name,
            location,
            salary_range,
            level
          )
        `,
        )
        .eq("resume_id", id)
        .order("rank_order", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("获取简历匹配结果失败:", error);

        return NextResponse.json(
          { success: false, error: "获取匹配结果失败" },
          { status: 500 },
        );
      }

      const formattedData = data?.map((item) => ({
        position_id: item.position_id,
        rank_order: item.rank_order,
        overall_score: item.overall_score,
        skill_fit_score: item.skill_fit_score,
        experience_relevance_score: item.experience_relevance_score,
        career_growth_score: item.career_growth_score,
        company_culture_fit: item.company_culture_fit,
        match_reasons: item.match_reasons,
        development_suggestions: item.development_suggestions,
        matched_at: item.created_at,
        position_info: {
          position: item.positions?.position_name,
          company_name: item.positions?.company_name,
          location: item.positions?.location,
          salary: item.positions?.salary_range,
          level: item.positions?.level,
        },
      }));

      return NextResponse.json({
        success: true,
        data: formattedData || [],
        total: formattedData?.length || 0,
      });
    } else if (type === "statistics") {
      // 获取匹配统计信息
      const days = parseInt(searchParams.get("days") || "7");

      // 获取日统计
      const { data: dailyStats, error: dailyError } = await supabase
        .from("llm_match_statistics")
        .select("*")
        .gte(
          "date",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        )
        .order("date", { ascending: false });

      if (dailyError) {
        console.error("获取日统计失败:", dailyError);

        return NextResponse.json(
          { success: false, error: "获取统计信息失败" },
          { status: 500 },
        );
      }

      // 获取总体统计
      const { data: positionMatches, error: posError } = await supabase
        .from("llm_position_matches")
        .select("position_id, overall_score")
        .gte(
          "created_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        );

      const { data: resumeMatches, error: resError } = await supabase
        .from("llm_resume_matches")
        .select("resume_id, overall_score")
        .gte(
          "created_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        );

      if (posError || resError) {
        console.error("获取总体统计失败:", posError || resError);
      }

      // 获取任务统计
      const { data: taskStats, error: taskError } = await supabase
        .from("llm_match_tasks")
        .select("status")
        .gte(
          "created_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        );

      const taskStatusCount =
        taskStats?.reduce((acc: Record<string, number>, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;

          return acc;
        }, {}) || {};

      const uniquePositions = new Set(
        positionMatches?.map((p) => p.position_id),
      ).size;
      const uniqueResumes = new Set(resumeMatches?.map((r) => r.resume_id))
        .size;
      const avgScore = positionMatches?.length
        ? positionMatches.reduce((sum, p) => sum + (p.overall_score || 0), 0) /
          positionMatches.length
        : 0;

      const statistics = {
        period_days: days,
        daily_stats: dailyStats || [],
        totals: {
          positions_with_matches: uniquePositions,
          resumes_with_matches: uniqueResumes,
          average_match_score: Math.round(avgScore * 100) / 100,
        },
        task_status: taskStatusCount,
      };

      return NextResponse.json({
        success: true,
        data: statistics,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "缺少必需的参数: type和id" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("LLM匹配API错误:", error);

    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 },
    );
  }
}

// POST - 触发匹配任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, position_id, resume_id, batch_type } = body;

    // 这里需要调用后端Python服务的匹配接口
    // 由于前端无法直接调用Python服务，我们先记录任务到数据库
    
    if (action === "match_position" && position_id) {
      // 创建职位匹配任务
      const { error } = await supabase.from("llm_match_tasks").insert({
        task_type: "position_match",
        entity_id: position_id,
        status: "pending",
        priority: 5,
      });

      if (error) {
        console.error("创建职位匹配任务失败:", error);

        return NextResponse.json(
          { success: false, error: "创建匹配任务失败" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "职位匹配任务已创建，请等待处理",
        task_type: "position_match",
        entity_id: position_id,
      });
    } else if (action === "match_resume" && resume_id) {
      // 创建简历匹配任务
      const { error } = await supabase.from("llm_match_tasks").insert({
        task_type: "resume_match",
        entity_id: resume_id,
        status: "pending",
        priority: 5,
      });

      if (error) {
        console.error("创建简历匹配任务失败:", error);

        return NextResponse.json(
          { success: false, error: "创建匹配任务失败" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "简历匹配任务已创建，请等待处理",
        task_type: "resume_match",
        entity_id: resume_id,
      });
    } else if (action === "batch_match") {
      // 创建批量匹配任务
      const { error } = await supabase.from("llm_match_tasks").insert({
        task_type: "full_rematch",
        entity_id: "all",
        status: "pending",
        priority: 1,
      });

      if (error) {
        console.error("创建批量匹配任务失败:", error);

        return NextResponse.json(
          { success: false, error: "创建批量匹配任务失败" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "批量匹配任务已创建，请等待处理",
        task_type: "full_rematch",
        entity_id: "all",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "无效的操作或缺少必需参数" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("LLM匹配任务创建错误:", error);

    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 },
    );
  }
}
