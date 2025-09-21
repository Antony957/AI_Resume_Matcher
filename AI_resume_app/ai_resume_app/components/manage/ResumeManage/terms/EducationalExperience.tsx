import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import React from "react";

import { Education } from "@/types";
const EducationalExperience: React.FC<Education> = (education) => {
  return (
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">{education.school}</p>
          <p className="text-small text-default-500">{education.degree}</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <p>学科：{education.field}</p>
        <p>GPA：{education.gpa}</p>
        <p>开始时间：{education.start_date}</p>
        <p>结束时间：{education.end_date}</p>
      </CardBody>
    </Card>
  );
};

export default EducationalExperience;
