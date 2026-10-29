"use client";
import { useRef } from "react";
import { MAX_ATTACHMENTS } from "@/lib/constants";

export function AttachmentPicker({ files, onChange, disabled }: { files: File[]; onChange: (f: File[]) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={ref} type="file" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        onChange={(e) => { onChange([...files, ...Array.from(e.target.files ?? [])]); if (ref.current) ref.current.value = ""; }} />
      <button type="button" className="btn-secondary" disabled={disabled || files.length >= MAX_ATTACHMENTS} onClick={() => ref.current?.click()}>
        Attach files ({files.length}/{MAX_ATTACHMENTS})
      </button>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded bg-ink-100 px-2 py-1 text-xs">
              <span className="truncate">{f.name} · {(f.size / 1024).toFixed(0)} KB</span>
              <button type="button" className="text-red-600 hover:underline" disabled={disabled} onClick={() => onChange(files.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
