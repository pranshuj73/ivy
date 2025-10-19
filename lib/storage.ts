"use client";

import { toDateString, isBeforeDate } from "./date";
import type { Bucket } from "@/types/bucket";
import type { Task } from "@/types/task";

export interface StorageAdapter {
  getBuckets(): Bucket[];
  getTasks(): Task[];
  saveBucket(bucket: Bucket): void;
  saveTask(task: Task): void;
  updateTask(taskId: string, updates: Partial<Task>): void;
  deleteTask(taskId: string): void;
  resetDay(): void;
}

const LS_KEYS = {
  buckets: "ivylee:buckets",
  tasks: "ivylee:tasks",
  streak: "ivylee:streak",
  lastActiveDate: "ivylee:lastDate",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function today(): string {
  return toDateString(new Date());
}

function migrateTasks(raw: any[]): Task[] {
  const tdy = today();
  return raw.map((t) => {
    if (t && typeof t === "object" && "title" in t && "id" in t) {
      return t as Task;
    }
    // legacy: { name: string, completed: boolean }
    const legacy = t as { name?: string; completed?: boolean };
    return {
      id: uid(),
      title: (legacy.name ?? "").toString(),
      completed: !!legacy.completed,
      bucketId: "inbox",
      createdAt: new Date().toISOString(),
      dueDate: tdy,
      rolledOver: false,
    } satisfies Task;
  });
}

class LocalStorageAdapter implements StorageAdapter {
  getBuckets(): Bucket[] {
    const buckets = readJSON<Bucket[]>(LS_KEYS.buckets, []);
    if (buckets.length === 0) {
      const inbox: Bucket = {
        id: "inbox",
        name: "Inbox",
        createdAt: new Date().toISOString(),
      };
      writeJSON(LS_KEYS.buckets, [inbox]);
      return [inbox];
    }
    return buckets;
  }

  getTasks(): Task[] {
    const raw = readJSON<any[]>(LS_KEYS.tasks, []);
    const tasks = migrateTasks(raw);
    // ensure persisted migrated form
    writeJSON(LS_KEYS.tasks, tasks);
    return tasks;
  }

  saveBucket(bucket: Bucket): void {
    const buckets = this.getBuckets();
    const existing = buckets.find((b) => b.id === bucket.id);
    if (existing) {
      const next = buckets.map((b) => (b.id === bucket.id ? bucket : b));
      writeJSON(LS_KEYS.buckets, next);
    } else {
      writeJSON(LS_KEYS.buckets, [...buckets, bucket]);
    }
  }

  saveTask(task: Task): void {
    const tasks = this.getTasks();
    const existing = tasks.find((t) => t.id === task.id);
    if (existing) {
      const next = tasks.map((t) => (t.id === task.id ? task : t));
      writeJSON(LS_KEYS.tasks, next);
    } else {
      writeJSON(LS_KEYS.tasks, [...tasks, task]);
    }
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const next = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    writeJSON(LS_KEYS.tasks, next);
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    writeJSON(LS_KEYS.tasks, tasks.filter((t) => t.id !== taskId));
  }

  resetDay(): void {
    const last = readJSON<string | null>(LS_KEYS.lastActiveDate, null);
    const tdy = today();

    if (!last) {
      writeJSON(LS_KEYS.lastActiveDate, tdy);
      return;
    }

    if (!isBeforeDate(last, tdy)) {
      return; // same day or future, nothing to do
    }

    // Evaluate yesterday's completion for streak
    const tasks = this.getTasks();
    const ydayTasks = tasks.filter((t) => t.dueDate === last);
    const hasYday = ydayTasks.length > 0;
    const allDone = hasYday ? ydayTasks.every((t) => t.completed) : false;
    if (hasYday) {
      const currentStreak = readJSON<number>(LS_KEYS.streak, 0);
      const nextStreak = allDone ? currentStreak + 1 : 0;
      writeJSON(LS_KEYS.streak, nextStreak);
    }

    // Rollover incomplete to today
    const nextTasks: Task[] = tasks.map((t) => {
      if (t.dueDate === last && !t.completed) {
        return { ...t, dueDate: tdy, rolledOver: true };
      }
      return t;
    });
    writeJSON(LS_KEYS.tasks, nextTasks);

    // Set lastActiveDate to today
    writeJSON(LS_KEYS.lastActiveDate, tdy);
  }
}

export function getStreak(): number {
  return readJSON<number>(LS_KEYS.streak, 0);
}

export function setStreak(n: number): void {
  writeJSON(LS_KEYS.streak, n);
}

export function getLastActiveDate(): string | null {
  return readJSON<string | null>(LS_KEYS.lastActiveDate, null);
}

export function setLastActiveDate(date: string): void {
  writeJSON(LS_KEYS.lastActiveDate, date);
}

export const storageAdapter: StorageAdapter = new LocalStorageAdapter();
