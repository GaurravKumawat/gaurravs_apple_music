import {
  Bell,
  Cog,
  CreditCard,
  HelpCircle,
  LogOut,
  Moon,
  Music,
  Palette,
  Shield,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, m, useDragControls, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { useTheme } from "@/lib/theme";
import {
  appleEase,
  springPlayer,
  springSnappy,
  staggerContainer,
  tapScale,
  tapScaleSoft,
} from "@/lib/motion";

type ProfileMenuProps = {
  open: boolean;
  onClose: () => void;
};

type Row = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  destructive?: boolean;
  onClick?: () => void;
};

export function ProfileMenu({ open, onClose }: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();

  // Drag-to-dismiss — same gesture language as the full-screen player.
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  // Scrim fades as the sheet is pulled down.
  const scrimOpacity = useTransform(dragY, [0, 320], [1, 0]);
  // Sheet rounds its bottom corners more aggressively as it leaves the top.
  const bottomRadius = useTransform(dragY, [0, 200], [36, 12]);

  // Close on Escape — standard menu affordance.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isApple = theme === "apple-music";

  const themeRow: Row = {
    key: "theme",
    label: "Theme Settings",
    icon: Palette,
    trailing: (
      <span
        role="switch"
        aria-checked={!isApple}
        aria-label="Toggle theme"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isApple ? "bg-white/15" : "bg-primary"
        }`}
      >
        <m.span
          layout
          transition={springSnappy}
          className={`inline-block h-5 w-5 rounded-full bg-white shadow ${
            isApple ? "translate-x-0.5" : "translate-x-[22px]"
          }`}
        />
      </span>
    ),
    onClick: () => setTheme(isApple ? "youtube-music" : "apple-music"),
  };

  const general: Row[] = [
    { key: "account", label: "Account", icon: User },
    { key: "billing", label: "Subscription", icon: CreditCard },
    themeRow,
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  const preferences: Row[] = [
    { key: "playback", label: "Playback", icon: Music },
    { key: "appearance", label: "Appearance", icon: Moon },
    { key: "privacy", label: "Privacy & Security", icon: Shield },
  ];

  const support: Row[] = [
    { key: "help", label: "Help Center", icon: HelpCircle },
    { key: "settings", label: "Settings", icon: Cog },
    { key: "signout", label: "Sign Out", icon: LogOut, destructive: true },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim — dimmed background, fades with drag. */}
          <m.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: appleEase } }}
            transition={{ duration: 0.28, ease: appleEase }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/55 gpu-layer"
            style={{ opacity: scrimOpacity }}
          />

          {/* Top-anchored sheet — slides from above the screen, fills the viewport. */}
          <m.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="User menu"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{
              y: "-100%",
              transition: { type: "spring", stiffness: 360, damping: 38, mass: 0.9 },
            }}
            transition={springPlayer}
            drag="y"
            dragControls={dragControls}
            dragListener
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.02, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -120 || info.velocity.y < -500) onClose();
            }}
            style={{ y: dragY, touchAction: "pan-y" }}
            className="fixed inset-0 z-50 flex flex-col text-foreground overflow-hidden gpu-layer"
          >
            {/* Translucent frosted surface — the whole sheet. */}
            <m.div
              style={{
                borderBottomLeftRadius: bottomRadius,
                borderBottomRightRadius: bottomRadius,
              }}
              className="absolute inset-0 border-b border-white/15 shadow-2xl"
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(255, 255, 255, 0.10)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                }}
              />
              {/* Subtle top highlight so the sheet reads as glass, not flat. */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                }}
              />
            </m.div>

            {/* Drag handle (visual only — the whole sheet is the drag target). */}
            <div
              className="relative flex flex-col items-center pt-2.5 pb-1 touch-none select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1.5 w-10 rounded-full bg-white/30" />
            </div>

            {/* Top bar: large title + close button. */}
            <div className="relative px-4 pt-2 pb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] uppercase tracking-[0.16em] text-white/55 font-semibold">
                  Account
                </div>
                <h1 className="text-[28px] font-bold tracking-tight text-white">Profile</h1>
              </div>
              <m.button
                whileTap={tapScale}
                transition={springSnappy}
                onClick={onClose}
                aria-label="Close profile menu"
                className="h-9 w-9 grid place-items-center rounded-full bg-white/10 active:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </m.button>
            </div>

            {/* Profile card. */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { ...springSnappy, delay: 0.05 } }}
              className="relative mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3.5"
            >
              <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center text-[14px] font-semibold text-foreground/90 ring-1 ring-white/15">
                GK
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold truncate text-white">Gaurrav Kumawat</div>
                <div className="text-[12px] text-white/65 truncate">
                  gaurrav@applemusic.app
                </div>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/75 px-2 py-1 rounded-full bg-white/12">
                {isApple ? "Apple Music" : "YouTube Music"}
              </span>
            </m.div>

            {/* Scrollable sections. */}
            <m.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="relative flex-1 overflow-y-auto px-4 pb-8"
            >
              <Section title="General" rows={general} onClose={onClose} />
              <Section title="Preferences" rows={preferences} onClose={onClose} />
              <Section title="Support" rows={support} onClose={onClose} last />

              <div className="mt-6 text-[11px] text-white/45 text-center">
                Music Web Player · v1.0
              </div>
            </m.div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  rows,
  onClose,
  last,
}: {
  title: string;
  rows: Row[];
  onClose: () => void;
  last?: boolean;
}) {
  return (
    <m.section
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: springSnappy },
      }}
      className={`mb-3 rounded-2xl border border-white/10 bg-white/5 overflow-hidden ${
        last ? "" : ""
      }`}
    >
      <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.14em] text-white/45 font-semibold">
        {title}
      </div>
      <ul className="px-1 pb-2">
        {rows.map((row) => (
          <RowItem key={row.key} row={row} onClose={onClose} />
        ))}
      </ul>
    </m.section>
  );
}

function RowItem({ row, onClose }: { row: Row; onClose: () => void }) {
  const Icon = row.icon;
  return (
    <li>
      <m.button
        role="menuitem"
        whileTap={tapScale}
        transition={springSnappy}
        onClick={() => {
          row.onClick?.();
          // Settings-style rows close the menu; theme row stays open so the
          // user can see the toggle react instantly.
          if (row.key !== "theme") onClose();
        }}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-white/10 ${
          row.destructive ? "text-red-300" : "text-white"
        }`}
      >
        <span
          className={`grid place-items-center h-8 w-8 rounded-lg ${
            row.destructive ? "bg-red-500/15" : "bg-white/10"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-[15px] font-medium truncate">{row.label}</span>
        {row.trailing}
      </m.button>
    </li>
  );
}
