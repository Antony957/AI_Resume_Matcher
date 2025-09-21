import type { Certification } from "@/types";

import { Kbd } from "@heroui/kbd";
import React from "react";
const Certification: React.FC<Certification> = (certification) => {
  return (
    <Kbd keys={["command"]}>
      {certification.name}---{certification.expiry_date}---
      {certification.issued_date}
    </Kbd>
  );
};

export default Certification;
