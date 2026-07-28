"use client";

import { createContext, useContext } from "react";
import type { SpeakerCategory, SpeakerStatus } from "./types";

// What kind of thing a speaker is currently assigned to — a session directly
// (e.g. an overall chair) or one of its subsessions/"program items".
export type AssignmentKind = "session" | "subsession";

// Shared vocabulary for the single top-level DndContext in ScheduleBoard: sessions
// reorder within a day, subsessions reorder within a session, and speakers can be
// dragged either from the roster sidebar or from an existing assignment onto any
// session or subsession row (or onto a roster status column, to update availability).
export type DragData =
  | { type: "session"; dayId: string }
  | { type: "subsession"; sessionId: string }
  | { type: "speaker"; source: "roster"; speakerId: string; status: SpeakerStatus }
  | {
      type: "speaker";
      source: "assignment";
      speakerId: string;
      status: SpeakerStatus;
      linkId: string;
      role: string;
      fromKind: AssignmentKind;
      fromId: string;
    }
  // A team pill (e.g. "VIPS", "AKC") dragged from the bottom of a roster
  // panel — dropping it onto a session/subsession attaches the pill itself
  // as a standalone marker there (who "stands" on this program), entirely
  // separate from the assigned-people list. It never touches individual
  // speaker records.
  | { type: "group"; label: string };

// Drop targets include everything draggable can also land on (sessions/subsessions
// accept re-ordering, and both accept a dropped speaker) plus the speaker roster's
// status/type columns, the participant roster's country/status groups, and the
// organizer roster's organization groups — all droppable-only, nothing drags a
// status/country/category/organization column itself. "organization" is kept
// distinct from "country" (even though both just set the same `country` column
// under the hood) so an organizer card can never land on a participant's country
// group or vice versa — see the isOrganizer guard in ScheduleBoard.
export type DropData =
  | DragData
  | { type: "status"; status: SpeakerStatus }
  | { type: "country"; country: string }
  | { type: "category"; category: SpeakerCategory }
  | { type: "organization"; organization: string };

// Lets deeply-nested drop targets (subsession rows, status columns) know what kind of
// thing is currently being dragged, so they only light up as a drop target for
// relevant drags (e.g. a subsession row only highlights while a speaker is airborne).
export const ActiveDragTypeContext = createContext<DragData["type"] | null>(null);

export function useActiveDragType() {
  return useContext(ActiveDragTypeContext);
}
