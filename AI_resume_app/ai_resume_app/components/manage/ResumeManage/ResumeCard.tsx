import React from "react";
import { Card, CardFooter, CardHeader } from "@heroui/card";
import { Image } from "@heroui//image";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import { ResumeProfile } from "@/types";

interface ResumeCardProps {
  resume: ResumeProfile;
  onOpen: () => void;
  setSelectedResume: (resume: ResumeProfile) => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onOpen,
  setSelectedResume,
}) => {
  const router = useRouter();

  const handlePdfClick = () => {
    router.push(`/pdf_preview?id=${resume.id}`);
  };

  return (
    <div className="w-1/2 p-2">
      <Card isFooterBlurred className="h-[300px] cursor-pointer group">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <div className="flex justify-between items-center w-full">
            <p className="text-white/60 font-bold">
              {resume.location || "未知"}-{resume.headline || "无头衔"}
            </p>
            <span
              className={`px-2 py-1 rounded text-xs ${
                resume.status === "matched"
                  ? "bg-green-500 text-white"
                  : resume.status === "tagged"
                    ? "bg-blue-500 text-white"
                    : resume.status === "processed"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-500 text-white"
              }`}
            >
              {resume.status === "matched"
                ? "已匹配"
                : resume.status === "tagged"
                  ? "已标记"
                  : resume.status === "processed"
                    ? "已处理"
                    : "初始化"}
            </span>
          </div>
          <h4 className="text-white/90 font-medium text-xl">
            {resume.full_name || "匿名"}
          </h4>
          <p className="text-small text-white/60">
            归属人: {resume.recommend_person || "未指定"}
          </p>
        </CardHeader>
        <Image
          removeWrapper
          alt="Relaxing app background"
          className="z-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl"
          src={"/avatar.jpg"}
        />
        <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
          <div className="flex grow gap-2 items-center">
            <Image
              alt="Breathing app icon"
              className="rounded-full w-10 h-11 bg-black"
              src={"/avatar.jpg"}
            />
            <div className="flex flex-col">
              <p className="text-tiny text-white/60">
                {resume.phone || "无电话"}
              </p>
              <p className="text-tiny text-white/60">
                {resume.email || "无邮箱"}
              </p>
            </div>
          </div>
          <Button
            className="mr-1"
            color="primary"
            radius="full"
            size="sm"
            onPress={() => {
              setSelectedResume(resume);
              onOpen();
            }}
          >
            查看详情
          </Button>
          <Button
            color="danger"
            radius="full"
            size="sm"
            onPress={handlePdfClick}
          >
            pdf对照
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResumeCard;
