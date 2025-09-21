import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const owner = formData.get("owner") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title || !owner) {
      return NextResponse.json(
        { error: "Title and owner are required" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and Word files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 15MB limit" },
        { status: 400 },
      );
    }

    // Create pipeline pending directory if it doesn't exist
    // Use Windows path that both WSL2 and Windows PowerShell can access
    const pipelinePath =
      "D:\\FeiYuzi\\project\\AI_resume\\file_pipeline\\uploads\\pending";

    if (!existsSync(pipelinePath)) {
      await mkdir(pipelinePath, { recursive: true });
    }

    // Generate unique filename with owner info
    const fileExtension = path.extname(file.name);
    const sanitizedOwner = owner.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-");
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${sanitizedOwner}-${sanitizedTitle}-${timestamp}${fileExtension}`;

    // Convert file to buffer and save to pipeline directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(pipelinePath, filename);

    await writeFile(filePath, buffer);

    console.log(`File uploaded successfully: ${filename} to ${filePath}`);

    return NextResponse.json({
      message: "File uploaded successfully",
      filename: filename,
      originalName: file.name,
      size: file.size,
      title: title,
      owner: owner,
      path: filePath,
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
