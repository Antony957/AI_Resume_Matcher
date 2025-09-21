import React from "react";
import { Pagination } from "@heroui/pagination";

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex justify-center mt-4">
      <Pagination
        showControls
        page={currentPage}
        total={totalPages}
        onChange={(page: number) => onPageChange(page)}
      />
    </div>
  );
};

export default PaginationComponent;
