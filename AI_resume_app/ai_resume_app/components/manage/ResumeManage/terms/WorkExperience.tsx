import type { WorkExperience } from "@/types";

import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import React from "react";

const WorkExperience: React.FC<WorkExperience> = (project) => {
  return (
    <Card className="max-w-[340px]">
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600">
              {project.company}
            </h4>
            <h5 className="text-small tracking-tight text-default-400">
              {project.position}
            </h5>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-400">
        {project.responsibilities.map((responsibility, index) => (
          <p key={index}>{responsibility}</p>
        ))}
        {project.achievements.map((achievement, index) => (
          <p key={index}>{achievement}</p>
        ))}
      </CardBody>
      <CardFooter className="gap-3">
        <div className="flex gap-1">
          <p className="font-semibold text-default-400 text-small">时间</p>
          <p className=" text-default-400 text-small">
            {project.start_date}-{project.end_date}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WorkExperience;
