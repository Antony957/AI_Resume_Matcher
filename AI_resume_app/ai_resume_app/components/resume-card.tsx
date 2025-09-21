import React from "react";
import Image from "next/image";

interface ResumeCardProps {
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
  onClick?: () => void;
  // ...其他字段
}

export default function ResumeCard({
  name,
  job,
  company,
  city,
  tags,
  education,
  college,
  age,
  salary,
  avatarUrl,
  onClick,
}: ResumeCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow${
        onClick
          ? " cursor-pointer hover:border-primary-300 dark:hover:border-primary-600"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-primary-600 dark:text-primary-400">
          {avatarUrl ? (
            <Image
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
              height={48}
              src={avatarUrl}
              width={48}
            />
          ) : (
            name.slice(0, 1)
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
            {name}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {job} @ {company}
          </div>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{city}</div>
      </div>
      <div className="flex flex-wrap gap-2 mb-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <span>学历：{education}</span>
        <span>院校：{college}</span>
        <span>年龄：{age}</span>
        <span>期望薪资：{salary}</span>
      </div>
    </div>
  );
}
