import React from "react";
import { Card, CardFooter, CardHeader } from "@heroui/card";
import { Image } from "@heroui//image";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import { MatchResult, ResumeProfile } from "@/types";

interface ResumeCardProps {
  resume: ResumeProfile;
  matchResult: MatchResult;
}

const PositionResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  matchResult,
}) => {
  const router = useRouter();

  const handlePdfClick = () => {
    router.push(`/pdf_preview?id=${resume.id}`);
  };

  return (
    <div className="w-1/2 p-2">
      <Card isFooterBlurred className="h-[300px] cursor-pointer group">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="flex justify-between text-white/60 font-bold">
            {resume.location || "未知"}-{resume.headline || "无头衔"}
          </p>
          <h4 className="text-white/90 font-medium text-xl">
            {resume.full_name || "匿名"}
          </h4>
          <p className="text-small text-white/60">归属人: 张三</p>
          <p className="text-small text-red-400">
            简历推荐分: {matchResult.sum_score}
          </p>
          <p className="text-small text-red-400">{matchResult.position_id}</p>
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
            color="primary"
            radius="full"
            size="sm"
            onPress={handlePdfClick}
          >
            查看pdf
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PositionResumeCard;
