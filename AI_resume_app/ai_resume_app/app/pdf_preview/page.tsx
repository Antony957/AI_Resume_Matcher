"use client";

import dynamic from "next/dynamic";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import ResumeForm from "./ResumeForm";
const ResumePreview = dynamic(() => import("./ResumePreview"), {
  ssr: false,
});

export default function Page() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 pt-16 bg-white">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <Button color="primary" onPress={() => router.push("/manage")}>
          回到管理页
        </Button>
      </div>

      {/* 全屏PDF预览 */}
      <div className="flex h-full">
        <div className="w-2/3 p-2">
          <Suspense fallback={<div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">加载PDF预览中...</div>
            </div>
          </div>}>
            <ResumePreview />
          </Suspense>
        </div>
        <div className="w-1/3 border-l bg-gray-50 p-4 overflow-y-auto">
          <Suspense fallback={<div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full w-6 h-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">加载表单中...</div>
            </div>
          </div>}>
            <ResumeForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
