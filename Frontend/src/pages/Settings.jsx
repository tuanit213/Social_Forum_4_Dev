import { Bell, Check, Lock, Palette, Shield, Type, User, Zap } from "lucide-react";
import { themes } from "@/contexts/themeOptions";
import { useTheme } from "@/contexts/useTheme";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Privacy", icon: Lock },
  { id: "plan", label: "Pro Plan", icon: Zap },
];

function ThemePreview({ colors }) {
  return (
    <div
      className="h-16 rounded-md border p-2"
      style={{
        backgroundColor: colors.primary,
        borderColor: colors.border,
      }}
    >
      <div className="mb-2 h-2 w-24 rounded-full opacity-80" style={{ backgroundColor: colors.elevated }} />
      <div className="mb-4 h-2 w-36 rounded-full opacity-80" style={{ backgroundColor: colors.border }} />
      <div className="h-2 w-16 rounded-full" style={{ backgroundColor: colors.accent }} />
    </div>
  );
}

function ThemeCard({ themeItem, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-lg border p-3 text-left transition-all ${
        isActive
          ? "border-[var(--accent)] bg-[var(--bg-elevated)]"
          : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]"
      }`}
    >
      <ThemePreview colors={themeItem.colors} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] font-medium text-[var(--text-primary)]">{themeItem.name}</span>
        {isActive && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
            <Check size={13} />
          </span>
        )}
      </div>
    </button>
  );
}

export default function Settings() {
  const { theme, setTheme, editorFont, setEditorFont } = useTheme();

  return (
    <div className="w-full">
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 px-4 py-3 backdrop-blur-md">
        <h2 className="font-sans text-xl font-bold text-[var(--text-primary)]">Settings</h2>
        <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">Configuration / User Preferences</p>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === "appearance";

            return (
              <button
                key={section.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-mono text-[13px] transition-colors ${
                  isActive
                    ? "border border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={15} />
                {section.label}
              </button>
            );
          })}
        </aside>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="mb-5 flex items-center gap-2">
            <Shield size={16} className="text-[var(--accent)]" />
            <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Color Theme
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((themeItem) => (
              <ThemeCard
                key={themeItem.id}
                themeItem={themeItem}
                isActive={theme === themeItem.id}
                onSelect={() => setTheme(themeItem.id)}
              />
            ))}
          </div>

          <div className="mt-7 border-t border-[var(--border)] pt-5">
            <div className="mb-4 flex items-center gap-2">
              <Type size={16} className="text-[var(--accent)]" />
              <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Font Settings
              </h3>
            </div>

            <label className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-4 sm:grid-cols-[1fr_180px] sm:items-center">
              <span>
                <span className="block font-mono text-sm font-semibold text-[var(--text-primary)]">Editor Font</span>
                <span className="mt-1 block font-mono text-xs text-[var(--text-secondary)]">
                  Choose your preferred monospace font
                </span>
              </span>
              <input
                value={editorFont}
                onChange={(event) => setEditorFont(event.target.value)}
                placeholder="Consolas"
                className="h-9 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 font-mono text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
