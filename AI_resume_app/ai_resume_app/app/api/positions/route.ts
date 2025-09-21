import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

//GET - 获取所有职位
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 开始获取职位数据...");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    console.log("📋 查询参数:", { page, pageSize, status, search });

    let query = supabase.from("positions").select("*");

    // 添加状态过滤
    if (status && status !== "all") {
      query = query.eq("status", status);
      console.log("🔍 添加状态过滤:", status);
    }

    // 添加搜索功能
    if (search) {
      query = query.or(
        `position_name.ilike.%${search}%,company_name.ilike.%${search}%,location.ilike.%${search}%`,
      );
      console.log("🔍 添加搜索过滤:", search);
    }

    // 排序
    query = query.order("created_at", { ascending: false });

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    console.log("🔍 执行查询...");
    const { data, error, count } = await query;

    if (error) {
      console.error("❌ 获取职位失败:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ 查询成功, 数据量:", data?.length || 0);
    console.log("📊 总数:", count);

    return NextResponse.json({
      data,
      total: count,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取职位失败:", error);

    return NextResponse.json({ error: "获取职位失败" }, { status: 500 });
  }
}

// POST - 创建新职位
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      position_name,
      company_name,
      location,
      hc,
      salary_range,
      job_description,
      requirements,
      tags = [],
      racetrack,
      adviser,
      level,
      intern_available = false,
      reference,
      requirement_json = {},
      status = "active",
      urgency = "normal",
      // 新增字段
      mandatory_keywords = [],
      mandatory_logic = "all",
    } = body;

    // 验证必填字段
    if (!position_name || !job_description) {
      return NextResponse.json(
        { error: "职位名称和职位描述不能为空" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("positions")
      .insert([
        {
          position_name,
          company_name,
          location,
          hc,
          salary_range,
          job_description,
          requirements,
          tags,
          racetrack,
          adviser,
          level,
          intern_available,
          reference,
          requirement_json,
          status,
          urgency,
          mandatory_keywords,
          mandatory_logic,
        },
      ])
      .select();

    if (error) {
      console.error("创建职位失败:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error) {
    console.error("创建职位失败:", error);

    return NextResponse.json({ error: "创建职位失败" }, { status: 500 });
  }
}

// PUT - 更新职位
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少职位ID" }, { status: 400 });
    }

    // 添加更新时间
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("positions")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("更新职位失败:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "职位不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error("更新职位失败:", error);

    return NextResponse.json({ error: "更新职位失败" }, { status: 500 });
  }
}

// DELETE - 删除职位
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少职位ID" }, { status: 400 });
    }

    const { error } = await supabase.from("positions").delete().eq("id", id);

    if (error) {
      console.error("删除职位失败:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "职位删除成功" });
  } catch (error) {
    console.error("删除职位失败:", error);

    return NextResponse.json({ error: "删除职位失败" }, { status: 500 });
  }
}
