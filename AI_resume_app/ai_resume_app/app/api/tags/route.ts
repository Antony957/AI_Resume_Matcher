import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

// GET: 获取标签字典（可用于前端联想/选择）
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("tag_dictionary")
      .select("tag_name, category")
      .order("tag_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch tags" },
      { status: 500 },
    );
  }
}

// POST: 新增标签（若不存在）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tag_name_raw = (body?.tag_name || "").toString();
    const category = (body?.category || "").toString() || null;

    const tag_name = tag_name_raw.trim().toLowerCase();
    if (!tag_name) {
      return NextResponse.json({ error: "tag_name 不能为空" }, { status: 400 });
    }

    // 已存在则直接返回
    const { data: existed, error: selErr } = await supabase
      .from("tag_dictionary")
      .select("tag_name")
      .ilike("tag_name", tag_name)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (existed) {
      return NextResponse.json({ data: existed, message: "exists" });
    }

    const { data, error } = await supabase
      .from("tag_dictionary")
      .insert([{ tag_name, category }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create tag" },
      { status: 500 },
    );
  }
}


