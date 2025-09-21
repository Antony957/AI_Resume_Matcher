"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";

import { supabase } from "@/config/supabaseClient";
import SimplePDFViewer from "@/components/SimplePDFViewer";

export default function ResumePreview() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("id");
  const [pdfUrl, setPdfUrl] = useState<string>("/test.pdf");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string>("简历预览");

  useEffect(() => {
    if (resumeId) {
      fetchExpectedPDFPath();
    } else {
      console.log("❌ 没有提供简历ID");
      setLoading(false);
    }
  }, [resumeId]);

  const fetchExpectedPDFPath = async () => {
    try {
      setLoading(true);
      setError(null);

      // 从resume表获取基本信息和file_id
      const { data: resumeProfile, error: profileError } = await supabase
        .from("resume")
        .select("file_id, full_name")
        .eq("id", resumeId)
        .single();

      if (profileError) {
        setError("未找到简历信息");

        return;
      }

      if (!resumeProfile?.file_id) {
        setError("简历文件ID未找到");

        return;
      }

      // 设置简历名称
      if (resumeProfile.full_name) {
        setResumeName(`${resumeProfile.full_name}的简历`);
      }

      // 从files表获取文件路径
      const { data: resumeFile, error: fileError } = await supabase
        .from("files")
        .select("storage_path, file_name")
        .eq("id", resumeProfile.file_id)
        .single();

      if (fileError) {
        setError("未找到PDF文件信息");

        return;
      }

      if (!resumeFile?.storage_path) {
        setError("PDF文件路径未找到");

        return;
      }

      // 通过API来提供PDF文件
      const apiUrl = `/api/pdf-file/${resumeId}`;

      setPdfUrl(apiUrl);
    } catch (err) {
      setError("加载PDF文件失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
          <p>正在加载PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-500">
          <p className="mb-4">⚠️ {error}</p>
          <Button color="primary" onPress={() => setError(null)}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <SimplePDFViewer fileName={`${resumeName}.pdf`} pdfUrl={pdfUrl} />
    </div>
  );
}
