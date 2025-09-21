import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";

import { Position } from "@/types";
import { supabase } from "@/config/supabaseClient";
interface PositionCardProps {
  positions: Position;
  onPositionOpen: () => void;
  onPositionModifyOpen: () => void;
  setSelectedPosition: (position: Position) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({
  positions,
  onPositionOpen,
  onPositionModifyOpen,
  setSelectedPosition,
}) => {
  const [recommendedCount, setRecommendedCount] = useState<number>(0);

  useEffect(() => {
    async function getRecommendedResumeCount() {
      const position_id = positions.id;
      const { data: MatchResult, error } = await supabase
        .from("match_result")
        .select("*")
        .eq("position_id", position_id);

      if (error) {
        throw new Error(error.message);

        return;
      }

      setRecommendedCount(MatchResult.length);
    }
    getRecommendedResumeCount();
  }, [positions.id]);

  return (
    <Card className="max-w-[340px]">
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600">
              {positions.position_name}
            </h4>
            <h5 className="text-small tracking-tight text-default-400">
              {positions.company_name || "未指定公司"}
            </h5>
            <h6 className="text-small tracking-tight text-default-400">
              {positions.salary_range || "薪资面议"}
            </h6>
          </div>
        </div>
        <Button
          color="primary"
          radius="full"
          size="sm"
          onPress={() => {
            setSelectedPosition(positions);
            onPositionOpen();
          }}
        >
          查看推荐
        </Button>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-400 max-h-40 overflow-y-auto">
        <p>办公地点：{positions.location || "未指定"}</p>
        <p>
          职位描述：{positions.job_description?.slice(0, 100) || "暂无描述"}...
        </p>
        <p>
          状态：
          {positions.status === "active"
            ? "激活"
            : positions.status === "paused"
              ? "暂停"
              : positions.status === "closed"
                ? "关闭"
                : positions.status === "filled"
                  ? "已满"
                  : "未知"}
        </p>
        <p>
          紧急程度：
          {positions.urgency === "low"
            ? "低"
            : positions.urgency === "normal"
              ? "普通"
              : positions.urgency === "high"
                ? "高"
                : positions.urgency === "urgent"
                  ? "紧急"
                  : "普通"}
        </p>
      </CardBody>
      <CardFooter className="grid grid-cols-3 gap-2">
        <div className="flex gap-1">
          <p className="font-semibold text-default-400 text-small">
            {positions.hc || 0}
          </p>
          <p className=" text-default-400 text-small">需求人数</p>
        </div>
        <div className="flex gap-1">
          <p className="font-semibold text-default-400 text-small">
            {recommendedCount || 0}
          </p>
          <p className="text-default-400 text-small">推荐简历</p>
        </div>
        <div className="flex gap-1">
          <Button
            color="danger"
            radius="full"
            size="sm"
            onPress={() => {
              setSelectedPosition(positions);
              onPositionModifyOpen();
            }}
          >
            修改职位
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PositionCard;
