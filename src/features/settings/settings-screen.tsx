"use client";

import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useApp } from "@/features/auth/app-provider";

export function SettingsScreen() {
  const app = useApp();
  const { store } = app;

  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const rows = [["date", "routine", "exercise", "set", "weight", "unit", "reps", "rir", "completed_at"]];
    store.sessions.forEach((session) =>
      session.exercises.forEach((exercise) =>
        exercise.sets.forEach((set) => {
          rows.push([
            session.startedAt,
            session.routineNameSnapshot,
            exercise.exerciseNameSnapshot,
            String(set.setNumber),
            String(set.weight ?? ""),
            session.unit,
            String(set.reps ?? ""),
            String(set.rir ?? ""),
            set.completedAt ?? "",
          ]);
        }),
      ),
    );
    download("ironlog-workouts.csv", rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv");
  }

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-up">
        <header>
          <p className="text-sm text-muted">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Preferences and data</h1>
        </header>
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Workout preferences</CardTitle>
              <CardDescription>These defaults are used by the live workout screen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow label="Units">
                <div className="flex gap-2">
                  {["kg", "lb"].map((unit) => (
                    <Button key={unit} variant={store.settings.unit === unit ? "default" : "secondary"} onClick={() => app.updateSettings({ unit: unit as "kg" | "lb" })}>
                      {unit.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </SettingRow>
              <SettingRow label="Default rest duration">
                <Input
                  className="max-w-32 text-center"
                  type="number"
                  min={15}
                  step={15}
                  value={store.settings.defaultRestSeconds}
                  onChange={(event) => app.updateSettings({ defaultRestSeconds: Number(event.target.value) })}
                />
              </SettingRow>
              <Toggle label="Automatic rest timer" checked={store.settings.autoStartRestTimer} onChange={(checked) => app.updateSettings({ autoStartRestTimer: checked })} />
              <Toggle label="Sound notifications" checked={store.settings.soundEnabled} onChange={(checked) => app.updateSettings({ soundEnabled: checked })} />
              <Toggle label="Vibration notifications" checked={store.settings.vibrationEnabled} onChange={(checked) => app.updateSettings({ vibrationEnabled: checked })} />
              <SettingRow label="Week start day">
                <select
                  className="min-h-11 rounded-2xl border border-border bg-black/25 px-3"
                  value={store.settings.weekStartDay}
                  onChange={(event) => app.updateSettings({ weekStartDay: Number(event.target.value) })}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </select>
              </SettingRow>
              <SettingRow label="Theme">
                <select className="min-h-11 rounded-2xl border border-border bg-black/25 px-3" value={store.settings.theme} onChange={(event) => app.updateSettings({ theme: event.target.value as "system" | "dark" })}>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data and account</CardTitle>
              <CardDescription>Export workout history or clear the local demo workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="secondary" onClick={() => download("ironlog-export.json", app.exportJson(), "application/json")}>
                <Download className="size-4" />
                Export JSON
              </Button>
              <Button className="w-full justify-start" variant="secondary" onClick={exportCsv}>
                <Download className="size-4" />
                Export CSV
              </Button>
              <Button
                className="w-full justify-start"
                variant="danger"
                onClick={() => {
                  if (window.confirm("Delete local account data for this workspace?")) {
                    app.resetDemoData();
                    toast.success("Local data reset");
                  }
                }}
              >
                <Trash2 className="size-4" />
                Delete local account data
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-white/5 p-3">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <SettingRow label={label}>
      <button
        type="button"
        aria-pressed={checked}
        className={`h-8 w-14 rounded-full p-1 transition ${checked ? "bg-accent" : "bg-white/15"}`}
        onClick={() => onChange(!checked)}
      >
        <span className={`block size-6 rounded-full bg-background transition ${checked ? "translate-x-6" : ""}`} />
      </button>
    </SettingRow>
  );
}
