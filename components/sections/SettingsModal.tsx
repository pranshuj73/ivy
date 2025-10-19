"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useSettings, ThemeMode, Density } from "@/components/providers/SettingsProvider"
import { AnimatePresence, motion } from "framer-motion"
import { Settings, Sun, Moon, Monitor, SlidersHorizontal, User } from "lucide-react"

export function SettingsTrigger() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button aria-label="Settings" variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Settings />
      </Button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, density, animations, setTheme, setDensity, setAnimations } = useSettings()

  function ThemeButton({ value, icon: Icon, label }: { value: ThemeMode; icon: React.ComponentType<any>; label: string }) {
    const active = theme === value
    return (
      <Button variant={active ? "default" : "outline"} onClick={() => setTheme(value)} className="gap-2">
        <Icon className="size-4" /> {label}
      </Button>
    )
  }

  function DensityButton({ value, label }: { value: Density; label: string }) {
    const active = density === value
    return (
      <Button variant={active ? "default" : "outline"} onClick={() => setDensity(value)}>
        {label}
      </Button>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Settings className="size-4" /> Settings
            </div>

            <div className="space-y-4">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme</h3>
                <div className="flex flex-wrap gap-2">
                  <ThemeButton value="system" icon={Monitor} label="System" />
                  <ThemeButton value="light" icon={Sun} label="Light" />
                  <ThemeButton value="dark" icon={Moon} label="Dark" />
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task density</h3>
                <div className="flex flex-wrap gap-2">
                  <DensityButton value="comfortable" label="Comfortable" />
                  <DensityButton value="compact" label="Compact" />
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Animations</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={animations ? "default" : "outline"}
                    onClick={() => setAnimations(true)}
                    className="gap-2"
                  >
                    <SlidersHorizontal className="size-4" /> On
                  </Button>
                  <Button
                    variant={!animations ? "default" : "outline"}
                    onClick={() => setAnimations(false)}
                  >
                    Off
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled className="gap-2">
                    <User className="size-4" /> Login (coming soon)
                  </Button>
                  <Button variant="outline" disabled>Sync (coming soon)</Button>
                </div>
              </section>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={onClose}>Close</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
