import React, { useState } from "react";

import ResumeCard from "@/components/resume-card";

interface ResumeData {
  name: string;
  job: string;
  company: string;
  city: string;
  tags: string[];
  education: string;
  college: string;
  age: number;
  salary: string;
  avatarUrl?: string;
  id?: string; // 添加 id 字段
}

interface ResumeListProps {
  data: ResumeData[];
  pageSize?: number;
  onResumeClick?: (resumeId: string) => void;
}

export default function ResumeList({
  data,
  pageSize = 12,
  onResumeClick,
}: ResumeListProps) {
  const [page, setPage] = useState(1);
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageData = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full">
      {/* 卡片区 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {pageData.map((item, idx) => (
          <ResumeCard
            key={item.id || idx}
            {...item}
            onClick={
              item.id && onResumeClick
                ? () => onResumeClick(item.id!)
                : undefined
            }
          />
        ))}
        {pageData.length === 0 && (
          <div className="col-span-4 text-center text-zinc-400 dark:text-zinc-500 py-12">
            暂无数据
          </div>
        )}
      </div>
      {/* 分页器 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span className="mx-2 text-zinc-600 dark:text-zinc-300">
            {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
