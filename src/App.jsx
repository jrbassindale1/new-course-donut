import { useCallback, useEffect, useState } from "react";
import CarouselPage from "./pages/CarouselPage.jsx";
import FrontagePage from "./pages/FrontagePage.jsx";
import HomePage from "./pages/HomePage.jsx";

const VIEW_FRONT = "front";
const VIEW_CHART = "chart";
const VIEW_GALLERY = "gallery";

const hashToView = (hash) => {
  switch (hash) {
    case "#/gallery":
      return VIEW_GALLERY;
    case "#/chart":
    case "#/home":
      return VIEW_CHART;
    default:
      return VIEW_FRONT;
  }
};

const viewToHash = (view) => {
  switch (view) {
    case VIEW_GALLERY:
      return "#/gallery";
    case VIEW_CHART:
      return "#/chart";
    default:
      return "#/";
  }
};

export default function App() {
  const [view, setView] = useState(() => {
    if (typeof window === "undefined") return VIEW_FRONT;
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

  if (view === VIEW_CHART) {
    return <HomePage onNavigate={navigate} />;
  }

  return <FrontagePage onNavigate={navigate} />;
}
