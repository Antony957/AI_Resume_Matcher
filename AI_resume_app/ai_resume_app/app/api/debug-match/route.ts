import { NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

export async function GET() {
  try {
    // 检查 match_result 表的数据
    const { data: matchResults, error: matchError } = await supabase
      .from("match_result")
      .select("*")
      .limit(10);

    if (matchError) {
      console.error("查询 match_result 失败:", matchError);
    }

    // 检查 resume_positions 表的数据
    const { data: positions, error: positionError } = await supabase
      .from("resume_positions")
      .select("id, position, company_name")
      .limit(5);

    if (positionError) {
      console.error("查询 resume_positions 失败:", positionError);
    }

    // 检查 resume 表的数据
    const { data: profiles, error: profileError } = await supabase
      .from("resume")
      .select("id, full_name")
      .limit(5);

    if (profileError) {
      console.error("查询 resume 失败:", profileError);
    }

    return NextResponse.json({
      debug: {
        match_results: {
          count: matchResults?.length || 0,
          data: matchResults || [],
          error: matchError?.message,
        },
        positions: {
          count: positions?.length || 0,
          data: positions || [],
          error: positionError?.message,
        },
        profiles: {
          count: profiles?.length || 0,
          data: profiles || [],
          error: profileError?.message,
        },
      },
    });
  } catch (error) {
    console.error("调试API失败:", error);

    return NextResponse.json(
      { error: "服务器内部错误", details: error },
      { status: 500 },
    );
  }
}
