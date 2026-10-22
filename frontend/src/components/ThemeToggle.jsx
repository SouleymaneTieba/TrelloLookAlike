import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="theme-toggle rounded-xl p-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      title={`Passer au thème ${nextTheme === "light" ? "orange et blanc" : "sombre"}`}
      aria-label={`Passer au thème ${nextTheme === "light" ? "orange et blanc" : "sombre"}`}
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
    </button>
  );
}

export default ThemeToggle;
