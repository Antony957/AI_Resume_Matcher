import React from "react";

import ResumeCard from "./ResumeCard";

import { ResumeProfile } from "@/types";

interface ResumeCardListProps {
  resumes: ResumeProfile[];
  onOpen: () => void;
  setSelectedResume: (resume: ResumeProfile) => void;
}

const ResumeCardList: React.FC<ResumeCardListProps> = ({
  resumes,
  onOpen,
  setSelectedResume,
}) => {
  return (
    <div className="flex flex-wrap -mx-2 min-h-[1200px]">
      {resumes.length > 0 ? (
        resumes.map((resume, index) => (
          <ResumeCard
            key={resume.file_id || index}
            resume={resume}
            setSelectedResume={setSelectedResume}
            onOpen={onOpen}
          />
        ))
      ) : (
        <div className="text-center w-full text-gray-400 py-10">暂无简历</div>
      )}
    </div>
  );
};

export default ResumeCardList;
