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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import HelpFAB from "./HelpFAB";
import { useSettings } from "@/components/providers/SettingsProvider";

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

  const { animations, density } = useSettings();

  const nowTimer = useRef<number | null>(null);
  const [dateTime, setDateTime] = useState<string>(() => {
    const d = new Date();
    return `${toDateString(d)} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  });

  // Anchor measurement for input overlay width alignment with center panel
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [anchorLeft, setAnchorLeft] = useState<number | undefined>();
  const [anchorWidth, setAnchorWidth] = useState<number | undefined>();

  const measureAnchor = React.useCallback(() => {
    const center = centerRef.current;
    const container = containerRef.current;
    if (!center || !container) return;
    const cRect = center.getBoundingClientRect();
    const pRect = container.getBoundingClientRect();
    setAnchorLeft(cRect.left - pRect.left);
    setAnchorWidth(cRect.width);
  }, []);

  useEffect(() => {
    measureAnchor();
    const onResize = () => measureAnchor();
    window.addEventListener("resize", onResize);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && centerRef.current) {
      ro = new ResizeObserver(() => measureAnchor());
      ro.observe(centerRef.current);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      if (ro && centerRef.current) ro.unobserve(centerRef.current);
    };
  }, [measureAnchor, leftOpen, rightOpen]);

  // Gesture helpers
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
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
      setDateTime(
        `${toDateString(d)} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
    }, 1000);
    return () => {
      if (nowTimer.current) window.clearInterval(nowTimer.current);
    };
  }, []);

  const todaysAll = useMemo(
    () => tasks.filter((t) => t.dueDate === today),
    [tasks, today],
  );
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

  const persistTasks = React.useCallback((next: Task[]) => {
    setTasks(next);
    next.forEach((t) => storageAdapter.saveTask(t));
  }, []);

  function addBucket(name: string): Bucket {
    const existing = buckets.find(
      (b) => b.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    const bucket: Bucket = {
      id: uid(),
      name,
      createdAt: new Date().toISOString(),
    };
    const next = [...buckets, bucket];
    setBuckets(next);
    storageAdapter.saveBucket(bucket);
    return bucket;
  }

  function ensureBucketByName(name: string): Bucket {
    const trimmed = name.trim();
    if (!trimmed) {
      const inbox = buckets.find(
        (b) => b.id === "inbox" || b.name.toLowerCase() === "inbox",
      );
      if (inbox) return inbox;
      return addBucket("Inbox");
    }
    const found = buckets.find(
      (b) => b.name.toLowerCase() === trimmed.toLowerCase(),
    );
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
    const cleanTitle = title
      .replace(/@([^\s@]+)/, (m) => {
        // keep the mention text as-is in the title, or remove? Keep it out for clarity
        return "";
      })
      .trim();

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

  const toggleTaskById = React.useCallback(
    (id: string) => {
      const next = tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      );
      persistTasks(next);
    },
    [tasks, persistTasks],
  );

  const deleteTaskById = React.useCallback(
    (id: string) => {
      const next = tasks.filter((t) => t.id !== id);
      setTasks(next);
      storageAdapter.deleteTask(id);
      setSelectedIndex(null);
    },
    [tasks],
  );

  const editTaskTitle = React.useCallback((id: string, title: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    storageAdapter.updateTask(id, { title });
  }, []);

  // Keyboard shortcuts (use stable listener to avoid re-renders/flicker)
  const todaysAllRef = useRef<Task[]>([]);
  const selectedIndexRef = useRef<number | null>(null);
  const leftOpenRef = useRef(false);
  const rightOpenRef = useRef(false);
  const inputVisibleRef = useRef(false);
  const inputValueRef = useRef("");

  useEffect(() => {
    todaysAllRef.current = todaysAll;
  }, [todaysAll]);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  useEffect(() => {
    leftOpenRef.current = leftOpen;
  }, [leftOpen]);
  useEffect(() => {
    rightOpenRef.current = rightOpen;
  }, [rightOpen]);
  useEffect(() => {
    inputVisibleRef.current = inputVisible;
  }, [inputVisible]);
  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Disable global shortcuts while typing in inputs/textareas/contenteditable
      const ae = document.activeElement as HTMLElement | null;
      const tag = ae?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        ae?.getAttribute("contenteditable") === "true";
      if (isTyping) return;

      const todays = todaysAllRef.current;
      const sel = selectedIndexRef.current;
      const leftOpen = leftOpenRef.current;
      const rightOpen = rightOpenRef.current;
      const inputVisible = inputVisibleRef.current;
      const currentInput = inputValueRef.current;

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
        if (todays.length === 0) return;
        setSelectedIndex((prev) => {
          const next = prev == null ? 0 : Math.min(prev + 1, todays.length - 1);
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (todays.length === 0) return;
        setSelectedIndex((prev) => {
          const next = prev == null ? todays.length - 1 : Math.max(prev - 1, 0);
          return next;
        });
      } else if (e.key === "x") {
        e.preventDefault();
        if (sel != null && todays[sel]) {
          toggleTaskById(todays[sel].id);
        }
      } else if (e.key === "Enter") {
        if (inputVisible) {
          e.preventDefault();
          addTaskFromInput(currentInput);
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
  }, [toggleTaskById]);

  // Gesture handling
  function handleTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };

    // Long press detection
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    const target = (e.target as HTMLElement).closest(
      "[data-task-id]",
    ) as HTMLElement | null;
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
          const next = tasks.map((t) =>
            t.id === taskId ? { ...t, title: trimmed } : t,
          );
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
        todaysAll.forEach((task) =>
          storageAdapter.updateTask(task.id, { completed: true }),
        );
        setTasks((prev) =>
          prev.map((t) =>
            t.dueDate === today ? { ...t, completed: true } : t,
          ),
        );
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

  type TaskRowProps = {
    task: Task;
    index: number;
    selected: boolean;
    onSelect: (index: number) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    animations: boolean;
    density: "comfortable" | "compact";
  };

  const TaskRow = React.useMemo(
    () =>
      React.memo(function TaskRow({
        task,
        index,
        selected,
        onSelect,
        onToggle,
        onDelete,
        animations,
        density,
      }: TaskRowProps) {
        return (
          <motion.li
            layout="position"
            data-task-id={task.id}
            initial={animations ? { opacity: 0, y: 6 } : false}
            animate={animations ? { opacity: 1, y: 0 } : undefined}
            exit={animations ? { opacity: 0, y: -6 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
            className="list-none"
            onClick={() => onSelect(index)}
          >
            <Card
              className={`group flex items-center justify-between ${density === "compact" ? "px-2 py-1" : "p-2"} ${selected ? "ring-2 ring-sky-400" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggle(task.id)}
                />
                <span
                  className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {task.title}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete task"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </Card>
          </motion.li>
        );
      }),
    [],
  );

  const TaskItems = React.useMemo(
    () =>
      React.memo(function TaskItems({
        items,
        selectedIndex,
        onSelect,
        onToggle,
        onDelete,
        animations,
        density,
      }: {
        items: Task[];
        selectedIndex: number | null;
        onSelect: (index: number) => void;
        onToggle: (id: string) => void;
        onDelete: (id: string) => void;
        animations: boolean;
        density: "comfortable" | "compact";
      }) {
        return (
          <ul
            className={`${density === "compact" ? "space-y-1" : "space-y-2"} flex-1 overflow-y-auto overflow-x-hidden`}
          >
            <AnimatePresence initial={false}>
              {items.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={i}
                  selected={selectedIndex === i}
                  onSelect={onSelect}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  animations={animations}
                  density={density}
                />
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No tasks for today.
              </li>
            )}
          </ul>
        );
      }),
    [],
  );

  return (
    <div className="relative h-full" ref={containerRef}>
      <PanelContainer
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onOverlayClick={() => {
          setLeftOpen(false);
          setRightOpen(false);
        }}
        left={
          <BucketListPanel
            buckets={buckets}
            tasks={tasks}
            onToggle={toggleTaskById}
            onDelete={deleteTaskById}
            onEdit={editTaskTitle}
            onImportSelected={(ids) => {
              if (!ids || ids.length === 0) return;
              setTasks((prev) => {
                const set = new Set(ids);
                const next = prev.map((t) =>
                  set.has(t.id)
                    ? { ...t, dueDate: today, rolledOver: false }
                    : t,
                );
                // Persist updates for imported tasks
                ids.forEach((id) =>
                  storageAdapter.updateTask(id, {
                    dueDate: today,
                    rolledOver: false,
                  }),
                );
                return next;
              });
            }}
          />
        }
        right={<CalendarPanel tasks={tasks} />}
      >
        <div
          className="h-full min-h-0 p-6 bg-card text-card-foreground rounded-xl shadow flex flex-col select-none overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          ref={centerRef}
        >
          <Header
            className="pt-6 pb-4"
            colorClass={colorClass}
            streak={streak}
            date={dateTime}
          />

          <div className="pb-2 text-sm text-muted-foreground">
            {completedCount}/{Math.max(6, todaysAll.length)} completed
          </div>

          <TaskItems
            items={todaysAll}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onToggle={toggleTaskById}
            onDelete={deleteTaskById}
            animations={animations}
            density={density}
          />

          {!canAdd && (
            <p className="mt-2 text-xs text-destructive">
              Daily focus limit reached (6). Complete tasks to add more.
            </p>
          )}
        </div>
      </PanelContainer>

      <HelpFAB hidden={leftOpen || rightOpen} />

      {/* Task input overlay */}
      <TaskInput
        visible={inputVisible}
        value={inputValue}
        onChange={setInputValue}
        onSubmit={() => addTaskFromInput(inputValue)}
        onClose={() => setInputVisible(false)}
        buckets={buckets}
        anchorLeft={anchorLeft}
        anchorWidth={anchorWidth}
      />
    </div>
  );
}
