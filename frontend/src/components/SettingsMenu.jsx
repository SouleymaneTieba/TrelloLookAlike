import {
  ChevronDown,
  Moon,
  Palette,
  Sun,
  UserRound,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


function SettingsMenu() {

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );


  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);


  const goToProfile = () => {
    setOpen(false);
    navigate("/profile");
  };


  const toggleTheme = () => {
    setTheme((currentTheme) => (
      currentTheme === "dark" ? "light" : "dark"
    ));
  };


  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Palette size={20} />
        Paramètres
        <ChevronDown
          size={16}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-[#26363A] bg-[#10191C] p-1.5 shadow-2xl"
          role="menu"
        >
          <button
            type="button"
            onClick={goToProfile}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#DDE7E1] transition hover:bg-[#1B292D]"
            role="menuitem"
          >
            <UserRound size={17} className="text-[#B6FF00]" />
            Profil
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#DDE7E1] transition hover:bg-[#1B292D]"
            role="menuitem"
          >
            {theme === "dark" ? (
              <Sun size={17} className="text-[#B6FF00]" />
            ) : (
              <Moon size={17} className="text-[#B6FF00]" />
            )}
            Thème : {theme === "dark" ? "Sombre" : "Clair"}
          </button>
        </div>
      )}
    </div>
  );
}


export default SettingsMenu;