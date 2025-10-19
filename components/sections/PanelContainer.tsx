"use client";

import React from "react";

type PanelContainerProps = {
  leftOpen: boolean;
  rightOpen: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode; // center content
  className?: string;
};

export default function PanelContainer({ leftOpen, rightOpen, left, right, children, className }: PanelContainerProps) {
  return (
    <div className={`relative h-full ${className ?? ""}`}>
      {/* Left panel */}
      <div
        aria-hidden={!leftOpen}
        className={`pointer-events-none absolute inset-y-0 left-0 w-[320px] max-w-[80vw] transition-transform duration-300 will-change-transform ${
          leftOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-auto h-full rounded-r-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
          {left}
        </div>
      </div>

      {/* Right panel */}
      <div
        aria-hidden={!rightOpen}
        className={`pointer-events-none absolute inset-y-0 right-0 w-[360px] max-w-[85vw] transition-transform duration-300 will-change-transform ${
          rightOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pointer-events-auto h-full rounded-l-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
          {right}
        </div>
      </div>

      {/* Center content with subtle scale when side panels are open */}
      <div
        className={`h-full transition-all duration-300 ${
          leftOpen || rightOpen ? "scale-[0.985] opacity-95" : "scale-100 opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
