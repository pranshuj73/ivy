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

type AddTaskProps = {
  onAdd: (title: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
};

export default function AddTask({ onAdd, disabled = false, placeholder = "Add Task", inputRef }: AddTaskProps) {
  const [input, setInput] = useState("");

  const addTask = () => {
    const title = input.trim();
    if (!title || disabled) return;
    onAdd(title);
    setInput("");
  };

  return (
    <InputGroup>
      <InputGroupInput
        ref={inputRef}
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addTask();
          }
        }}
        disabled={disabled}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          variant="default"
          className="rounded-full"
          size="icon-xs"
          onClick={() => addTask()}
          disabled={disabled}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
