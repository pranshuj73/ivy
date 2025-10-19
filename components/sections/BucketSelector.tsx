"use client";

import type { Bucket } from "@/types/bucket";
import { useEffect, useMemo, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { PlusIcon } from "lucide-react";

type BucketSelectorProps = {
  buckets: Bucket[];
  selectedBucketId: string;
  onSelect: (bucketId: string) => void;
  onCreate: (name: string) => void;
  className?: string;
};

export default function BucketSelector({ buckets, selectedBucketId, onSelect, onCreate, className }: BucketSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const selectedName = useMemo(() => buckets.find(b => b.id === selectedBucketId)?.name ?? "Inbox", [buckets, selectedBucketId]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <select
          className="bg-transparent border rounded-md px-2 py-1 text-sm"
          value={selectedBucketId}
          onChange={(e) => onSelect(e.currentTarget.value)}
        >
          {buckets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setCreating(true)}
          className="text-xs text-primary hover:underline"
        >
          New Bucket
        </button>
      </div>
      {creating && (
        <div className="mt-2">
          <InputGroup>
            <InputGroupInput ref={inputRef} placeholder="Bucket name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" className="rounded-full" onClick={() => {
                const n = name.trim();
                if (!n) return;
                onCreate(n);
                setName("");
                setCreating(false);
              }}>
                <PlusIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      )}
    </div>
  );
}
