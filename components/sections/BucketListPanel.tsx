"use client";

import React, { useMemo, useState } from "react";
import type { Task } from "@/types/task";
import type { Bucket } from "@/types/bucket";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";

export type BucketListPanelProps = {
  buckets: Bucket[];
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string, title: string) => void;
};

export default function BucketListPanel({ buckets, tasks, onToggle, onDelete, onEdit }: BucketListPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Buckets</h2>
      <div className="space-y-2">
        {grouped.map(([bucketId, list]) => {
          const bucket = buckets.find((b) => b.id === bucketId);
          const isCollapsed = !!collapsed[bucketId];
          return (
            <div key={bucketId} className="rounded-lg border border-border bg-background/60">
              <button
                className="flex w-full items-center justify-between px-3 py-2"
                onClick={() => setCollapsed((c) => ({ ...c, [bucketId]: !c[bucketId] }))}
                aria-expanded={!isCollapsed}
              >
                <span className="text-sm font-medium">{bucket?.name ?? "Unknown"}</span>
                {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {!isCollapsed && (
                <ul className="divide-y divide-border/80">
                  {list.length === 0 && (
                    <li className="p-3 text-xs text-muted-foreground">No tasks</li>
                  )}
                  {list.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-3 py-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => onToggle(t.id)}
                          className="h-3.5 w-3.5 accent-blue-500"
                        />
                        <span className={`text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {t.title}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const next = window.prompt("Edit task title", t.title);
                            if (next == null) return;
                            const trimmed = next.trim();
                            if (!trimmed) return;
                            onEdit(t.id, trimmed);
                          }}
                          aria-label="Edit task"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="text-xs text-destructive hover:opacity-80"
                          onClick={() => onDelete(t.id)}
                          aria-label="Delete task"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
