export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "ai_resume_app",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "AI检测",
      href: "/upload",
    },
    {
      label: "检测结果",
      href: "/result",
    },
    {
      label: "筛选",
      href: "/filter",
    },
    {
      label: "管理",
      href: "/manage",
    },
    {
      label: "匹配结果",
      href: "/match-results",
    },
  ],
  navMenuItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "AI检测",
      href: "/upload",
    },
    {
      label: "检测结果",
      href: "/result",
    },
    {
      label: "筛选",
      href: "/filter",
    },
    {
      label: "管理",
      href: "/manage",
    },
    {
      label: "匹配结果",
      href: "/match-results",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
