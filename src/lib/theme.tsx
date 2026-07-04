import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "apple-music" | "youtube-music";

const KEY = "music-theme-v1";
const Ctx = createContext<ThemeApi | null>(null);

export type ThemeApi = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

function load(): Theme {
  if (typeof window === "undefined") return "apple-music";
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "apple-music" || raw === "youtube-music") return raw;
  } catch {
    /* ignore */
  }
  return "apple-music";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("apple-music");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount so SSR/build doesn't read storage.
  useEffect(() => {
    setThemeState(load());
    setHydrated(true);
  }, []);

  // Reflect the theme on <html> so any CSS / Tailwind dark variants can react.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "youtube-music");
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore quota / private mode */
    }
  }, [theme, hydrated]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "apple-music" ? "youtube-music" : "apple-music")),
    [],
  );

  return (
    <Ctx.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
