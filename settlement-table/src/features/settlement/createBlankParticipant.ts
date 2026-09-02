import type { Participant } from "./settlement";

export function createBlankParticipant(id: string): Participant {
  return { id, name: "" };
}
