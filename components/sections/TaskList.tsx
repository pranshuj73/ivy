"use client";
import React, { useState, useEffect } from "react";
import AddTask from "@/components/sections/AddTask";
import type { Task } from "@/types/task";
import Header from "./Header";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem("tasks");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-full max-w-xl mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl shadow flex flex-col">
      <Header className="pt-10 pb-16" />
      <ul className="space-y-2 h-full flex-1">
        {tasks.map((task, i) => (
          <li
            key={i}
            className="flex items-center justify-between p-2 border rounded-lg border-gray-200 dark:border-neutral-700"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(i)}
                className="h-4 w-4 accent-blue-500"
              />
              <span
                className={`text-sm ${
                  task.completed ? "line-through text-gray-400" : ""
                }`}
              >
                {task.name}
              </span>
            </div>
            <button
              onClick={() => deleteTask(i)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              X
            </button>
          </li>
        ))}
      </ul>
      <AddTask setTaskAction={setTasks} />
    </div>
  );
}

