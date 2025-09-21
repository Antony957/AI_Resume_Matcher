"use client";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { PaperClipIcon, TrashIcon } from "@heroicons/react/24/outline";
import { addToast } from "@heroui/toast";

import { useResumeMonitor } from "@/hooks/useResumeMonitor";
import { ResumeProcessStatus } from "@/components/ResumeProcessStatus";
import { ResumeEditForm } from "@/components/ResumeEditForm";

interface UploadFile {
  file: File;
  title: string;
  owner: string;
  id: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadMode, setUploadMode] = useState<"single" | "batch">("single"); // 新增模式切换
  const [batchOwner, setBatchOwner] = useState<string>(""); // 批量归属人
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 添加简历监控功能
  const {
    file,
    profile,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
  } = useResumeMonitor();

  // 处理文件上传
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadFile[] = Array.from(fileList).map((file) => ({
      file,
      title: file.name.replace(/\.[^.]+$/, ""),
      owner: "",
      id: file.name + file.size + file.lastModified + Math.random(),
    }));

    if (uploadMode === "single") {
      setFiles(newFiles.slice(0, 1));
    } else {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 拖拽上传
  const handleDrop = (
    e: React.DragEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // 点击上传
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // 删除文件
  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 修改题目/归属人
  const handleChange = (id: string, key: "title" | "owner", value: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    );
  };

  // 批量设置归属人
  const handleBatchOwnerChange = (owner: string) => {
    setBatchOwner(owner);
    setFiles((prev) => prev.map((f) => ({ ...f, owner })));
  };

  // 校验所有文件归属人是否填写
  const allOwnerFilled =
    files.length > 0 && files.every((f) => !!f.owner && f.owner.trim() !== "");

  // 上传单个文件到服务器
  const uploadFileToServer = async (uploadFile: UploadFile) => {
    const formData = new FormData();

    formData.append("file", uploadFile.file);
    formData.append("title", uploadFile.title);
    formData.append("owner", uploadFile.owner);

    try {
      const response = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "上传失败");
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // 提交
  const handleSubmit = async () => {
    if (files.length === 0) {
      addToast({
        title: "请先上传文件！",
        color: "danger",
        promise: new Promise((resolve) => setTimeout(resolve, 1000)),
      });

      return;
    }

    if (!allOwnerFilled) {
      addToast({
        title: "请填写所有文件的归属人！",
        color: "danger",
        promise: new Promise((resolve) => setTimeout(resolve, 1000)),
      });

      return;
    }

    // 标记所有文件开始上传
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        uploading: true,
        uploaded: false,
        error: undefined,
      })),
    );

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const result = await uploadFileToServer(file);

          // 更新该文件的上传状态
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, uploading: false, uploaded: true, error: undefined }
                : f,
            ),
          );

          return result;
        } catch (error) {
          // 更新该文件的错误状态
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    uploading: false,
                    uploaded: false,
                    error: error instanceof Error ? error.message : "上传失败",
                  }
                : f,
            ),
          );
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      addToast({
        title: "恭喜你文件上传成功！",
        description: "文件已自动进入处理队列",
        color: "success",
        promise: new Promise((resolve) => setTimeout(resolve, 1000)),
      });

      // 保存上传信息到localStorage（用于结果页面展示）
      localStorage.setItem("ai_uploaded_files", JSON.stringify(files));

      // 如果是单文件模式，开始监控处理状态
      if (uploadMode === "single" && files.length > 0) {
        const uploadedFile = files[0];

        // 从上传API的响应中获取实际的文件名
        const uploadResults = await Promise.all(uploadPromises);
        const actualFileName = uploadResults[0].filename;

        console.log("开始监控文件:", actualFileName);
        startMonitoring(actualFileName);

        // 单文件模式不跳转到结果页面，留在当前页面监控
        return;
      }

      setTimeout(() => {
        router.push("/result");
      }, 1000);
    } catch (error) {
      addToast({
        title: "部分文件上传失败！",
        description: "请检查失败的文件并重试",
        color: "danger",
        promise: new Promise((resolve) => setTimeout(resolve, 1000)),
      });
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      {/* 顶部标题与说明 */}
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2 tracking-tight drop-shadow">
          AI 智能简历检测
        </h1>
        <p className="text-zinc-500 dark:text-zinc-300 text-base md:text-lg">
          支持批量上传，智能检测简历内容，结果安全私密，体验高效便捷！
        </p>
      </div>
      {/* 上传方式选择区 */}
      <div className="w-full flex items-center gap-6 mb-6 px-4 py-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <label className="flex items-center gap-1 text-base font-medium cursor-pointer">
          <input
            checked={uploadMode === "single"}
            className="accent-blue-600"
            type="radio"
            onChange={() => {
              setUploadMode("single");
              setFiles([]);
              setBatchOwner("");
            }}
          />
          上传文档
        </label>
        <label className="flex items-center gap-1 text-base font-medium cursor-pointer">
          <input
            checked={uploadMode === "batch"}
            className="accent-blue-600"
            type="radio"
            onChange={() => {
              setUploadMode("batch");
              setFiles([]);
              setBatchOwner("");
            }}
          />
          批量上传
        </label>
        <div className="flex-1 border-b border-dashed border-zinc-200 dark:border-zinc-700 mx-4" />
        <span className="text-xs text-zinc-400">仅支持文档上传</span>
      </div>
      {/* 上传区域 */}
      {uploadMode === "single" ? (
        <div
          className="w-full min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl bg-gradient-to-br from-blue-100/60 via-white/80 to-purple-100/60 dark:from-zinc-900 dark:via-zinc-950 dark:to-blue-950 hover:shadow-xl transition-all duration-200 cursor-pointer p-8 mb-8 outline-none focus:ring-2 focus:ring-blue-400 relative"
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            className="hidden"
            multiple={false}
            type="file"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {files.length === 0 ? (
            <div className="flex flex-col items-center gap-3 select-none pointer-events-none">
              <div className="bg-blue-200 dark:bg-blue-900 rounded-full p-4 mb-2 shadow-lg">
                <PaperClipIcon className="w-14 h-14 text-blue-500 dark:text-blue-300" />
              </div>
              <div className="text-xl font-semibold text-blue-700 dark:text-blue-200">
                点击或拖拽文件到此处上传
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                支持 PDF、Word 等格式，单文件不超过 15M
              </div>
            </div>
          ) : (
            // 单文件卡片样式，居中显示
            <div className="w-full max-w-xl mx-auto bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 p-6 flex flex-col gap-4 items-center">
              <div className="flex items-center gap-3 mb-2 w-full">
                <PaperClipIcon className="w-8 h-8 text-blue-400" />
                <span className="font-medium text-zinc-800 dark:text-zinc-100 text-base truncate max-w-[180px]">
                  {files[0].file.name}
                </span>
                {files[0].uploading && (
                  <span className="text-blue-500 text-xs ml-2 bg-blue-50 dark:bg-blue-900 px-2 py-0.5 rounded">
                    上传中...
                  </span>
                )}
                {files[0].uploaded && (
                  <span className="text-green-500 text-xs ml-2 bg-green-50 dark:bg-green-900 px-2 py-0.5 rounded">
                    上传成功
                  </span>
                )}
                {files[0].error && (
                  <span className="text-red-500 text-xs ml-2 bg-red-50 dark:bg-red-900 px-2 py-0.5 rounded">
                    {files[0].error}
                  </span>
                )}
                {!files[0].uploading &&
                  !files[0].uploaded &&
                  !files[0].error && (
                    <span className="text-yellow-500 text-xs ml-2 bg-yellow-50 dark:bg-yellow-900 px-2 py-0.5 rounded">
                      待上传
                    </span>
                  )}
                <button
                  aria-label="删除文件"
                  className="ml-auto text-zinc-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-red-50 dark:hover:bg-red-900"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(files[0].id);
                  }}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full max-w-full">
                {/* 题目 */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <label
                    className="text-sm text-zinc-500 dark:text-zinc-300 mb-1"
                    htmlFor={`title-${files[0].id}`}
                  >
                    题目：
                  </label>
                  <input
                    required
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                    id={`title-${files[0].id}`}
                    placeholder="请输入题目"
                    type="text"
                    value={files[0].title}
                    onChange={(e) =>
                      handleChange(files[0].id, "title", e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {/* 归属人选择 */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <label
                    className="text-sm text-zinc-500 dark:text-zinc-300 mb-1"
                    htmlFor={`owner-select-${files[0].id}`}
                  >
                    归属人：
                  </label>
                  <select
                    required
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                    id={`owner-select-${files[0].id}`}
                    value={files[0].owner}
                    onChange={(e) =>
                      handleChange(files[0].id, "owner", e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">请选择归属人</option>
                    <option value="张三">张三</option>
                    <option value="李四">李四</option>
                    <option value="王五">王五</option>
                    <option value="赵六">赵六</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            aria-label="点击或拖拽文件到此处上传"
            className="w-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl bg-gradient-to-br from-blue-100/60 via-white/80 to-purple-100/60 dark:from-zinc-900 dark:via-zinc-950 dark:to-blue-950 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer p-8 mb-8 outline-none focus:ring-2 focus:ring-blue-400"
            tabIndex={0}
            type="button"
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              multiple
              className="hidden"
              type="file"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-3 select-none pointer-events-none">
              <div className="bg-blue-200 dark:bg-blue-900 rounded-full p-4 mb-2 shadow-lg">
                <PaperClipIcon className="w-14 h-14 text-blue-500 dark:text-blue-300" />
              </div>
              <div className="text-xl font-semibold text-blue-700 dark:text-blue-200">
                点击或拖拽文件到此处上传
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                支持 PDF、Word 等格式，单文件不超过 15M
              </div>
            </div>
          </button>

          {/* 批量归属人选择器 */}
          {files.length > 0 && (
            <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  批量设置归属人
                </h3>
                <select
                  className="flex-1 max-w-xs bg-white dark:bg-zinc-800 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition text-base"
                  value={batchOwner}
                  onChange={(e) => handleBatchOwnerChange(e.target.value)}
                >
                  <option value="">请选择归属人</option>
                  <option value="张三">张三</option>
                  <option value="李四">李四</option>
                  <option value="王五">王五</option>
                  <option value="赵六">赵六</option>
                </select>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  将为所有 {files.length} 个文件设置相同归属人
                </span>
              </div>
            </div>
          )}

          {/* 文件列表及表单 */}
          <div className="w-full flex flex-col gap-7">
            {files.map((f) => (
              <div
                key={f.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all border border-zinc-100 dark:border-zinc-700 p-5 flex flex-col gap-4 relative group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <PaperClipIcon className="w-8 h-8 text-blue-400" />
                  <span className="font-medium text-zinc-800 dark:text-zinc-100 text-base truncate max-w-[180px]">
                    {f.file.name}
                  </span>
                  {f.uploading && (
                    <span className="text-blue-500 text-xs ml-2 bg-blue-50 dark:bg-blue-900 px-2 py-0.5 rounded">
                      上传中...
                    </span>
                  )}
                  {f.uploaded && (
                    <span className="text-green-500 text-xs ml-2 bg-green-50 dark:bg-green-900 px-2 py-0.5 rounded">
                      上传成功
                    </span>
                  )}
                  {f.error && (
                    <span className="text-red-500 text-xs ml-2 bg-red-50 dark:bg-red-900 px-2 py-0.5 rounded">
                      {f.error}
                    </span>
                  )}
                  {!f.uploading && !f.uploaded && !f.error && (
                    <span className="text-yellow-500 text-xs ml-2 bg-yellow-50 dark:bg-yellow-900 px-2 py-0.5 rounded">
                      待上传
                    </span>
                  )}
                  <button
                    aria-label="删除文件"
                    className="ml-auto text-zinc-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-red-50 dark:hover:bg-red-900"
                    type="button"
                    onClick={() => handleRemove(f.id)}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-col md:flex-row gap-4 flex">
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <label
                      className="text-sm text-zinc-500 dark:text-zinc-300 mb-1"
                      htmlFor={`title-${f.id}`}
                    >
                      题目：
                    </label>
                    <input
                      required
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                      id={`title-${f.id}`}
                      placeholder="请输入题目"
                      type="text"
                      value={f.title}
                      onChange={(e) =>
                        handleChange(f.id, "title", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <label
                      className="text-sm text-zinc-500 dark:text-zinc-300 mb-1"
                      htmlFor={`owner-${f.id}`}
                    >
                      归属人：
                    </label>
                    <input
                      required
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                      id={`owner-${f.id}`}
                      placeholder="可单独修改归属人"
                      type="text"
                      value={f.owner}
                      onChange={(e) =>
                        handleChange(f.id, "owner", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 提交按钮 */}
      {!isMonitoring && (
        <button
          className={`block mt-12 w-48 mx-auto text-lg font-semibold rounded-2xl py-3 shadow-lg transition-all duration-200 ${
            files.some((f) => f.uploading)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-105"
          } text-white`}
          disabled={files.some((f) => f.uploading)}
          style={{ outline: "none" }}
          type="button"
          onClick={handleSubmit}
        >
          {files.some((f) => f.uploading) ? "上传中..." : "提交检测"}
        </button>
      )}

      {/* 单文件模式下的实时监控 */}
      {uploadMode === "single" && (
        <div className="mt-8 space-y-6">
          {/* 监控错误显示 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="text-red-800 dark:text-red-400 font-medium mb-1">
                监控错误
              </div>
              <div className="text-red-600 dark:text-red-300 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* 处理状态显示 */}
          {file && <ResumeProcessStatus file={file} />}

          {/* 可编辑表单 */}
          {profile && (
            <ResumeEditForm
              profile={profile}
              onSave={(updatedProfile) => {
                console.log("简历信息已更新:", updatedProfile);
                addToast({
                  title: "保存成功",
                  description: "简历信息已更新",
                  color: "success",
                  promise: new Promise((resolve) => setTimeout(resolve, 1000)),
                });
              }}
            />
          )}

          {/* 监控状态指示器 */}
          {isMonitoring && !file && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-700 dark:text-blue-400 font-medium">
                  正在监控文件处理状态...
                </span>
              </div>
              <div className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                文件上传成功后会自动开始OCR和AI解析，请耐心等待。
              </div>
            </div>
          )}

          {/* 测试功能：直接测试已有的完成文件 */}
          {uploadMode === "single" && !isMonitoring && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">
                测试功能
              </div>
              <div className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                测试已有的完成文件显示功能
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                  onClick={() =>
                    startMonitoring(
                      "李四-张丁元-海外运营-DEX-AI-socialfi-2025-07-17T18-04-15-713Z.pdf",
                    )
                  }
                >
                  测试文件1
                </button>
                <button
                  className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                  onClick={() =>
                    startMonitoring(
                      "赵六-王自力-前端-XT-拍拍贷-2025-07-17T18-01-47-918Z.pdf",
                    )
                  }
                >
                  测试文件2
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
