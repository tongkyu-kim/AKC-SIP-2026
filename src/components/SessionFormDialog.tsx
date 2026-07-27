"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass, Button } from "@/components/ui/Field";
import type { Day, Session, SessionType } from "@/lib/types";

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "session", label: "Session" },
  { value: "break", label: "Break" },
  { value: "meal", label: "Meal" },
  { value: "ceremony", label: "Ceremony" },
  { value: "workshop", label: "Workshop" },
  { value: "logistics", label: "Logistics" },
];

export interface SessionFormValues {
  day_id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  display_time: string;
  session_type: SessionType;
}

function toValues(session: Session | null, defaultDayId: string): SessionFormValues {
  if (!session) {
    return { day_id: defaultDayId, title: "", description: "", event_date: "", start_time: "", end_time: "", display_time: "", session_type: "session" };
  }
  return {
    day_id: session.day_id,
    title: session.title,
    description: session.description ?? "",
    event_date: session.event_date ?? "",
    start_time: session.start_time ?? "",
    end_time: session.end_time ?? "",
    display_time: session.display_time ?? "",
    session_type: session.session_type,
  };
}

// Mounted only while the modal is open, so its form state is naturally fresh
// each time (no effect needed to resync state from props on open).
function SessionForm({
  session,
  days,
  defaultDayId,
  onClose,
  onSave,
  onDelete,
}: {
  session: Session | null;
  days: Day[];
  defaultDayId: string;
  onClose: () => void;
  onSave: (values: SessionFormValues) => Promise<void>;
  onDelete?: (session: Session) => Promise<void>;
}) {
  const [values, setValues] = useState<SessionFormValues>(() => toValues(session, defaultDayId));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SessionFormValues>(key: K, v: SessionFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    if (!values.title.trim() || !values.day_id) return;
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Field label="Title *">
        <input className={inputClass} value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. (Session 1) Cross-Border AI Governance" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Day">
          <select className={inputClass} value={values.day_id} onChange={(e) => set("day_id", e.target.value)}>
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputClass} value={values.session_type} onChange={(e) => set("session_type", e.target.value as SessionType)}>
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Date (only needed if this session has its own date — e.g. a Pre-Session workshop)">
        <input type="date" className={inputClass} value={values.event_date} onChange={(e) => set("event_date", e.target.value)} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Start time">
          <input className={inputClass} value={values.start_time} onChange={(e) => set("start_time", e.target.value)} placeholder="14:00" />
        </Field>
        <Field label="End time">
          <input className={inputClass} value={values.end_time} onChange={(e) => set("end_time", e.target.value)} placeholder="16:00" />
        </Field>
        <Field label="Time label override">
          <input className={inputClass} value={values.display_time} onChange={(e) => set("display_time", e.target.value)} placeholder="All Day" />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24`}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Free text notes shown under the session (use for sessions without itemized agenda items)"
        />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <div>
          {session && onDelete && (
            <Button
              variant="danger"
              onClick={async () => {
                if (confirm(`Delete "${session.title}"? This also deletes its subsessions.`)) {
                  await onDelete(session);
                  onClose();
                }
              }}
            >
              Delete session
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !values.title.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SessionFormDialog({
  open,
  session,
  days,
  defaultDayId,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  session: Session | null;
  days: Day[];
  defaultDayId?: string;
  onClose: () => void;
  onSave: (values: SessionFormValues) => Promise<void>;
  onDelete?: (session: Session) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={session ? "Edit Session" : "Add Session"} widthClass="max-w-xl">
      {open && (
        <SessionForm
          session={session}
          days={days}
          defaultDayId={defaultDayId ?? days[0]?.id ?? ""}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Modal>
  );
}
