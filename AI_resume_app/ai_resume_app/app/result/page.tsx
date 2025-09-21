"use client";
import { useEffect, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { addToast } from "@heroui/toast";

interface UploadFile {
  file: File | null;
  title: string;
  owner: string;
  id: string;
  submitTime?: string;
}

function formatTime(ts: string) {
  // 格式化时间字符串
  const d = new Date(ts);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export default function ResultPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitTime, setSubmitTime] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("ai_uploaded_files");
    let time = localStorage.getItem("ai_submit_time");

    if (!time) {
      time = new Date().toISOString();
      localStorage.setItem("ai_submit_time", time);
    }
    setSubmitTime(time);
    if (data) {
      // 如果文件没有 submitTime 字段，补充上
      const arr = JSON.parse(data).map((f: UploadFile) => ({
        ...f,
        submitTime: f.submitTime || time,
      }));

      setFiles(arr);
    }
  }, []);

  // 全选/反选
  const handleSelectAll = () => {
    if (selected.length === files.length) setSelected([]);
    else setSelected(files.map((f) => f.id));
  };

  // 单选
  const handleSelect = (id: string) => {
    setSelected(
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id],
    );
  };

  // 批量删除方法调整
  const handleDelete = (ids: string[] = selected) => {
    setPendingDeleteIds(ids);
    setShowConfirm(true);
  };

  // 真正执行删除
  const confirmDelete = () => {
    const remain = files.filter((f) => !pendingDeleteIds.includes(f.id));

    setFiles(remain);
    setSelected([]);
    localStorage.setItem("ai_uploaded_files", JSON.stringify(remain));
    setShowConfirm(false);
    setPendingDeleteIds([]);
  };

  // 取消删除
  const cancelDelete = () => {
    setShowConfirm(false);
    setPendingDeleteIds([]);
  };

  // Toast 简易实现（用 alert 或自定义，假设页面已有 Toast 组件可用）
  function showToast(msg: string) {
    if (typeof addToast === "function") {
      addToast({ title: msg, color: "danger" });
    } else {
      alert(msg);
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 删除确认弹窗 */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8 min-w-[320px] max-w-[90vw]">
                <div className="flex items-center gap-3 mb-4">
                  <ExclamationTriangleIcon className="w-7 h-7 text-red-400" />
                  <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                    确认删除
                  </span>
                </div>
                <div className="text-zinc-600 dark:text-zinc-300 mb-6">
                  确定要删除选中的文件吗？此操作不可撤销。
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-5 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition font-medium"
                    onClick={cancelDelete}
                  >
                    取消
                  </button>
                  <button
                    className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-semibold shadow"
                    onClick={confirmDelete}
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* 顶部文件列表表格 */}
          <div className="w-full bg-white/90 dark:bg-zinc-900/90 rounded-xl shadow p-4 mb-8 overflow-x-auto">
            <table className="min-w-full text-sm align-middle">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-2 py-2 text-left w-8">
                    <input
                      checked={
                        selected.length === files.length && files.length > 0
                      }
                      className="accent-blue-600 w-5 h-5 rounded"
                      type="checkbox"
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-2 py-2 text-left">文件名</th>
                  <th className="px-2 py-2 text-center">归属人</th>
                  <th className="px-2 py-2 text-center">状态</th>
                  <th className="px-2 py-2 text-center">提交时间</th>
                  <th className="px-2 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr
                    key={f.id}
                    className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-blue-50/40 dark:hover:bg-zinc-800/60 ${selected.includes(f.id) ? "bg-blue-50 dark:bg-zinc-800" : ""}`}
                  >
                    <td className="px-2 py-2">
                      <input
                        checked={selected.includes(f.id)}
                        className="accent-blue-600 w-5 h-5 rounded"
                        type="checkbox"
                        onChange={() => handleSelect(f.id)}
                      />
                    </td>
                    <td className="px-2 py-2 max-w-[240px] truncate text-zinc-800 dark:text-zinc-100 font-medium">
                      {f.file?.name || f.title}
                    </td>
                    <td className="px-2 py-2 text-center text-zinc-700 dark:text-zinc-200 text-sm">
                      {f.owner || "-"}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                        检测中
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-zinc-500 dark:text-zinc-300 text-xs">
                      {formatTime(f.submitTime || submitTime)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 text-xs font-medium transition mr-2"
                        type="button"
                      >
                        查看报告
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 text-xs font-medium transition"
                        type="button"
                        onClick={() => handleDelete([f.id])}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && (
                  <tr>
                    <td
                      className="text-zinc-400 text-center py-8 text-base"
                      colSpan={5}
                    >
                      暂无待检测文件
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* 批量操作区 */}
            <div className="flex items-center gap-4 mt-4">
              <button
                className="text-zinc-700 dark:text-zinc-200 hover:text-blue-600 text-base font-medium px-2 rounded transition"
                onClick={handleSelectAll}
              >
                全选
              </button>
              <button
                className="text-zinc-700 dark:text-zinc-200 hover:text-red-500 text-base font-medium px-2 rounded transition"
                onClick={() => {
                  if (selected.length === 0) {
                    showToast("请先选择要删除的文件！");
                  } else {
                    handleDelete(selected);
                  }
                }}
              >
                删除
              </button>
              <div className="ml-auto text-zinc-500 text-base">
                共 {files.length} 个文件
              </div>
            </div>
          </div>
          {/* 温馨提示区（保持原样） */}
          <div className="w-full bg-blue-50 dark:bg-blue-900 rounded-2xl p-6 flex gap-4 items-start shadow">
            <ExclamationTriangleIcon className="w-7 h-7 text-blue-400 mt-1" />
            <div>
              <div className="font-semibold text-blue-700 dark:text-blue-200 mb-1 text-lg">
                温馨提示：
              </div>
              <ul className="text-base text-blue-700 dark:text-blue-200 list-decimal list-inside space-y-1">
                <li>
                  系统保留7天以内的检测报告，超过7天则被删除，确保您的信息不会被泄露和盗窃，检测完成后请尽快下载您的检测报告。
                </li>
                <li>
                  检测时长：极速检测约30秒，一般检测时间为2-5分钟。如果是在检测的高峰期，则可能需要更长的时间。
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
