import React, { useState } from "react";
import { addToast } from "@heroui/toast";

import { ResumeProfile } from "@/types";
import { update } from "@/lib/supabaseApi";

interface ResumeEditFormProps {
  profile: ResumeProfile;
  onSave: (profile: ResumeProfile) => void;
}

export function ResumeEditForm({ profile, onSave }: ResumeEditFormProps) {
  const [formData, setFormData] = useState<ResumeProfile>(profile);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof ResumeProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (
    field: keyof ResumeProfile,
    index: number,
    subField: string,
    value: any,
  ) => {
    const array = formData[field] as any[];
    const newArray = [...array];

    newArray[index] = { ...newArray[index], [subField]: value };
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("正在保存数据:", formData);

      // 准备更新数据，排除只读字段
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        headline: formData.headline,
        summary: formData.summary,
        years_experience: formData.years_experience,
        education: formData.education,
        work_experience: formData.work_experience,
        projects: formData.projects,
        skills: formData.skills,
        certifications: formData.certifications,
        languages: formData.languages,
        extra_sections: formData.extra_sections,
        updated_at: new Date().toISOString(),
      };

      console.log("更新数据:", updateData);

      const result = await update("resume", updateData, {
        id: profile.id,
      });

      console.log("保存结果:", result);

      onSave({ ...formData, ...updateData });
      addToast({
        title: "保存成功",
        description: "简历信息已更新",
        color: "success",
        promise: new Promise((resolve) => setTimeout(resolve, 1000)),
      });
    } catch (error) {
      console.error("保存失败:", error);
      addToast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        color: "danger",
        promise: new Promise((resolve) => setTimeout(resolve, 1000)),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          📝 简历信息编辑
        </h3>
        <button
          className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "保存中..." : "保存修改"}
        </button>
      </div>

      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <h4 className="text-md font-medium mb-4 text-zinc-800 dark:text-zinc-100">
            基本信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300" htmlFor="full_name">
                姓名
              </label>
              <input
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="full_name"
                placeholder="请输入姓名"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                邮箱
              </label>
              <input
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入邮箱"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                电话
              </label>
              <input
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入电话号码"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                位置
              </label>
              <input
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入所在城市"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 职位信息 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <h4 className="text-md font-medium mb-4 text-zinc-800 dark:text-zinc-100">
            职位信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                职位标题
              </label>
              <input
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入职位标题"
                type="text"
                value={formData.headline}
                onChange={(e) => handleInputChange("headline", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                工作年限
              </label>
              <input
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                placeholder="请输入工作年限"
                type="number"
                value={formData.years_experience}
                onChange={(e) =>
                  handleInputChange(
                    "years_experience",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              个人简介
            </label>
            <textarea
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入个人简介"
              rows={4}
              value={formData.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
            />
          </div>
        </div>

        {/* 技能 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <h4 className="text-md font-medium mb-4 text-zinc-800 dark:text-zinc-100">
            技能
          </h4>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              技能列表
            </label>
            <input
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="用逗号分隔技能，如：JavaScript, React, Node.js"
              type="text"
              value={formData.skills.join(", ")}
              onChange={(e) =>
                handleInputChange(
                  "skills",
                  e.target.value.split(", ").filter((skill) => skill.trim()),
                )
              }
            />
          </div>
        </div>

        {/* 教育经历 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <h4 className="text-md font-medium mb-4 text-zinc-800 dark:text-zinc-100">
            教育经历
          </h4>
          {formData.education.map((edu, index) => (
            <div
              key={index}
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-3 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="mb-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  教育经历 {index + 1}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="学校名称"
                  type="text"
                  value={edu.school || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "education",
                      index,
                      "school",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="学位"
                  type="text"
                  value={edu.degree || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "education",
                      index,
                      "degree",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="专业"
                  type="text"
                  value={edu.field || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "education",
                      index,
                      "field",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="GPA"
                  type="text"
                  value={edu.gpa || ""}
                  onChange={(e) =>
                    handleArrayChange("education", index, "gpa", e.target.value)
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="开始时间"
                  type="text"
                  value={edu.start_date || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "education",
                      index,
                      "start_date",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="结束时间"
                  type="text"
                  value={edu.end_date || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "education",
                      index,
                      "end_date",
                      e.target.value,
                    )
                  }
                />
              </div>
              <textarea
                className="w-full mt-3 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                placeholder="教育经历描述"
                rows={2}
                value={edu.description || ""}
                onChange={(e) =>
                  handleArrayChange(
                    "education",
                    index,
                    "description",
                    e.target.value,
                  )
                }
              />
            </div>
          ))}
        </div>

        {/* 工作经历 */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <h4 className="text-md font-medium mb-4 text-zinc-800 dark:text-zinc-100">
            工作经历
          </h4>
          {formData.work_experience.map((work, index) => (
            <div
              key={index}
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-3 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="mb-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  工作经历 {index + 1}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="公司名称"
                  type="text"
                  value={work.company || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "work_experience",
                      index,
                      "company",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="职位"
                  type="text"
                  value={work.position || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "work_experience",
                      index,
                      "position",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="开始时间"
                  type="text"
                  value={work.start_date || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "work_experience",
                      index,
                      "start_date",
                      e.target.value,
                    )
                  }
                />
                <input
                  className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="结束时间"
                  type="text"
                  value={work.end_date || ""}
                  onChange={(e) =>
                    handleArrayChange(
                      "work_experience",
                      index,
                      "end_date",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="工作职责（用逗号分隔）"
                  rows={2}
                  value={
                    Array.isArray(work.responsibilities)
                      ? work.responsibilities.join(", ")
                      : work.responsibilities || ""
                  }
                  onChange={(e) =>
                    handleArrayChange(
                      "work_experience",
                      index,
                      "responsibilities",
                      e.target.value.split(", ").filter((r) => r.trim()),
                    )
                  }
                />
                <textarea
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="工作成就（用逗号分隔）"
                  rows={2}
                  value={
                    Array.isArray(work.achievements)
                      ? work.achievements.join(", ")
                      : work.achievements || ""
                  }
                  onChange={(e) =>
                    handleArrayChange(
                      "work_experience",
                      index,
                      "achievements",
                      e.target.value.split(", ").filter((a) => a.trim()),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
