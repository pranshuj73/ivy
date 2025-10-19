"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function HelpFAB({ hidden = false }: { hidden?: boolean }) {
  const [open, setOpen] = React.useState(false);

  if (hidden) return null;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40">
        <Button
          variant="secondary"
          size="lg"
          className="rounded-full shadow-md"
          onClick={() => setOpen(true)}
        >
          <HelpCircle /> Help
        </Button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            key="help"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center bg-black/40"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-sm font-semibold">Quick help</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>j/k: move selection</li>
                <li>x: toggle done</li>
                <li>c or n: quick add</li>
                <li>b: toggle side panels</li>
                <li>Esc: close panels or input</li>
                <li>Use @bucket to assign while adding</li>
              </ul>
              <div className="mt-3 text-xs text-muted-foreground">
                Long-press on a task (mobile) to edit or delete.
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
