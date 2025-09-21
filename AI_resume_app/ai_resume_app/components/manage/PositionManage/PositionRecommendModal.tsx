import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";

import PositionResumeCard from "./PositionResumeCard";

import { MatchResult, Position, ResumeProfile } from "@/types";
import { supabase } from "@/config/supabaseClient";

interface PositionRecommendModalProps {
  isOpen: boolean;
  selectedPosition: Position | null;
  onOpenChange: () => void;
}
const PositionRecommendModal: React.FC<PositionRecommendModalProps> = ({
  isOpen,
  selectedPosition,
  onOpenChange,
}) => {
  const [selectedMatchResult, setSelectedMatchResult] = useState<
    MatchResult[] | []
  >([]);
  const [selectedResume, setSelectedResume] = useState<ResumeProfile | null>(
    null,
  );

  useEffect(() => {
    if (!selectedPosition) return;
    async function getMatchResults() {
      const { data: MatchResult, error } = await supabase
        .from("match_result")
        .select("*,resume(*)")
        .eq("position_id", selectedPosition?.id);

      if (error) {
        throw new Error(error.message);
      }

      if (MatchResult.length > 0) {
        const resume = MatchResult[0].resume;

        setSelectedResume(resume);
        setSelectedMatchResult(MatchResult);
      } else {
        setSelectedResume(null);
        setSelectedMatchResult([]);
      }
    }
    getMatchResults();
  }, [selectedPosition?.id]);

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader>推荐职位</ModalHeader>
        <ModalBody>
          <div className="flex flex-wrap">
            {selectedMatchResult.length > 0 ? (
              selectedMatchResult.map((matchResult, index) => (
                <PositionResumeCard
                  key={matchResult.id || index}
                  matchResult={matchResult}
                  resume={selectedResume as ResumeProfile}
                />
              ))
            ) : (
              <div className="text-center w-full text-gray-400 py-10">
                暂无可推荐的简历
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PositionRecommendModal;
