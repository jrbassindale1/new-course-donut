import { useCallback, useEffect, useState } from "react";
import CarouselPage from "./pages/CarouselPage.jsx";
import HomePage from "./pages/HomePage.jsx";

const VIEW_HOME = "home";
const VIEW_GALLERY = "gallery";

const hashToView = (hash) => (hash === "#/gallery" ? VIEW_GALLERY : VIEW_HOME);

const viewToHash = (view) => {
  if (view === VIEW_GALLERY) return "#/gallery";
  return "#/";
};

export default function App() {
  const [view, setView] = useState(() => {
    if (typeof window === "undefined") return VIEW_HOME;
    return hashToView(window.location.hash);
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleHashChange = () => {
      setView(hashToView(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = useCallback((nextView) => {
    if (typeof window === "undefined") {
      setView(nextView);
      return;
    }
    const targetHash = viewToHash(nextView);
    if (window.location.hash === targetHash) {
      setView(nextView);
      return;
    }
    window.location.hash = targetHash;
  }, []);

  if (view === VIEW_GALLERY) {
    return <CarouselPage onNavigate={navigate} />;
  }

  return <HomePage onNavigate={navigate} />;
}
