import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/config/supabaseClient";

// Helper function to detect education level from degree string
function detectEducationLevel(degree: string): string {
  if (!degree) return "unknown";

  const degreeLower = degree.toLowerCase();

  // 博士 patterns
  if (
    degreeLower.includes("博士") ||
    degreeLower.includes("博") ||
    degreeLower.includes("phd") ||
    degreeLower.includes("doctor") ||
    degreeLower.includes("doctoral")
  ) {
    return "phd";
  }

  // 硕士 patterns
  if (
    degreeLower.includes("硕士") ||
    degreeLower.includes("硕") ||
    degreeLower.includes("master") ||
    degreeLower.includes("msc") ||
    degreeLower.includes("ma") ||
    degreeLower.includes("mba") ||
    degreeLower.includes("ms")
  ) {
    return "master";
  }

  // 本科 patterns
  if (
    degreeLower.includes("本科") ||
    degreeLower.includes("本") ||
    degreeLower.includes("学士") ||
    degreeLower.includes("bachelor") ||
    degreeLower.includes("bsc") ||
    degreeLower.includes("ba") ||
    degreeLower.includes("bs") ||
    degreeLower.includes("学位")
  ) {
    return "bachelor";
  }

  // 专科/高职 patterns
  if (
    degreeLower.includes("专科") ||
    degreeLower.includes("专") ||
    degreeLower.includes("高职") ||
    degreeLower.includes("大专") ||
    degreeLower.includes("专升本")
  ) {
    return "vocational";
  }

  return "unknown";
}

// Helper function to get highest education level from education array
function getHighestEducationLevel(education: any[]): string {
  if (!education || education.length === 0) return "unknown";

  const levels = education.map((edu) => detectEducationLevel(edu.degree));

  // Priority: phd > master > bachelor > vocational > unknown
  if (levels.includes("phd")) return "phd";
  if (levels.includes("master")) return "master";
  if (levels.includes("bachelor")) return "bachelor";
  if (levels.includes("vocational")) return "vocational";

  return "unknown";
}

// Helper function to check if tags match job categories
function matchesJobCategory(tags: string[], categories: string[]): boolean {
  if (!categories || categories.length === 0) {
    console.log("No categories specified, returning true");

    return true;
  }
  if (!tags || tags.length === 0) {
    console.log("No tags found, returning false");

    return false;
  }

  const technicalTags = [
    "java",
    "go",
    "python",
    "rust",
    "c++",
    "后端",
    "前端",
    "全栈",
    "架构师",
    "cto",
    "sre",
    "android",
    "ios",
    "flutter",
    "cocos",
    "运维",
    "测试",
    "dba",
    "数据开发",
    "数据分析",
    "区块链开发",
    "合约",
    "solidity",
    "密码学",
    "安全",
    "量化开发",
    "量化策略",
  ];

  const nonTechnicalTags = [
    "市场",
    "运营",
    "增长",
    "cmo",
    "pr",
    "公关",
    "销售",
    "bd",
    "产品",
    "设计",
    "行政",
    "法务",
    "风控",
    "合规",
    "devrel",
    "投资",
    "项目经理",
    "财务",
    "会计",
    "上币",
    "listing",
  ];

  const hasTechnical = tags.some((tag) => {
    const match = technicalTags.some(
      (techTag) =>
        tag.toLowerCase().includes(techTag.toLowerCase()) ||
        techTag.toLowerCase().includes(tag.toLowerCase()),
    );

    if (match) console.log(`Tag "${tag}" matches technical category`);

    return match;
  });

  const hasNonTechnical = tags.some((tag) => {
    const match = nonTechnicalTags.some(
      (nonTechTag) =>
        tag.toLowerCase().includes(nonTechTag.toLowerCase()) ||
        nonTechTag.toLowerCase().includes(tag.toLowerCase()),
    );

    if (match) console.log(`Tag "${tag}" matches non-technical category`);

    return match;
  });

  console.log(
    `Technical match: ${hasTechnical}, Non-technical match: ${hasNonTechnical}`,
  );

  if (
    categories.includes("技术性岗位") &&
    categories.includes("非技术性岗位")
  ) {
    return hasTechnical || hasNonTechnical;
  }

  if (categories.includes("技术性岗位")) {
    return hasTechnical;
  }

  if (categories.includes("非技术性岗位")) {
    return hasNonTechnical;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const jobCategories =
      searchParams.get("jobCategories")?.split(",").filter(Boolean) || [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const workYear = searchParams.get("workYear") || "";
    const education = searchParams.get("education") || "";
    const universityTier = searchParams.get("universityTier") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    console.log("API received filters:", {
      jobCategories,
      tags,
      workYear,
      education,
      universityTier,
    });

    // Build query - 先不做分页，获取所有数据进行筛选
    let query = supabase
      .from("resume")
      .select("*")
      .in("status", ["processed", "tagged", "matched"]); // 包含更多状态

    const { data: resumes, error } = await query;

    if (error) {
      console.error("Error fetching resumes:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Apply client-side filtering for complex conditions
    let filteredResumes = resumes || [];

    console.log(`Total resumes: ${filteredResumes.length}`);

    // Filter by job categories (based on tags) - 如果没有选择职位类别，跳过此筛选
    if (jobCategories.length > 0) {
      filteredResumes = filteredResumes.filter((resume) => {
        const resumeTags = resume.tags || [];

        console.log(
          `Checking resume ${resume.full_name} with tags:`,
          resumeTags,
          "against categories:",
          jobCategories,
        );
        const matches = matchesJobCategory(resumeTags, jobCategories);

        console.log(`Match result:`, matches);

        return matches;
      });
      console.log(`After job category filter: ${filteredResumes.length}`);
    }

    // Filter by specific tags - 如果没有选择具体标签，跳过此筛选
    if (tags.length > 0) {
      filteredResumes = filteredResumes.filter((resume) => {
        const resumeTags = resume.tags || [];
        const hasMatch = tags.some((tag) =>
          resumeTags.some((resumeTag: string) => {
            const resumeTagLower = resumeTag.toLowerCase();
            const tagLower = tag.toLowerCase();

            // 精确匹配或包含匹配
            return (
              resumeTagLower === tagLower ||
              resumeTagLower.includes(tagLower) ||
              tagLower.includes(resumeTagLower)
            );
          }),
        );

        if (hasMatch) {
          console.log(
            `Resume ${resume.full_name} tags:`,
            resumeTags,
            "matches",
            tags,
          );
        }

        return hasMatch;
      });
      console.log(`After tag filter: ${filteredResumes.length}`);
    }

    // Filter by work experience
    if (workYear && workYear !== "不限") {
      filteredResumes = filteredResumes.filter((resume) => {
        const years = resume.years_experience || 0;

        switch (workYear) {
          case "一年以内":
            return years <= 1;
          case "1-3年":
            return years >= 1 && years <= 3;
          case "3-5年":
            return years >= 3 && years <= 5;
          case "5-10年":
            return years >= 5 && years <= 10;
          case "10年以上":
            return years > 10;
          default:
            return true;
        }
      });
      console.log(`After work year filter: ${filteredResumes.length}`);
    }

    // Filter by education level - 使用后端计算的highest_degree字段
    if (education && education !== "不限") {
      filteredResumes = filteredResumes.filter((resume) => {
        const highestDegree = resume.highest_degree || "未知";

        switch (education) {
          case "本科及以上":
            return ["本科", "硕士", "博士", "博士后"].includes(highestDegree);
          case "硕士及以上":
            return ["硕士", "博士", "博士后"].includes(highestDegree);
          case "博士":
            return ["博士", "博士后"].includes(highestDegree);
          case "高职":
            return ["专科", "高职"].includes(highestDegree);
          default:
            return true;
        }
      });
      console.log(`After education filter: ${filteredResumes.length}`);
    }

    // Filter by university tier
    if (universityTier && universityTier !== "不限") {
      filteredResumes = filteredResumes.filter((resume) => {
        const educationLevels = resume.education_levels || [];

        switch (universityTier) {
          case "985":
            return educationLevels.includes("985");
          case "211":
            return (
              educationLevels.includes("985") || educationLevels.includes("211")
            );
          case "双一流":
            return (
              educationLevels.includes("985") ||
              educationLevels.includes("211") ||
              educationLevels.includes("double_first_class")
            );
          case "海外留学":
            return educationLevels.includes("overseas");
          default:
            return true;
        }
      });
      console.log(`After university tier filter: ${filteredResumes.length}`);
    }

    // 应用分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedResumes = filteredResumes.slice(from, to);

    return NextResponse.json({
      data: paginatedResumes,
      total: filteredResumes.length,
      page,
      pageSize,
      filters: {
        jobCategories,
        tags,
        workYear,
        education,
        universityTier,
      },
    });
  } catch (error) {
    console.error("Error in resume profiles API:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
