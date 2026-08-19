"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass, Button } from "@/components/ui/Field";
import {
  ASEAN_COUNTRIES,
  CATEGORY_LABEL,
  ORGANIZER_ORGS,
  SPEAKER_CATEGORIES,
  STATUSES,
  STATUS_LABEL,
  type Speaker,
  type SpeakerCategory,
  type SpeakerStatus,
} from "@/lib/types";

export interface SpeakerFormValues {
  name: string;
  title_org: string;
  bio: string;
  photo_url: string;
  email: string;
  phone: string;
  status: SpeakerStatus;
  category: SpeakerCategory;
  country: string;
  notes: string;
}

function empty(defaultCategory: SpeakerCategory): SpeakerFormValues {
  return {
    name: "",
    title_org: "",
    bio: "",
    photo_url: "",
    email: "",
    phone: "",
    // Organizers skip the booking-status workflow entirely — they're always
    // prepared, so there's nothing to track.
    status: defaultCategory === "organizer" ? "prepared" : "backup",
    category: defaultCategory,
    country: "",
    notes: "",
  };
}

function toValues(speaker: Speaker | null, defaultCategory: SpeakerCategory): SpeakerFormValues {
  if (!speaker) return empty(defaultCategory);
  return {
    name: speaker.name,
    title_org: speaker.title_org ?? "",
    bio: speaker.bio ?? "",
    photo_url: speaker.photo_url ?? "",
    email: speaker.email ?? "",
    phone: speaker.phone ?? "",
    status: speaker.status,
    category: speaker.category,
    country: speaker.country ?? "",
    notes: speaker.notes ?? "",
  };
}

// Mounted only while the modal is open, so its form state is naturally fresh
// each time (no effect needed to resync state from props on open).
function SpeakerForm({
  speaker,
  defaultCategory,
  onClose,
  onSave,
  onDelete,
}: {
  speaker: Speaker | null;
  defaultCategory: SpeakerCategory;
  onClose: () => void;
  onSave: (values: SpeakerFormValues) => Promise<void>;
  onDelete?: (speaker: Speaker) => Promise<void>;
}) {
  const [values, setValues] = useState<SpeakerFormValues>(() => toValues(speaker, defaultCategory));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SpeakerFormValues>(key: K, v: SpeakerFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    if (!values.name.trim()) return;
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name *">
          <input className={inputClass} value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
        </Field>
        {/* Organizers skip the booking-status workflow — always confirmed/
            prepared, so no Status field for them (see empty() above, which
            already seeds new organizers with status "confirmed"). */}
        {values.category !== "organizer" && (
          <Field label="Status">
            <select className={inputClass} value={values.status} onChange={(e) => set("status", e.target.value as SpeakerStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category (sets avatar color)">
          {/* "organizer" is intentionally left out of SPEAKER_CATEGORIES (so
              this dropdown never offers "convert to Organizer" as a casual
              option — that's the whole point of the Organizer Roster being
              locked). It's added back in here only when editing a speaker
              who is already an organizer, so their own edit dialog isn't
              left showing a category the select has no option for. */}
          <select className={inputClass} value={values.category} onChange={(e) => set("category", e.target.value as SpeakerCategory)}>
            {(values.category === "organizer" ? [...SPEAKER_CATEGORIES, "organizer" as const] : SPEAKER_CATEGORIES).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        {values.category === "participant" && (
          <Field label="Country">
            <select className={inputClass} value={values.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">Others</option>
              {ASEAN_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        )}
        {values.category === "organizer" && (
          <Field label="Organization">
            <select className={inputClass} value={values.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">Others</option>
              {ORGANIZER_ORGS.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field label="Title / Organization">
        <input
          className={inputClass}
          value={values.title_org}
          onChange={(e) => set("title_org", e.target.value)}
          placeholder="e.g. Executive Director, ASEAN Foundation"
        />
      </Field>

      <Field label="Bio (shown in the popup)">
        <textarea
          className={`${inputClass} min-h-24`}
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Short biography..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Photo URL">
          <input className={inputClass} value={values.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Email">
          <input className={inputClass} value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="name@org.com" />
        </Field>
      </div>

      <Field label="Phone">
        <input className={inputClass} value={values.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>

      <Field label="Internal notes">
        <textarea
          className={`${inputClass} min-h-16`}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Visa status, honorarium, travel notes... (organizers only)"
        />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <div>
          {speaker && onDelete && (
            <Button
              variant="danger"
              onClick={async () => {
                // "Delete" (not "Remove") on purpose — this is the one destructive
                // action that takes them off the roster entirely, unlike the
                // "Remove" buttons on a session/subsession's assigned-people list,
                // which only unassign them from that one program and leave them
                // in the roster. Keeping the wording distinct avoids the two
                // getting confused for each other.
                if (confirm(`Delete ${speaker.name} from the roster entirely? This also removes them from any assigned sessions.`)) {
                  await onDelete(speaker);
                  onClose();
                }
              }}
            >
              Delete person
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !values.name.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SpeakerFormDialog({
  open,
  speaker,
  defaultCategory = "speaker",
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  speaker: Speaker | null;
  defaultCategory?: SpeakerCategory;
  onClose: () => void;
  onSave: (values: SpeakerFormValues) => Promise<void>;
  onDelete?: (speaker: Speaker) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={speaker ? "Edit Person" : "Add Person"} widthClass="max-w-xl">
      {open && <SpeakerForm speaker={speaker} defaultCategory={defaultCategory} onClose={onClose} onSave={onSave} onDelete={onDelete} />}
    </Modal>
  );
}
