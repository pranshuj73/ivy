"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { XIcon, PlusIcon } from "lucide-react";
import type { Bucket } from "@/types/bucket";

export type TaskInputProps = {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  buckets: Bucket[];
};

export default function TaskInput({ visible, value, onChange, onSubmit, onClose, buckets }: TaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  const mention = useMemo(() => {
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) return "";
    const after = value.slice(atIndex + 1);
    // Stop if space or start of word boundary triggers end of mention
    if (/\s/.test(after)) return "";
    return after.toLowerCase();
  }, [value]);

  const suggestions = useMemo(() => {
    if (!mention) return [] as Bucket[];
    return buckets.filter((b) => b.name.toLowerCase().includes(mention));
  }, [buckets, mention]);

  function applySuggestion(name: string) {
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) return;
    const next = value.slice(0, atIndex + 1) + name + " ";
    onChange(next);
    inputRef.current?.focus();
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="pointer-events-auto w-full max-w-2xl p-3">
        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg">
          <div className="p-2">
            <InputGroup>
              <InputGroupInput
                ref={inputRef}
                placeholder="Add task — use @bucket to assign"
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit();
                  if (e.key === "Escape") onClose();
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" className="rounded-full" onClick={onSubmit}>
                  <PlusIcon />
                </InputGroupButton>
                <InputGroupButton size="icon-xs" variant="ghost" className="rounded-full" onClick={onClose}>
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {suggestions.length > 0 && (
              <div className="mt-2 max-h-44 overflow-auto rounded-lg border border-border bg-popover text-sm shadow">
                {suggestions.map((b) => (
                  <button
                    key={b.id}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-secondary/60"
                    onClick={() => applySuggestion(b.name)}
                  >
                    <span>@{b.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
