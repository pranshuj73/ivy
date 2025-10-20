"use client";

import React, { useMemo, useState } from "react";
import type { Task } from "@/types/task";
import type { Bucket } from "@/types/bucket";
import { ChevronDown, ChevronRight, Pencil, Trash2, CheckSquare, PlusCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
                    return (
                      <li
                        key={t.id}
                        className={`flex items-center justify-between px-3 py-2 ${
                          selectMode && isSelected ? "bg-secondary/60" : ""
                        } ${selectMode ? "cursor-pointer" : ""}`}
                        onClick={(e) => {
                          // Only toggle selection when clicking the row itself, not the inner controls
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
                            onClick={() => {
                              const next = window.prompt(
                                "Edit task title",
                                t.title,
                              );
                              if (next == null) return;
                              const trimmed = next.trim();
                              if (!trimmed) return;
                              onEdit(t.id, trimmed);
                            }}
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

      {/* Sticky bottom controls */}
      <div className="sticky bottom-0 -mx-4 px-4 pt-2 bg-gradient-to-t from-card to-transparent">
        {!selectMode ? (
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2" onClick={() => setSelectMode(true)}>
              <CheckSquare className="size-4" /> Select
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">{selected.size} selected</div>
            <div className="flex gap-2">
              <Button
                className="gap-2"
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
                className="gap-2"
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
    </div>
  );
}
