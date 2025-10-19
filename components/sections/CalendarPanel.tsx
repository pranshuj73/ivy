"use client";

import React, { useMemo } from "react";
import type { Task } from "@/types/task";
import { toDateString } from "@/lib/date";

function getMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const daysInMonth = last.getDate();
  const startWeekday = first.getDay(); // 0-6, Sunday first
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(date.getFullYear(), date.getMonth(), d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export type CalendarPanelProps = {
  tasks: Task[];
  className?: string;
};

export default function CalendarPanel({ tasks, className }: CalendarPanelProps) {
  const now = new Date();
  const monthName = now.toLocaleString(undefined, { month: "long", year: "numeric" });
  const grid = useMemo(() => getMonthGrid(now), [now]);

  // Build day status map
  const byDate = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate;
      const rec = map.get(key) ?? { total: 0, done: 0 };
      rec.total += 1;
      if (t.completed) rec.done += 1;
      map.set(key, rec);
    }
    return map;
  }, [tasks]);

  function colorForDate(d: Date): string {
    const key = toDateString(d);
    const rec = byDate.get(key);
    if (!rec) return "bg-secondary/40";
    if (rec.total > 0 && rec.done === rec.total) return "bg-emerald-500/70 text-white";
    if (rec.total > 0 && rec.done < rec.total) return "bg-red-500/70 text-white";
    return "bg-secondary/40";
  }

  return (
    <div className={`h-full p-4 ${className ?? ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{monthName}</h2>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {grid.map((d, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md border border-border/80 p-1 text-center text-sm transition-colors hover:opacity-90 ${
              d ? colorForDate(d) : "bg-transparent border-transparent"
            }`}
            title={d ? toDateString(d) : ""}
          >
            {d && <span>{d.getDate()}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
