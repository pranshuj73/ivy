"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AddTask from "@/components/sections/AddTask";
import type { Task } from "@/types/task";
import type { Bucket } from "@/types/bucket";
import Header from "./Header";
import BucketSelector from "./BucketSelector";
import { storageAdapter, getStreak } from "@/lib/storage";
import { toDateString } from "@/lib/date";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucketId, setSelectedBucketId] = useState<string>("inbox");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [streak, setStreakState] = useState<number>(0);
  const today = useMemo(() => toDateString(new Date()), []);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gesture helpers
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    // Initialize and perform rollover
    storageAdapter.resetDay();
    // Load data
    setBuckets(storageAdapter.getBuckets());
    setTasks(storageAdapter.getTasks());
    setStreakState(getStreak());
  }, []);

  const todaysAll = useMemo(() => tasks.filter((t) => t.dueDate === today), [tasks, today]);
  const todaysForBucket = useMemo(
    () => todaysAll.filter((t) => t.bucketId === selectedBucketId),
    [todaysAll, selectedBucketId]
  );
  const allDone = todaysAll.length > 0 && todaysAll.every((t) => t.completed);
  const canAdd = todaysAll.length < 6; // Ivy Lee daily limit

  const colorClass = useMemo(() => {
    if (allDone) {
      return streak >= 3 ? "text-emerald-400" : "text-green-400";
    }
    if (todaysAll.length > 0) return "text-sky-400";
    return "text-muted-foreground";
  }, [allDone, todaysAll.length, streak]);

  function persistTasks(next: Task[]) {
    setTasks(next);
    // persist
    next.forEach((t) => storageAdapter.saveTask(t));
  }

  function addBucket(name: string) {
    const bucket: Bucket = { id: uid(), name, createdAt: new Date().toISOString() };
    const next = [...buckets, bucket];
    setBuckets(next);
    storageAdapter.saveBucket(bucket);
    setSelectedBucketId(bucket.id);
  }

  function addTask(title: string) {
    if (!canAdd) return;
    const task: Task = {
      id: uid(),
      title,
      completed: false,
      bucketId: selectedBucketId,
      createdAt: new Date().toISOString(),
      dueDate: today,
      rolledOver: false,
    };
    const next = [...tasks, task];
    persistTasks(next);
    setSelectedIndex(todaysForBucket.length); // focus the new task index for current bucket
  }

  function toggleTaskById(id: string) {
    const next = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    persistTasks(next);
  }

  function deleteTaskById(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    // use adapter to delete
    storageAdapter.deleteTask(id);
    setSelectedIndex(null);
  }

  function cycleBucket(direction: 1 | -1) {
    if (buckets.length === 0) return;
    const idx = Math.max(0, buckets.findIndex((b) => b.id === selectedBucketId));
    const nextIdx = (idx + direction + buckets.length) % buckets.length;
    setSelectedBucketId(buckets[nextIdx].id);
    setSelectedIndex(null);
  }

  // Keyboard shortcuts (basic)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "c" || e.key === "n") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "b") {
        e.preventDefault();
        cycleBucket(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycleBucket(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cycleBucket(1);
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (todaysForBucket.length === 0) return;
        setSelectedIndex((prev) => {
          const next = prev == null ? 0 : Math.min(prev + 1, todaysForBucket.length - 1);
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (todaysForBucket.length === 0) return;
        setSelectedIndex((prev) => {
          const next = prev == null ? todaysForBucket.length - 1 : Math.max(prev - 1, 0);
          return next;
        });
      } else if (e.key === "x") {
        e.preventDefault();
        if (selectedIndex != null && todaysForBucket[selectedIndex]) {
          toggleTaskById(todaysForBucket[selectedIndex].id);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIndex(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [todaysForBucket, selectedIndex, buckets, selectedBucketId]);

  // Gesture handling
  function handleTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };

    // Long press detection
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    const target = (e.target as HTMLElement).closest("[data-task-id]") as HTMLElement | null;
    if (target) {
      const taskId = target.dataset.taskId!;
      longPressTimer.current = window.setTimeout(() => {
        // Enter inline edit mode: prompt for new title or delete
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const nextTitle = window.prompt("Edit task title:", task.title);
        if (nextTitle === null) return; // cancelled
        const trimmed = nextTitle.trim();
        if (trimmed === "") {
          // if cleared, ask to delete
          const yes = window.confirm("Delete task?");
          if (yes) deleteTaskById(taskId);
        } else {
          const next = tasks.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t));
          setTasks(next);
          storageAdapter.updateTask(taskId, { title: trimmed });
        }
      }, 600); // long press duration
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    if (!start) return;
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.time;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const swipeThreshold = 40;

    // Double tap detection
    const now = Date.now();
    if (absX < 10 && absY < 10 && dt < 250) {
      if (now - lastTapRef.current < 300) {
        // double tap: mark all tasks in bucket complete
        todaysForBucket.forEach((task) => storageAdapter.updateTask(task.id, { completed: true }));
        setTasks((prev) => prev.map((t) => (t.bucketId === selectedBucketId && t.dueDate === today ? { ...t, completed: true } : t)));
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    }

    if (absX > absY && absX > swipeThreshold) {
      // horizontal swipe
      if (dx > 0) {
        cycleBucket(-1); // swipe right -> previous bucket
      } else {
        cycleBucket(1); // swipe left -> next bucket
      }
    } else if (absY > absX && absY > swipeThreshold) {
      if (dy < 0) {
        // swipe up -> focus add
        inputRef.current?.focus();
      } else {
        // swipe down -> toggle selected
        if (selectedIndex != null && todaysForBucket[selectedIndex]) {
          toggleTaskById(todaysForBucket[selectedIndex].id);
        }
      }
    }
  }

  return (
    <div
      className="min-h-full max-w-xl mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl shadow flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Header className="pt-10 pb-6" colorClass={colorClass} streak={streak} date={today} />

      <BucketSelector
        className="pb-4"
        buckets={buckets}
        selectedBucketId={selectedBucketId}
        onSelect={(id) => setSelectedBucketId(id)}
        onCreate={addBucket}
      />

      <ul className="space-y-2 h-full flex-1 overflow-auto">
        {todaysForBucket.map((task, i) => (
          <li
            key={task.id}
            data-task-id={task.id}
            className={`flex items-center justify-between p-2 border rounded-lg border-gray-200 dark:border-neutral-700 ${
              selectedIndex === i ? "ring-2 ring-sky-400" : ""
            }`}
            onClick={() => setSelectedIndex(i)}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskById(task.id)}
                className="h-4 w-4 accent-blue-500"
              />
              <span
                className={`text-sm ${task.completed ? "line-through text-gray-400" : ""}`}
              >
                {task.title}
              </span>
            </div>
            <button
              onClick={() => deleteTaskById(task.id)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
        {todaysForBucket.length === 0 && (
          <li className="text-sm text-muted-foreground text-center py-6">No tasks in this bucket for today.</li>
        )}
      </ul>

      <div className="pt-4">
        <AddTask onAdd={addTask} disabled={!canAdd} inputRef={inputRef} />
        {!canAdd && (
          <p className="text-xs text-destructive mt-2">Daily focus limit reached (6). Complete tasks to add more.</p>
        )}
      </div>
    </div>
  );
}
