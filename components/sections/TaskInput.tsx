"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { XIcon, PlusIcon } from "lucide-react";
import type { Bucket } from "@/types/bucket";
import { AnimatePresence, motion } from "framer-motion";

export type TaskInputProps = {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  buckets: Bucket[];
};

export default function TaskInput({
  visible,
  value,
  onChange,
  onSubmit,
  onClose,
  buckets,
}: TaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  const mention = useMemo(() => {
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) return "";
    const after = value.slice(atIndex + 1);
    if (/\s/.test(after)) return "";
    return after.toLowerCase();
  }, [value]);

  const suggestions = useMemo(() => {
    if (!mention) return [] as Bucket[];
    return buckets.filter((b) => b.name.toLowerCase().includes(mention));
  }, [buckets, mention]);

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions.length]);

  function applySuggestion(name: string) {
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) return;
    const next = value.slice(0, atIndex + 1) + name + " ";
    onChange(next);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (mention && suggestions.length > 0 && activeIndex >= 0) {
        applySuggestion(suggestions[activeIndex].name);
      } else {
        onSubmit();
      }
      return;
    }
    // Block global hotkeys while typing
    if (["b", "n", "c", "x", "j", "k"].includes(e.key)) {
      e.stopPropagation();
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="task-input"
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center"
        >
          <div className="pointer-events-auto w-full max-w-2xl p-3">
            <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg">
              <div className="p-2">
                <div className="relative">
                  <InputGroup>
                    <InputGroupInput
                      ref={inputRef}
                      placeholder="Add task — use @bucket to assign"
                      value={value}
                      onChange={(e) => onChange(e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        className="rounded-full"
                        onClick={onSubmit}
                      >
                        <PlusIcon />
                      </InputGroupButton>
                      <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        className="rounded-full"
                        onClick={onClose}
                      >
                        <XIcon />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        key="suggestions"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 right-0 mb-2 max-h-44 overflow-auto rounded-lg border border-border bg-popover text-sm shadow z-50"
                        role="listbox"
                      >
                        {suggestions.map((b, i) => (
                          <button
                            key={b.id}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                              i === activeIndex
                                ? 'bg-secondary/80'
                                : 'hover:bg-secondary/60'
                            }`}
                            onClick={() => applySuggestion(b.name)}
                            role="option"
                            aria-selected={i === activeIndex}
                          >
                            <span>@{b.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
