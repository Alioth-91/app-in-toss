import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { createBlankParticipant } from "../features/settlement/createBlankParticipant";
import type { Expense, Participant } from "../features/settlement/settlement";

export type SettlementFormValues = {
  participants: Participant[];
  expenses: Expense[];
};

export function SettlementFormProvider({ children }: { children: ReactNode }) {
  const form = useForm<SettlementFormValues>({
    defaultValues: {
      participants: [
        createBlankParticipant(crypto.randomUUID()),
        createBlankParticipant(crypto.randomUUID()),
      ],
      expenses: [],
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
