import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

// 表结构建议：
// create table public.position_keyword_dictionary (
//   id uuid primary key default gen_random_uuid(),
//   keyword text not null,
//   created_at timestamptz not null default now()
// );
// create unique index position_keyword_dictionary_keyword_unique_ci
//   on public.position_keyword_dictionary (lower(keyword));

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("position_keyword_dictionary")
      .select("keyword")
      .order("keyword", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch position keywords" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw = (body?.tag_name || body?.keyword || "").toString();
    const keyword = raw.trim().toLowerCase();

    if (!keyword) {
      return NextResponse.json({ error: "keyword 不能为空" }, { status: 400 });
    }

    // 存在性检查（大小写不敏感）
    const { data: existed, error: selErr } = await supabase
      .from("position_keyword_dictionary")
      .select("keyword")
      .ilike("keyword", keyword)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (existed) {
      return NextResponse.json({ data: existed, message: "exists" });
    }

    const { data, error } = await supabase
      .from("position_keyword_dictionary")
      .insert([{ keyword }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create position keyword" },
      { status: 500 },
    );
  }
}


