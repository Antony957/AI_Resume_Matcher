"use client";
import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";

import ButtonSelector from "@/components/button-selector";

// 职位类别选项
const jobCategoryOptions = [
  { id: "technical", label: "技术性岗位", value: "技术性岗位" },
  { id: "non-technical", label: "非技术性岗位", value: "非技术性岗位" },
];

// 技术性岗位标签
const technicalTags = [
  { id: "java", label: "java", value: "java" },
  { id: "go", label: "go", value: "go" },
  { id: "python", label: "python", value: "python" },
  { id: "rust", label: "rust", value: "rust" },
  { id: "c++", label: "C++", value: "C++" },
  { id: "backend", label: "后端", value: "后端" },
  { id: "frontend", label: "前端", value: "前端" },
  { id: "fullstack", label: "全栈", value: "全栈" },
  { id: "architect", label: "架构师", value: "架构师" },
  { id: "cto", label: "CTO", value: "CTO" },
  { id: "sre", label: "SRE", value: "SRE" },
  { id: "android", label: "android", value: "android" },
  { id: "ios", label: "iOS", value: "iOS" },
  { id: "flutter", label: "flutter", value: "flutter" },
  { id: "cocos", label: "cocos", value: "cocos" },
  { id: "devops", label: "运维", value: "运维" },
  { id: "test", label: "测试", value: "测试" },
  { id: "dba", label: "DBA", value: "DBA" },
  { id: "data-dev", label: "数据开发", value: "数据开发" },
  { id: "data-analysis", label: "数据分析", value: "数据分析" },
  { id: "blockchain", label: "区块链开发", value: "区块链开发" },
  { id: "smart-contract", label: "合约", value: "合约" },
  { id: "solidity", label: "solidity", value: "solidity" },
  { id: "cryptography", label: "密码学", value: "密码学" },
  { id: "security", label: "安全", value: "安全" },
  { id: "quant-dev", label: "量化开发", value: "量化开发" },
  { id: "quant-strategy", label: "量化策略", value: "量化策略" },
];

// 非技术性岗位标签
const nonTechnicalTags = [
  { id: "marketing", label: "市场", value: "市场" },
  { id: "operations", label: "运营", value: "运营" },
  { id: "growth", label: "增长", value: "增长" },
  { id: "cmo", label: "CMO", value: "CMO" },
  { id: "pr", label: "PR", value: "PR" },
  { id: "public-relations", label: "公关", value: "公关" },
  { id: "sales", label: "销售", value: "销售" },
  { id: "bd", label: "BD", value: "BD" },
  { id: "product", label: "产品", value: "产品" },
  { id: "design", label: "设计", value: "设计" },
  { id: "admin", label: "行政", value: "行政" },
  { id: "legal", label: "法务", value: "法务" },
  { id: "risk-control", label: "风控", value: "风控" },
  { id: "compliance", label: "合规", value: "合规" },
  { id: "devrel", label: "devrel", value: "devrel" },
  { id: "investment", label: "投资", value: "投资" },
  { id: "project-manager", label: "项目经理", value: "项目经理" },
  { id: "finance", label: "财务", value: "财务" },
  { id: "accounting", label: "会计", value: "会计" },
  { id: "listing", label: "上币", value: "上币" },
  { id: "listing-service", label: "listing", value: "listing" },
];

// 工作年限选项
const workYearOptions = [
  { id: "unlimited", label: "不限", value: "不限" },
  { id: "within-1", label: "一年以内", value: "一年以内" },
  { id: "1-3", label: "1-3年", value: "1-3年" },
  { id: "3-5", label: "3-5年", value: "3-5年" },
  { id: "5-10", label: "5-10年", value: "5-10年" },
  { id: "above-10", label: "10年以上", value: "10年以上" },
];

// 教育经历选项
const educationOptions = [
  { id: "unlimited", label: "不限", value: "不限" },
  { id: "bachelor-above", label: "本科及以上", value: "本科及以上" },
  { id: "master-above", label: "硕士及以上", value: "硕士及以上" },
  { id: "phd", label: "博士", value: "博士" },
  { id: "vocational", label: "高职", value: "高职" },
];

// 院校层次选项
const universityTierOptions = [
  { id: "unlimited", label: "不限", value: "不限" },
  { id: "985", label: "985", value: "985" },
  { id: "211", label: "211", value: "211" },
  { id: "double-first-class", label: "双一流", value: "双一流" },
  { id: "overseas", label: "海外留学", value: "海外留学" },
];

export default function FilterPanel({
  onFilter,
}: {
  onFilter?: (filters: any) => void;
}) {
  // 筛选项状态
  const [jobCategories, setJobCategories] = useState<string[]>([]); // 职位类别
  const [tags, setTags] = useState<string[]>([]); // 标签
  const [workYear, setWorkYear] = useState("不限"); // 工作年限
  const [education, setEducation] = useState("不限"); // 教育经历
  const [universityTier, setUniversityTier] = useState("不限"); // 院校层次

  // 根据选择的职位类别动态生成标签选项
  const getAvailableTags = () => {
    if (jobCategories.length === 0) {
      return []; // 没有选择职位类别时不显示标签
    }

    // 不限选项
    const unlimitedOption = { id: "unlimited", label: "不限", value: "不限" };

    if (
      jobCategories.includes("技术性岗位") &&
      jobCategories.includes("非技术性岗位")
    ) {
      return [unlimitedOption, ...technicalTags, ...nonTechnicalTags]; // 都选择时显示所有标签
    }

    if (jobCategories.includes("技术性岗位")) {
      return [unlimitedOption, ...technicalTags]; // 只选择技术性岗位时显示技术标签
    }

    if (jobCategories.includes("非技术性岗位")) {
      return [unlimitedOption, ...nonTechnicalTags]; // 只选择非技术性岗位时显示非技术标签
    }

    return [];
  };

  // 当职位类别改变时，清空已选标签（如果不再适用）
  useEffect(() => {
    const availableTags = getAvailableTags();
    const availableTagValues = availableTags.map((tag) => tag.value);

    // 过滤掉不再适用的标签
    setTags((prev) => prev.filter((tag) => availableTagValues.includes(tag)));
  }, [jobCategories]);

  // 提交筛选
  const handleFilter = () => {
    onFilter?.({
      jobCategories,
      tags: tags.includes("不限") ? [] : tags, // 如果选择了"不限"，则清空标签筛选
      workYear: workYear === "不限" ? "" : workYear,
      education: education === "不限" ? "" : education,
      universityTier: universityTier === "不限" ? "" : universityTier,
    });
  };

  // 重置筛选
  const handleReset = () => {
    setJobCategories([]);
    setTags([]);
    setWorkYear("不限");
    setEducation("不限");
    setUniversityTier("不限");
  };

  return (
    <div className="w-full rounded-xl bg-white dark:bg-zinc-900 shadow p-4 mb-4">
      {/* 第一行：职位类别 */}
      <div className="mb-4">
        <div className="font-semibold text-primary-600 dark:text-primary-400 mb-3">
          职位类别
        </div>
        <div className="flex flex-wrap gap-2">
          {jobCategoryOptions.map((category) => (
            <Checkbox
              key={category.id}
              isSelected={jobCategories.includes(category.value)}
              onValueChange={(checked) => {
                if (checked) {
                  setJobCategories((prev) => [...prev, category.value]);
                } else {
                  setJobCategories((prev) =>
                    prev.filter((c) => c !== category.value),
                  );
                }
              }}
            >
              {category.label}
            </Checkbox>
          ))}
        </div>
      </div>

      {/* 第二行：标签 */}
      <div className="mb-4">
        <div className="font-semibold text-primary-600 dark:text-primary-400 mb-3">
          标签
        </div>
        {jobCategories.length === 0 ? (
          <div className="text-gray-500 italic">请先选择职位类别</div>
        ) : (
          <ButtonSelector
            multiple
            className="bg-transparent"
            options={getAvailableTags()}
            value={tags}
            onChange={setTags}
          />
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />

      {/* 其他筛选条件 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 工作年限 */}
        <div>
          <div className="font-medium mb-2 text-zinc-700 dark:text-zinc-200">
            工作年限
          </div>
          <ButtonSelector
            multiple={false}
            options={workYearOptions}
            value={workYear ? [workYear] : []}
            onChange={(v) => setWorkYear(v[0] || "不限")}
          />
        </div>

        {/* 教育经历 */}
        <div>
          <div className="font-medium mb-2 text-zinc-700 dark:text-zinc-200">
            教育经历
          </div>
          <ButtonSelector
            multiple={false}
            options={educationOptions}
            value={education ? [education] : []}
            onChange={(v) => setEducation(v[0] || "不限")}
          />
        </div>

        {/* 院校层次 */}
        <div>
          <div className="font-medium mb-2 text-zinc-700 dark:text-zinc-200">
            院校层次
          </div>
          <ButtonSelector
            multiple={false}
            options={universityTierOptions}
            value={universityTier ? [universityTier] : []}
            onChange={(v) => setUniversityTier(v[0] || "不限")}
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2 mt-4">
        <Button color="default" variant="light" onPress={handleReset}>
          重置
        </Button>
        <Button color="primary" variant="solid" onPress={handleFilter}>
          筛选
        </Button>
      </div>
    </div>
  );
}
