"use client";

import { PlusIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { Task } from "@/types/task";

type AddTaskProps = {
  setTaskAction: React.Dispatch<React.SetStateAction<Task[]>>;
};

export default function AddTask({ setTaskAction }: AddTaskProps) {
  const [input, setInput] = useState("");

  const addTask = () => {
    if (!input.trim()) return;
    setTaskAction((prev: Task[]) => [
      ...prev,
      { name: input.trim(), completed: false },
    ]);
    setInput("");
  };

  return (
    <InputGroup>
      <InputGroupInput placeholder="Add Task" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          variant="default"
          className="rounded-full"
          size="icon-xs"
          onClick={() => addTask()}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
