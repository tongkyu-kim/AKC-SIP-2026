"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass, Button } from "@/components/ui/Field";
import { StatusBadge } from "@/components/StatusBadge";
import type { DayWithSessions, SubsessionKind, SubsessionWithSpeakers } from "@/lib/types";

export interface SubsessionFormValues {
  session_id: string;
  title: string;
  kind: SubsessionKind;
  time_range: string;
  description: string;
  flight_code: string;
  departure_airport: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  hide_speakers: boolean;
}

const EMPTY_FLIGHT_FIELDS = { flight_code: "", departure_airport: "", arrival_city: "", departure_time: "", arrival_time: "" };

function toValues(subsession: SubsessionWithSpeakers | null, defaultSessionId: string): SubsessionFormValues {
  if (!subsession) {
    return { session_id: defaultSessionId, title: "", kind: "program", time_range: "", description: "", hide_speakers: false, ...EMPTY_FLIGHT_FIELDS };
  }
  return {
    session_id: subsession.session_id,
    title: subsession.title,
    kind: subsession.kind,
    time_range: subsession.time_range ?? "",
    description: subsession.description ?? "",
    flight_code: subsession.flight_code ?? "",
    departure_airport: subsession.departure_airport ?? "",
    arrival_city: subsession.arrival_city ?? "",
    departure_time: subsession.departure_time ?? "",
    arrival_time: subsession.arrival_time ?? "",
    hide_speakers: subsession.hide_speakers,
  };
}

// Mounted only while the modal is open, so its form state is naturally fresh each
// time (no effect needed to resync state from props on open). The `subsession` prop
// itself keeps flowing in on every render so the assigned-speakers list stays live
// while add/remove calls resolve.
function SubsessionForm({
  subsession,
  days,
  defaultSessionId,
  onClose,
  onSave,
  onDelete,
  onRemoveSpeakerLink,
}: {
  subsession: SubsessionWithSpeakers | null;
  days: DayWithSessions[];
  defaultSessionId: string;
  onClose: () => void;
  onSave: (values: SubsessionFormValues) => Promise<void>;
  onDelete?: (subsession: SubsessionWithSpeakers) => Promise<void>;
  onRemoveSpeakerLink: (linkId: string) => Promise<void>;
}) {
  const [values, setValues] = useState<SubsessionFormValues>(() => toValues(subsession, defaultSessionId));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SubsessionFormValues>(key: K, v: SubsessionFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const isFlight = values.kind === "flight";
  const effectiveTitle = values.title.trim() || (isFlight ? values.flight_code.trim() : "");

  const handleSubmit = async () => {
    if (!effectiveTitle || !values.session_id) return;
    setSaving(true);
    try {
      await onSave({ ...values, title: effectiveTitle, hide_speakers: isFlight ? false : values.hide_speakers });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <Field label={isFlight ? "Title (defaults to flight code)" : "Title *"}>
          <input
            className={inputClass}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={isFlight ? "Optional — e.g. Malaysia delegation" : "e.g. Presentation 1: AI Governance Across Borders"}
          />
        </Field>
        <Field label="Kind">
          <select className={inputClass} value={values.kind} onChange={(e) => set("kind", e.target.value as SubsessionKind)}>
            <option value="program">Program item</option>
            <option value="flight">Flight</option>
          </select>
        </Field>
      </div>

      <Field label="Session">
        <select className={inputClass} value={values.session_id} onChange={(e) => set("session_id", e.target.value)}>
          {days.map((day) => (
            <optgroup key={day.id} label={day.label}>
              {day.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {isFlight ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Flight code">
              <input className={inputClass} value={values.flight_code} onChange={(e) => set("flight_code", e.target.value)} placeholder="KE672" />
            </Field>
            <Field label="Departure time">
              <input className={inputClass} value={values.departure_time} onChange={(e) => set("departure_time", e.target.value)} placeholder="14:20" />
            </Field>
            <Field label="Arrival time">
              <input className={inputClass} value={values.arrival_time} onChange={(e) => set("arrival_time", e.target.value)} placeholder="22:10" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure airport">
              <input className={inputClass} value={values.departure_airport} onChange={(e) => set("departure_airport", e.target.value)} placeholder="Kuala Lumpur (KUL)" />
            </Field>
            <Field label="Arrival city (Korea)">
              <input className={inputClass} value={values.arrival_city} onChange={(e) => set("arrival_city", e.target.value)} placeholder="Incheon (ICN)" />
            </Field>
          </div>
        </>
      ) : (
        <Field label="Time range">
          <input className={inputClass} value={values.time_range} onChange={(e) => set("time_range", e.target.value)} placeholder="16:30-16:35" />
        </Field>
      )}

      <Field label="Description">
        <textarea className={`${inputClass} min-h-16`} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      {!isFlight && (
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={values.hide_speakers} onChange={(e) => set("hide_speakers", e.target.checked)} />
          Hide the speakers column for this row (gives its description the full row width)
        </label>
      )}

      {subsession && (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{isFlight ? "Passengers" : "Assigned speakers"}</h4>
          <div className="space-y-1.5">
            {subsession.speakers.length === 0 && (
              <p className="text-xs italic text-zinc-400">
                {isFlight ? "No passengers yet — drag a card from either roster onto this flight." : "No speakers assigned yet — drag a speaker card from the roster onto this item."}
              </p>
            )}
            {subsession.speakers.map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-md bg-zinc-50 px-2.5 py-1.5 text-sm dark:bg-zinc-800/60">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">{link.speaker.name}</span>
                  <span className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400">({link.role})</span>
                  <StatusBadge status={link.speaker.status} />
                </div>
                <button className="flex-shrink-0 text-xs text-red-500 hover:underline" onClick={() => onRemoveSpeakerLink(link.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div>
          {subsession && onDelete && (
            <Button
              variant="danger"
              onClick={async () => {
                if (confirm(`Delete "${subsession.title}"?`)) {
                  await onDelete(subsession);
                  onClose();
                }
              }}
            >
              Delete {isFlight ? "flight" : "subsession"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !effectiveTitle}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubsessionFormDialog({
  open,
  subsession,
  days,
  defaultSessionId,
  onClose,
  onSave,
  onDelete,
  onRemoveSpeakerLink,
}: {
  open: boolean;
  subsession: SubsessionWithSpeakers | null;
  days: DayWithSessions[];
  defaultSessionId?: string;
  onClose: () => void;
  onSave: (values: SubsessionFormValues) => Promise<void>;
  onDelete?: (subsession: SubsessionWithSpeakers) => Promise<void>;
  onRemoveSpeakerLink: (linkId: string) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={subsession ? "Edit Item" : "Add Item"} widthClass="max-w-xl">
      {open && (
        <SubsessionForm
          subsession={subsession}
          days={days}
          defaultSessionId={defaultSessionId ?? days[0]?.sessions[0]?.id ?? ""}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          onRemoveSpeakerLink={onRemoveSpeakerLink}
        />
      )}
    </Modal>
  );
}
