import React from "react";

import { ResumeFile } from "@/types";

interface ResumeProcessStatusProps {
  file: ResumeFile;
}

export function ResumeProcessStatus({ file }: ResumeProcessStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "processing":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
      case "completed":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "failed":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "等待中";
      case "processing":
        return "处理中";
      case "completed":
        return "完成";
      case "failed":
        return "失败";
      default:
        return "未知";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "processing":
        return "⚙️";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      default:
        return "❓";
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "未开始";

    return new Date(timeString).toLocaleString("zh-CN");
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
        📊 处理状态
      </h3>

      <div className="space-y-4">
        {/* 文件信息 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
          <div className="text-sm text-zinc-600 dark:text-zinc-300 mb-1">
            文件名称
          </div>
          <div className="font-medium text-zinc-800 dark:text-zinc-100 truncate">
            {file.file_name}
          </div>
        </div>

        {/* OCR状态 */}
        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(file.ocr_status)}</span>
            <div>
              <div className="font-medium text-zinc-800 dark:text-zinc-100">
                OCR 文本提取
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {file.ocr_started_at
                  ? `开始时间: ${formatTime(file.ocr_started_at)}`
                  : "未开始"}
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(file.ocr_status)}`}
          >
            {getStatusText(file.ocr_status)}
          </span>
        </div>

        {/* LLM状态 */}
        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(file.llm_status)}</span>
            <div>
              <div className="font-medium text-zinc-800 dark:text-zinc-100">
                AI 智能解析
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {file.llm_started_at
                  ? `开始时间: ${formatTime(file.llm_started_at)}`
                  : "未开始"}
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(file.llm_status)}`}
          >
            {getStatusText(file.llm_status)}
          </span>
        </div>

        {/* 错误信息 */}
        {file.ocr_error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="text-red-800 dark:text-red-400 font-medium mb-1">
              OCR 处理错误
            </div>
            <div className="text-red-600 dark:text-red-300 text-sm">
              {file.ocr_error}
            </div>
          </div>
        )}

        {file.llm_error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="text-red-800 dark:text-red-400 font-medium mb-1">
              AI 解析错误
            </div>
            <div className="text-red-600 dark:text-red-300 text-sm">
              {file.llm_error}
            </div>
          </div>
        )}

        {/* 进度指示器 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              整体进度
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {file.llm_status === "completed"
                ? "100%"
                : file.llm_status === "processing"
                  ? "75%"
                  : file.ocr_status === "completed"
                    ? "50%"
                    : file.ocr_status === "processing"
                      ? "25%"
                      : "0%"}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                file.llm_status === "completed"
                  ? "bg-green-600 w-full"
                  : file.llm_status === "processing"
                    ? "bg-blue-600 w-3/4"
                    : file.ocr_status === "completed"
                      ? "bg-blue-600 w-1/2"
                      : file.ocr_status === "processing"
                        ? "bg-blue-600 w-1/4"
                        : "bg-gray-400 w-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
