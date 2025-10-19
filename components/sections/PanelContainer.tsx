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

export default function PanelContainer({ leftOpen, rightOpen, left, right, children, className, onOverlayClick }: PanelContainerProps) {
  const anyOpen = leftOpen || rightOpen;
  return (
    <div className={`relative h-full overflow-hidden ${className ?? ""}`}>
      {/* Dim overlay */}
      <AnimatePresence>{anyOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.6 }}
          className="pointer-events-auto absolute inset-0 z-10 bg-black"
          onClick={onOverlayClick}
          aria-hidden
        />
      )}</AnimatePresence>

      {/* Left panel */}
      <motion.div
        aria-hidden={!leftOpen}
        initial={false}
        animate={{ x: leftOpen ? 0 : -384 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[320px] max-w-[80vw] will-change-transform"
      >
        <div className="pointer-events-auto h-full overflow-y-auto rounded-r-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
          {left}
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        aria-hidden={!rightOpen}
        initial={false}
        animate={{ x: rightOpen ? 0 : 384 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[360px] max-w-[85vw] will-change-transform"
      >
        <div className="pointer-events-auto h-full overflow-y-auto rounded-l-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
          {right}
        </div>
      </motion.div>

      {/* Center content with subtle scale when side panels are open */}
      <motion.div
        className="h-full"
        initial={false}
        animate={{ scale: anyOpen ? 0.985 : 1, opacity: anyOpen ? 0.95 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
