import React from "react";

import PositionCard from "./PositionCard";

import { Position } from "@/types";
interface PositionCardListProps {
  positions: Position[];
  onPositionOpen: () => void;
  onPositionModifyOpen: () => void;
  setSelectedPosition: (position: Position) => void;
}

const PositionCardList: React.FC<PositionCardListProps> = ({
  positions,
  onPositionOpen,
  setSelectedPosition,
  onPositionModifyOpen,
}) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {positions.length > 0 ? (
        positions.map((position, index) => (
          <PositionCard
            key={position.id || index}
            positions={position}
            setSelectedPosition={setSelectedPosition}
            onPositionModifyOpen={onPositionModifyOpen}
            onPositionOpen={onPositionOpen}
          />
        ))
      ) : (
        <div className="text-center w-full text-gray-400 py-10">暂无职位</div>
      )}
    </div>
  );
};

export default PositionCardList;
