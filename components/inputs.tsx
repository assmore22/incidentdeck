"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

export function ListInput({
  label, items, onChange, placeholder, max = 12, validate,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  validate?: (v: string) => string | null;
}) {
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.length >= max) { setErr(`Maximum ${max} entries.`); return; }
    if (items.includes(v)) { setErr("Duplicate entry."); return; }
    const ve = validate?.(v);
    if (ve) { setErr(ve); return; }
    onChange([...items, v]); setDraft(""); setErr(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-2xs text-faint">{items.length}/{max}</span>
      </div>
      <div className="mt-1.5 flex gap-2">
        <input className="field" value={draft} placeholder={placeholder}
          onChange={(e) => { setDraft(e.target.value); setErr(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="btn btn-ghost" onClick={add} aria-label={`Add ${label}`}><FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /></button>
      </div>
      {err && <div className="mt-1 text-2xs text-critical">{err}</div>}
      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <li key={`${it}-${i}`} className="chip max-w-full border-line bg-bg2 text-ink">
              <span className="truncate normal-case tracking-normal">{it}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-faint hover:text-critical" aria-label="Remove"><FontAwesomeIcon icon={faXmark} className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
