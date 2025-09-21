import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

// 获取有匹配结果的职位列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get("position_id");

    if (positionId) {
      // 获取特定职位的匹配结果
      const { data: matchResults, error } = await supabase
        .from("match_result")
        .select(
          `
          *,
          resume(*)
        `,
        )
        .eq("position_id", positionId)
        .order("sum_score", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(matchResults || []);
    } else {
      // 获取所有有匹配结果的职位
      const { data: matchResults, error: matchError } = await supabase
        .from("match_result")
        .select("position_id, created_at")
        .order("created_at", { ascending: false });

      if (matchError) {
        return NextResponse.json(
          { error: matchError.message },
          { status: 500 },
        );
      }

      if (!matchResults?.length) {
        return NextResponse.json([]);
      }

      // 统计每个职位的匹配数量和最新匹配时间
      const positionStats = matchResults.reduce(
        (acc, match) => {
          if (!acc[match.position_id]) {
            acc[match.position_id] = {
              count: 0,
              latestDate: match.created_at,
            };
          }
          acc[match.position_id].count++;
          if (
            new Date(match.created_at) >
            new Date(acc[match.position_id].latestDate)
          ) {
            acc[match.position_id].latestDate = match.created_at;
          }

          return acc;
        },
        {} as Record<string, { count: number; latestDate: string }>,
      );

      // 获取职位详情
      const positionIds = Object.keys(positionStats);
      const { data: positions, error: positionError } = await supabase
        .from("positions")
        .select("*, resume_position_categorys(category)")
        .in("id", positionIds);

      if (positionError) {
        return NextResponse.json(
          { error: positionError.message },
          { status: 500 },
        );
      }

      // 合并数据
      const positionsWithStats =
        positions?.map((position) => ({
          ...position,
          match_count: positionStats[position.id].count,
          latest_match_date: positionStats[position.id].latestDate,
        })) || [];

      // 按最新匹配日期排序
      positionsWithStats.sort(
        (a, b) =>
          new Date(b.latest_match_date).getTime() -
          new Date(a.latest_match_date).getTime(),
      );

      return NextResponse.json(positionsWithStats);
    }
  } catch (error) {
    console.error("获取匹配结果失败:", error);

    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 可选：获取匹配统计信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "stats") {
      // 获取匹配统计信息
      const { data: matchResults, error } = await supabase
        .from("match_result")
        .select("position_id, sum_score, created_at");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const stats = {
        total_matches: matchResults?.length || 0,
        unique_positions: new Set(matchResults?.map((m) => m.position_id) || [])
          .size,
        average_score: matchResults?.length
          ? matchResults.reduce((sum, m) => sum + m.sum_score, 0) /
            matchResults.length
          : 0,
        latest_match: matchResults?.length
          ? Math.max(
              ...matchResults.map((m) => new Date(m.created_at).getTime()),
            )
          : null,
      };

      return NextResponse.json(stats);
    }

    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  } catch (error) {
    console.error("处理请求失败:", error);

    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
