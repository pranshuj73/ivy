"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type PanelContainerProps = {
  leftOpen: boolean;
  rightOpen: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode; // center content
  className?: string;
  onOverlayClick?: () => void;
};

export default function PanelContainer({
  leftOpen,
  rightOpen,
  left,
  right,
  children,
  className,
  onOverlayClick,
}: PanelContainerProps) {
  const anyOpen = leftOpen || rightOpen;
  return (
    <div className={`relative h-full ${className ?? ""}`}>
      {/* Dim overlay when a panel is open */}
      <AnimatePresence>
        {anyOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30,
              mass: 0.6,
            }}
            // Keep overlay below the sliding panels so they remain interactive.
            className="pointer-events-auto absolute inset-0 z-10 bg-black"
            onClick={onOverlayClick}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="grid h-full min-h-0 grid-cols-7 gap-4 px-4 py-2">
        {/* Left panel slot (2) */}
        <div className="col-span-2 relative h-full min-h-0 overflow-hidden">
          <motion.div
            aria-hidden={!leftOpen}
            initial={false}
            animate={{ x: leftOpen ? 0 : "-110%", opacity: leftOpen ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="h-full will-change-transform z-20"
          >
            <div className="h-full overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
              {left}
            </div>
          </motion.div>
        </div>

        {/* Center content (3) */}
        <motion.div
          className="col-span-3 h-full min-h-0"
          initial={false}
          animate={{ scale: anyOpen ? 0.985 : 1, opacity: anyOpen ? 0.97 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {children}
        </motion.div>

        {/* Right panel slot (2) */}
        <div className="col-span-2 relative h-full min-h-0 overflow-hidden">
          <motion.div
            aria-hidden={!rightOpen}
            initial={false}
            animate={{ x: rightOpen ? 0 : "110%", opacity: rightOpen ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="h-full will-change-transform z-20"
          >
            <div className="h-full overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
              {right}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
