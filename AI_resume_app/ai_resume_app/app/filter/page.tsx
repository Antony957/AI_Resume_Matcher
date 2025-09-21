"use client";
import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/modal";

import FilterPanel from "@/components/filter-panel";
import ResumeList from "@/components/resume-list";
import ResumeDetailModal from "@/components/ResumeDetailModal";
import { ResumeProfile } from "@/types";

export default function FilterPage() {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<ResumeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState(0); // 用于重置分页
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const detailModal = useDisclosure();

  // 获取简历数据
  const fetchResumes = async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.jobCategories?.length > 0) {
        params.append("jobCategories", filters.jobCategories.join(","));
      }
      if (filters.tags?.length > 0) {
        params.append("tags", filters.tags.join(","));
      }
      if (filters.workYear) {
        params.append("workYear", filters.workYear);
      }
      if (filters.education) {
        params.append("education", filters.education);
      }
      if (filters.universityTier) {
        params.append("universityTier", filters.universityTier);
      }

      const url = `/api/resume_profiles?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
      }

      const data = await response.json();

      setResumes(data.data || []);
      setFilteredResumes(data.data || []);
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch resumes");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchResumes();
  }, []);

  // 筛选处理
  const handleFilter = async (filters: any) => {
    await fetchResumes(filters);
    setFilterKey((k) => k + 1); // 重置分页
  };

  // 处理简历点击事件
  const handleResumeClick = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    detailModal.onOpen();
  };

  // 转换数据格式以适配现有的ResumeList组件
  const transformedData = filteredResumes.map((resume) => ({
    id: resume.id,
    name: resume.full_name || "未知",
    job: resume.headline || "暂无职位",
    company: resume.work_experience?.[0]?.company || "暂无公司",
    city: resume.location || "暂无地点",
    tags: resume.tags || [],
    education: resume.education?.[0]?.degree || "暂无学历",
    college: resume.education?.[0]?.school || "暂无院校",
    age: resume.years_experience ? resume.years_experience + 22 : 25, // 简单推算年龄
    salary: "面议",
    avatarUrl: undefined,
  }));

  return (
    <div className="fixed inset-0 pt-16 bg-white">
      <div className="h-full p-4 overflow-y-auto">
        <div className="max-w-none mx-auto">
          <FilterPanel onFilter={handleFilter} />

          {/* 加载状态 */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">正在加载简历数据...</div>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-700">
                <strong>加载失败：</strong> {error}
              </div>
              <button
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => fetchResumes()}
              >
                重试
              </button>
            </div>
          )}

          {/* 简历列表 */}
          {!loading && !error && (
            <>
              <div className="mb-4 text-gray-600">
                找到 {filteredResumes.length} 份匹配的简历
              </div>
              <ResumeList
                key={filterKey}
                data={transformedData}
                pageSize={12}
                onResumeClick={handleResumeClick}
              />
            </>
          )}
        </div>
      </div>

      {/* 简历详情模态框 */}
      <ResumeDetailModal
        isOpen={detailModal.isOpen}
        resumeId={selectedResumeId}
        onOpenChange={detailModal.onOpenChange}
      />
    </div>
  );
}
