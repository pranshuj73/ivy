"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@/types/task";
import type { Bucket } from "@/types/bucket";
import Header from "./Header";
import { storageAdapter, getStreak } from "@/lib/storage";
import { toDateString } from "@/lib/date";
import PanelContainer from "./PanelContainer";
import BucketListPanel from "./BucketListPanel";
import CalendarPanel from "./CalendarPanel";
import TaskInput from "./TaskInput";
import { AnimatePresence, motion } from "framer-motion";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [streak, setStreakState] = useState<number>(0);
  const today = useMemo(() => toDateString(new Date()), []);

  // Panels & input
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const nowTimer = useRef<number | null>(null);
  const [dateTime, setDateTime] = useState<string>(() => {
    const d = new Date();
    return `${toDateString(d)} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  });

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

    // Clock update
    nowTimer.current = window.setInterval(() => {
      const d = new Date();
      setDateTime(`${toDateString(d)} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 1000);
    return () => {
      if (nowTimer.current) window.clearInterval(nowTimer.current);
    };
  }, []);

  const todaysAll = useMemo(() => tasks.filter((t) => t.dueDate === today), [tasks, today]);
  const completedCount = todaysAll.filter((t) => t.completed).length;
  const allDone = todaysAll.length > 0 && completedCount === todaysAll.length;
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
    next.forEach((t) => storageAdapter.saveTask(t));
  }

  function addBucket(name: string): Bucket {
    const existing = buckets.find((b) => b.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const bucket: Bucket = { id: uid(), name, createdAt: new Date().toISOString() };
    const next = [...buckets, bucket];
    setBuckets(next);
    storageAdapter.saveBucket(bucket);
    return bucket;
  }

  function ensureBucketByName(name: string): Bucket {
    const trimmed = name.trim();
    if (!trimmed) {
      const inbox = buckets.find((b) => b.id === "inbox" || b.name.toLowerCase() === "inbox");
      if (inbox) return inbox;
      return addBucket("Inbox");
    }
    const found = buckets.find((b) => b.name.toLowerCase() === trimmed.toLowerCase());
    return found ?? addBucket(trimmed);
  }

  function parseBucketFromInput(input: string): Bucket {
    // default Inbox
    const mentionMatch = input.match(/@([^\s@]+)/);
    if (mentionMatch) {
      const bucketName = mentionMatch[1].replace(/[-_]/g, " ");
      return ensureBucketByName(bucketName);
    }
    return ensureBucketByName("Inbox");
  }

  function addTaskFromInput(raw: string) {
    const title = raw.replace(/\s+$/, "").trim();
    if (!title || !canAdd) return;
    const bucket = parseBucketFromInput(title);
    const cleanTitle = title.replace(/@([^\s@]+)/, (m) => {
      // keep the mention text as-is in the title, or remove? Keep it out for clarity
      return "";
    }).trim();

    const task: Task = {
      id: uid(),
      title: cleanTitle || title, // if removing mention results empty, keep original
      completed: false,
      bucketId: bucket.id,
      createdAt: new Date().toISOString(),
      dueDate: today,
      rolledOver: false,
    };
    const next = [...tasks, task];
    persistTasks(next);
    setSelectedIndex(todaysAll.length); // focus the new task index
    setInputValue("");
    setInputVisible(false);
  }

  function toggleTaskById(id: string) {
    const next = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    persistTasks(next);
  }

  function deleteTaskById(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    storageAdapter.deleteTask(id);
    setSelectedIndex(null);
  }

  function editTaskTitle(id: string, title: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    storageAdapter.updateTask(id, { title });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Disable global shortcuts while typing in inputs/textareas/contenteditable
      const ae = document.activeElement as HTMLElement | null;
      const tag = ae?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || ae?.getAttribute("contenteditable") === "true";
      if (isTyping) return;

      if (e.key === "c" || e.key === "n") {
        e.preventDefault();
        if (!inputVisible) setInputVisible(true);
      } else if (e.key === "b") {
        e.preventDefault();
        const next = !(leftOpen || rightOpen);
        setLeftOpen(next);
        setRightOpen(next);
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (todaysAll.length === 0) return;
        setSelectedIndex((prev) => {
          const next = prev == null ? 0 : Math.min(prev + 1, todaysAll.length - 1);
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (todaysAll.length === 0) return;
        setSelectedIndex((prev) => {
          const next = prev == null ? todaysAll.length - 1 : Math.max(prev - 1, 0);
          return next;
        });
      } else if (e.key === "x") {
        e.preventDefault();
        if (selectedIndex != null && todaysAll[selectedIndex]) {
          toggleTaskById(todaysAll[selectedIndex].id);
        }
      } else if (e.key === "Enter") {
        if (inputVisible) {
          e.preventDefault();
          addTaskFromInput(inputValue);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (inputVisible) {
          setInputVisible(false);
          setInputValue("");
          return;
        }
        if (leftOpen || rightOpen) {
          setLeftOpen(false);
          setRightOpen(false);
          return;
        }
        setSelectedIndex(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [todaysAll, selectedIndex, leftOpen, rightOpen, inputVisible, inputValue]);

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

    // Double tap detection -> mark all today's tasks complete
    const now = Date.now();
    if (absX < 10 && absY < 10 && dt < 250) {
      if (now - lastTapRef.current < 300) {
        todaysAll.forEach((task) => storageAdapter.updateTask(task.id, { completed: true }));
        setTasks((prev) => prev.map((t) => (t.dueDate === today ? { ...t, completed: true } : t)));
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    }

    if (absX > absY && absX > swipeThreshold) {
      // horizontal swipe: open side panels
      if (dx > 0) {
        setLeftOpen(true);
      } else {
        setRightOpen(true);
      }
    } else if (absY > absX && absY > swipeThreshold) {
      if (dy < 0) {
        // swipe up -> open add
        setInputVisible(true);
      } else {
        // swipe down -> toggle selected
        if (selectedIndex != null && todaysAll[selectedIndex]) {
          toggleTaskById(todaysAll[selectedIndex].id);
        }
      }
    }
  }

  return (
    <div className="relative h-full">
      <PanelContainer
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onOverlayClick={() => {
          setLeftOpen(false);
          setRightOpen(false);
        }}
        left={<BucketListPanel buckets={buckets} tasks={tasks} onToggle={toggleTaskById} onDelete={deleteTaskById} onEdit={editTaskTitle} />}
        right={<CalendarPanel tasks={tasks} />}
      >
        <div
          className="h-full min-h-0 max-w-2xl mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl shadow flex flex-col select-none overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Header className="pt-6 pb-4" colorClass={colorClass} streak={streak} date={dateTime} />

          <div className="pb-2 text-sm text-muted-foreground">{completedCount}/{Math.max(6, todaysAll.length)} completed</div>

          <ul className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence initial={false}>
              {todaysAll.map((task, i) => (
                <motion.li
                  layout
                  key={task.id}
                  data-task-id={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-center justify-between rounded-lg border border-gray-200 bg-secondary/20 p-2 shadow-sm transition-colors dark:border-neutral-700 ${
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
                    <span className={`text-sm ${task.completed ? "line-through text-gray-400" : ""}`}>{task.title}</span>
                  </div>
                  <button onClick={() => deleteTaskById(task.id)} className="text-red-500 text-sm hover:text-red-700">
                    Delete
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
            {todaysAll.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No tasks for today.</li>}
          </ul>

          {!canAdd && (
            <p className="mt-2 text-xs text-destructive">Daily focus limit reached (6). Complete tasks to add more.</p>
          )}
        </div>
      </PanelContainer>

      {/* Task input overlay */}
      <TaskInput
        visible={inputVisible}
        value={inputValue}
        onChange={setInputValue}
        onSubmit={() => addTaskFromInput(inputValue)}
        onClose={() => setInputVisible(false)}
        buckets={buckets}
      />
    </div>
  );
}
