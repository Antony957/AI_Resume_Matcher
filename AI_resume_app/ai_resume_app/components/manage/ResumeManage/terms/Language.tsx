import type { Language } from "@/types";

import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import React from "react";

const Language: React.FC<Language> = (language) => {
  return (
    <Popover placement="top">
      <PopoverTrigger>
        <Button>{language.language}</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-2">
          <div className="text-small font-bold">{language.certificate}</div>
          <div className="text-tiny">{language.proficiency}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Language;
