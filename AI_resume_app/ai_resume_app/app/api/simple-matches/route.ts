import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

// 获取简化匹配结果
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "positions"; // positions | resumes
    const limit = parseInt(searchParams.get("limit") || "50");

    if (view === "positions") {
      // 获取职位的匹配统计
      const { data: matches, error: matchError } = await supabase
        .from("simple_matches")
        .select(
          `
            position_id,
            tag_match_count,
            tag_match_ratio,
            education_match,
            created_at,
            positions!inner (
              id,
              position_name,
              company_name,
              tags,
              university_levels,
              degree_levels,
              min_education_level,
              status,
              location,
              salary_range,
              created_at
            )
          `,
        )
        .order("created_at", { ascending: false })
        .limit(limit * 5); // 获取更多数据用于聚合

      if (matchError) {
        console.error("获取匹配数据失败:", matchError);

        return NextResponse.json(
          { error: matchError.message },
          { status: 500 },
        );
      }

      // 按职位聚合数据
      const positionStats = new Map();

      matches?.forEach((match) => {
        const positionId = match.position_id;
        const position = match.positions;

        if (!positionStats.has(positionId)) {
          positionStats.set(positionId, {
            position: {
              ...position,
              position_name: position.position_name, // 直接使用 position_name
            },
            total_matches: 0,
            tag_matches: 0,
            education_matches: 0,
            latest_match_date: match.created_at,
            avg_tag_ratio: 0,
            match_details: [],
          });
        }

        const stats = positionStats.get(positionId);

        stats.total_matches++;
        if (match.tag_match_count > 0) stats.tag_matches++;
        if (match.education_match) stats.education_matches++;
        if (new Date(match.created_at) > new Date(stats.latest_match_date)) {
          stats.latest_match_date = match.created_at;
        }
        stats.match_details.push({
          tag_match_count: match.tag_match_count,
          tag_match_ratio: match.tag_match_ratio,
          education_match: match.education_match,
          created_at: match.created_at,
        });
      });

      // 计算平均标签匹配比例
      positionStats.forEach((stats) => {
        const totalRatio = stats.match_details.reduce(
          (sum: number, detail: any) => sum + (detail.tag_match_ratio || 0),
          0,
        );

        stats.avg_tag_ratio =
          stats.total_matches > 0 ? totalRatio / stats.total_matches : 0;
      });

      // 转换为数组并排序
      const result = Array.from(positionStats.values())
        .sort(
          (a, b) =>
            new Date(b.latest_match_date).getTime() -
            new Date(a.latest_match_date).getTime(),
        )
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        data: result,
        total: result.length,
      });
    } else if (view === "resumes") {
      // 获取简历的匹配统计
      const { data: matches, error: matchError } = await supabase
        .from("simple_matches")
        .select(
          `
            resume_id,
            tag_match_count,
            tag_match_ratio,
            education_match,
            created_at,
            resume!inner (
              id,
              full_name,
              tags,
              education_levels,
              highest_education_level,
              years_experience,
              status,
              created_at
            )
          `,
        )
        .order("created_at", { ascending: false })
        .limit(limit * 5);

      if (matchError) {
        console.error("获取简历匹配数据失败:", matchError);

        return NextResponse.json(
          { error: matchError.message },
          { status: 500 },
        );
      }

      // 按简历聚合数据
      const resumeStats = new Map();

      matches?.forEach((match) => {
        const resumeId = match.resume_id;
        const resume = match.resume;

        if (!resumeStats.has(resumeId)) {
          resumeStats.set(resumeId, {
            resume: resume,
            total_matches: 0,
            tag_matches: 0,
            education_matches: 0,
            latest_match_date: match.created_at,
            avg_tag_ratio: 0,
            match_details: [],
          });
        }

        const stats = resumeStats.get(resumeId);

        stats.total_matches++;
        if (match.tag_match_count > 0) stats.tag_matches++;
        if (match.education_match) stats.education_matches++;
        if (new Date(match.created_at) > new Date(stats.latest_match_date)) {
          stats.latest_match_date = match.created_at;
        }
        stats.match_details.push({
          tag_match_count: match.tag_match_count,
          tag_match_ratio: match.tag_match_ratio,
          education_match: match.education_match,
          created_at: match.created_at,
        });
      });

      // 计算平均标签匹配比例
      resumeStats.forEach((stats) => {
        const totalRatio = stats.match_details.reduce(
          (sum: number, detail: any) => sum + (detail.tag_match_ratio || 0),
          0,
        );

        stats.avg_tag_ratio =
          stats.total_matches > 0 ? totalRatio / stats.total_matches : 0;
      });

      // 转换为数组并排序
      const result = Array.from(resumeStats.values())
        .sort(
          (a, b) =>
            new Date(b.latest_match_date).getTime() -
            new Date(a.latest_match_date).getTime(),
        )
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        data: result,
        total: result.length,
      });
    }

    return NextResponse.json(
      { error: "Invalid view parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("获取简化匹配结果失败:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// 获取特定职位或简历的详细匹配结果
export async function POST(request: NextRequest) {
  try {
    console.log("=== POST simple-matches 调试信息 ===");

    const body = await request.json();

    console.log("请求体 body:", JSON.stringify(body, null, 2));

    const { type, id, resume_id, position_id } = body;

    console.log("解析参数 - type:", type);
    console.log("解析参数 - id:", id);
    console.log("解析参数 - resume_id:", resume_id);
    console.log("解析参数 - position_id:", position_id);

    // 处理 match_detail 类型的请求
    if (type === "match_detail") {
      console.log("✅ 处理 match_detail 请求");

      if (!resume_id || !position_id) {
        console.log("❌ match_detail 缺少必需参数");

        return NextResponse.json(
          {
            error:
              "Missing required parameters for match_detail: resume_id and position_id",
            received: { resume_id, position_id },
          },
          { status: 400 },
        );
      }

      // 获取特定简历和职位之间的匹配详情
      const { data: matchDetail, error } = await supabase
        .from("simple_matches")
        .select(
          `
              *,
              resume!inner (
                id,
                full_name,
                tags,
                education_levels,
                highest_education_level,
                years_experience,
                phone,
                email,
                status,
                summary,
                skills,
                work_experience,
                education
              ),
              positions!inner (
                id,
                position_name,
                company_name,
                tags,
                university_levels,
                degree_levels,
                min_education_level,
                location,
                salary_range,
                status,
                job_description,
                requirements,
                required_skills
              )
            `,
        )
        .eq("resume_id", resume_id)
        .eq("position_id", position_id)
        .single();

      if (error) {
        console.error("获取匹配详情失败:", error);

        return NextResponse.json(
          {
            error: "Match detail not found",
            details: error.message,
          },
          { status: 404 },
        );
      }

      console.log("✅ 匹配详情查询成功");

      return NextResponse.json({
        success: true,
        data: matchDetail,
        message: "Match detail fetched successfully",
      });
    }

    // 原有的 position/resume 类型处理
    if (!type || !id) {
      console.log("❌ 参数验证失败 - 缺少必需参数");

      return NextResponse.json(
        {
          error: "Missing required parameters: type and id",
          received: { type, id },
        },
        { status: 400 },
      );
    }

    if (type !== "position" && type !== "resume") {
      console.log("❌ 参数验证失败 - type值无效:", type);

      return NextResponse.json(
        {
          error:
            "Invalid type parameter. Must be 'position', 'resume', or 'match_detail'",
          received: type,
        },
        { status: 400 },
      );
    }

    console.log("✅ 参数验证通过，继续处理...");

    if (type === "position") {
      console.log("处理职位匹配查询，position_id:", id);

      const { data: matches, error } = await supabase
        .from("simple_matches")
        .select(
          `
              resume_id,
              tag_match_count,
              tag_match_ratio,
              education_match,
              match_details,
              created_at,
              resume!inner (
                id,
                full_name,
                tags,
                education_levels,
                highest_education_level,
                years_experience,
                phone,
                email,
                location,
                headline,
                summary,
                skills,
                certifications,
                languages,
                work_experience,
                projects,
                education,
                recommend_person,
                status
              )
            `,
        )
        .eq("position_id", id)
        .order("tag_match_count", { ascending: false })
        .order("tag_match_ratio", { ascending: false });

      if (error) {
        console.error("获取职位匹配数据失败:", error);

        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(
        "✅ 职位匹配查询成功，找到",
        matches?.length || 0,
        "条匹配记录",
      );

      return NextResponse.json({
        success: true,
        data: matches,
        total: matches?.length || 0,
      });
    } else if (type === "resume") {
      console.log("处理简历匹配查询，resume_id:", id);

      const { data: matches, error } = await supabase
        .from("simple_matches")
        .select(
          `
              position_id,
              tag_match_count,
              tag_match_ratio,
              education_match,
              match_details,
              created_at,
              positions!inner (
                id,
                position_name,
                company_name,
                tags,
                university_levels,
                degree_levels,
                min_education_level,
                location,
                salary_range,
                job_description,
                requirements,
                required_skills,
                status
              )
            `,
        )
        .eq("resume_id", id)
        .order("tag_match_count", { ascending: false })
        .order("tag_match_ratio", { ascending: false });

      if (error) {
        console.error("获取简历匹配数据失败:", error);

        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(
        "✅ 简历匹配查询成功，找到",
        matches?.length || 0,
        "条匹配记录",
      );

      const processedMatches = matches?.map((match) => ({
        ...match,
        positions: {
          ...match.positions,
          position_name: match.positions.position_name,
        },
      }));

      return NextResponse.json({
        success: true,
        data: processedMatches,
        total: processedMatches?.length || 0,
      });
    }

    console.log("❌ 未知的处理分支");

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("❌ POST simple-matches 异常:", error);

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
