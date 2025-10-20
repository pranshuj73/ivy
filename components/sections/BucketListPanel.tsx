"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Task } from "@/types/task";
import type { Bucket } from "@/types/bucket";
import { ChevronDown, ChevronRight, Pencil, Trash2, CheckSquare, PlusCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export type BucketListPanelProps = {
  buckets: Bucket[];
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string, title: string) => void;
  onImportSelected?: (taskIds: string[]) => void;
};

export default function BucketListPanel({
  buckets,
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onImportSelected,
}: BucketListPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    setDraft(editing?.title ?? "");
  }, [editing]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const b of buckets) map.set(b.id, []);
    for (const t of tasks) {
      const list = map.get(t.bucketId) ?? [];
      list.push(t);
      map.set(t.bucketId, list);
    }
    return Array.from(map.entries());
  }, [buckets, tasks]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <div className="h-full overflow-y-auto p-4 relative">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Buckets
      </h2>
      <div className="space-y-2">
        {grouped.map(([bucketId, list]) => {
          const bucket = buckets.find((b) => b.id === bucketId);
          const isCollapsed = !!collapsed[bucketId];
          return (
            <div
              key={bucketId}
              className="rounded-lg border border-border bg-background/60"
            >
              <button
                className="flex w-full items-center justify-between px-3 py-2"
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [bucketId]: !c[bucketId] }))
                }
                aria-expanded={!isCollapsed}
              >
                <span className="text-sm font-medium">
                  {bucket?.name ?? "Unknown"}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              {!isCollapsed && (
                <ul className="divide-y divide-border/80">
                  {list.length === 0 && (
                    <li className="p-3 text-xs text-muted-foreground">
                      No tasks
                    </li>
                  )}
                  {list.map((t) => {
                    const isSelected = selected.has(t.id);
                    const selectedClasses = selectMode && isSelected ? "bg-primary/10 ring-2 ring-primary/60" : "";
                    return (
                      <li
                        key={t.id}
                        className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${selectedClasses} ${selectMode ? "cursor-pointer" : ""}`}
                        onClick={(e) => {
                          if (!selectMode) return;
                          const target = e.target as HTMLElement;
                          if (target.closest("[data-row-action]") || target.closest("input")) return;
                          toggleSelect(t.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={t.completed}
                            onCheckedChange={() => onToggle(t.id)}
                            data-row-action
                          />
                          <span
                            className={`text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                          >
                            {t.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditing({ id: t.id, title: t.title })}
                            aria-label="Edit task"
                            data-row-action
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDelete(t.id)}
                            aria-label="Delete task"
                            data-row-action
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky bottom controls (panel-wide) */}
      <div className="sticky bottom-0 left-0 right-0 -mx-4 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur">
        {!selectMode ? (
          <Button variant="outline" className="gap-2 w-full" onClick={() => setSelectMode(true)}>
            <CheckSquare className="size-4" /> Select tasks
          </Button>
        ) : (
          <div>
            <div className="mb-2 text-xs text-muted-foreground">{selected.size} selected</div>
            <div className="flex gap-2">
              <Button
                className="gap-2 flex-1"
                disabled={selected.size === 0}
                onClick={() => {
                  if (onImportSelected) onImportSelected(Array.from(selected));
                  clearSelection();
                  setSelectMode(false);
                }}
              >
                <PlusCircle className="size-4" /> Import
              </Button>
              <Button
                variant="secondary"
                className="gap-2 flex-1"
                onClick={() => {
                  clearSelection();
                  setSelectMode(false);
                }}
              >
                <XCircle className="size-4" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            key="edit-bucket-task"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 text-sm font-medium">Edit task</div>
              <div className="space-y-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.currentTarget.value)}
                  placeholder="Task title"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const t = draft.trim();
                      if (t) {
                        onEdit(editing.id, t);
                        setEditing(null);
                      }
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditing(null);
                    }
                  }}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="destructive" onClick={() => { onDelete(editing.id); setEditing(null); }}>Delete</Button>
                  <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={() => { const t = draft.trim(); if (t) { onEdit(editing.id, t); setEditing(null); } }} disabled={draft.trim().length === 0}>Save</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
