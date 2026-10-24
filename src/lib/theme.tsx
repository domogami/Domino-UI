import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Hybrid keeps paper surfaces light and the surrounding notebook frame dark. */
export type Theme = "hybrid" | "light" | "dark";
export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const isTheme = (value: unknown): value is Theme =>
  value === "hybrid" || value === "light" || value === "dark";

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/** Persists an explicit preference; unavailable browser storage never prevents rendering. */
export function ThemeProvider({
  children,
  defaultTheme = "hybrid",
  storageKey = "domino-theme",
}: ThemeProviderProps) {
  const fallbackTheme = isTheme(defaultTheme) ? defaultTheme : "hybrid";
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return fallbackTheme;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return isTheme(saved) ? saved : fallbackTheme;
    } catch {
      return fallbackTheme;
    }
  });
  useEffect(() => {
    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch {
      return;
    }
    const synchronize = (event: StorageEvent) => {
      if (
        (event.storageArea && event.storageArea !== storage) ||
        (event.key !== storageKey && event.key !== null)
      )
        return;
      setTheme(isTheme(event.newValue) ? event.newValue : fallbackTheme);
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, [fallbackTheme, storageKey]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "dark" ? "dark" : "light";
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      /* Private browsing may disable storage. */
    }
  }, [theme, storageKey]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme must be used within a ThemeProvider.");
  return context;
}

export interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}
export function ThemeToggle({
  className = "",
  compact = false,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: string; label: string }[] = [
    { value: "light", icon: "☀", label: "Light" },
    { value: "hybrid", icon: "◐", label: "Hybrid" },
    { value: "dark", icon: "☾", label: "Dark" },
  ];
  return (
    <div
      className={`dm-theme-toggle ${compact ? "dm-theme-toggle--compact" : ""} ${className}`}
      role="group"
      aria-label="Color theme"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          aria-label={`${option.label} theme`}
          title={`${option.label} theme`}
          onClick={() => setTheme(option.value)}
        >
          <span aria-hidden="true">{option.icon}</span>
          {!compact && <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}
