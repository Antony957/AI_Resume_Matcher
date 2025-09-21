import fs from "fs";

import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: resumeId } = await params;

    // 获取简历信息
    const { data: resumeProfile, error: profileError } = await supabase
      .from("resume")
      .select("file_id, full_name")
      .eq("id", resumeId)
      .single();

    if (profileError || !resumeProfile?.file_id) {
      return NextResponse.json({ error: "简历未找到" }, { status: 404 });
    }

    // 获取文件信息
    const { data: resumeFile, error: fileError } = await supabase
      .from("files")
      .select("storage_path, file_name")
      .eq("id", resumeProfile.file_id)
      .single();

    if (fileError || !resumeFile?.storage_path) {
      return NextResponse.json({ error: "PDF文件未找到" }, { status: 404 });
    }

    // 处理文件路径
    let filePath = resumeFile.storage_path;

    if (filePath.startsWith("file:///")) {
      filePath = filePath.replace("file:///", "");
      try {
        filePath = decodeURIComponent(filePath);
      } catch (e) {
        // 忽略解码错误
      }
    }

    // 使用Windows路径格式
    filePath = filePath.replace(/\/\//g, "/").replace(/\\\\/g, "\\");
    if (process.platform === "win32") {
      filePath = filePath.replace(/\//g, "\\");
    }

    // 查找文件
    let finalFilePath = filePath;

    if (!fs.existsSync(filePath)) {
      const fileName = filePath.split(/[\/\\]/).pop();
      const pathSeparator = process.platform === "win32" ? "\\" : "/";
      const baseDir = filePath.substring(
        0,
        filePath.lastIndexOf(pathSeparator),
      );

      // 尝试不同目录
      const tryDirectories = [
        baseDir.replace(
          /[\/\\]processing[\/\\]/,
          `${pathSeparator}completed${pathSeparator}`,
        ),
        baseDir.replace(
          /[\/\\]completed[\/\\]/,
          `${pathSeparator}processing${pathSeparator}`,
        ),
        baseDir.replace(
          /[\/\\]pending[\/\\]/,
          `${pathSeparator}completed${pathSeparator}`,
        ),
        baseDir,
      ];

      let found = false;

      for (const tryDir of tryDirectories) {
        const tryPath = `${tryDir}${pathSeparator}${fileName}`;

        if (fs.existsSync(tryPath)) {
          finalFilePath = tryPath;
          found = true;
          break;
        }
      }

      if (!found) {
        return NextResponse.json({ error: "PDF文件不存在" }, { status: 404 });
      }
    }

    // 读取和返回文件
    const fileBuffer = fs.readFileSync(finalFilePath);
    const safeFileName = encodeURIComponent(
      resumeFile.file_name || "resume.pdf",
    );

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${safeFileName}`,
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
