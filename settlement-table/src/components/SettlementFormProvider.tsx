import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { createBlankParticipant } from "../features/settlement/createBlankParticipant";
import type { Participant } from "../features/settlement/settlement";

export type SettlementFormValues = {
  participants: Participant[];
};

export function SettlementFormProvider({ children }: { children: ReactNode }) {
  const form = useForm<SettlementFormValues>({
    defaultValues: {
      participants: [
        createBlankParticipant(crypto.randomUUID()),
        createBlankParticipant(crypto.randomUUID()),
      ],
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
