import { useCallback, useEffect, useRef, useState } from "react";
import CarouselPage from "./pages/CarouselPage.jsx";
import FrontagePage from "./pages/FrontagePage.jsx";
import HomePage from "./pages/HomePage.jsx";
import StoryPage from "./pages/StoryPage.jsx";
import { setAnalyticsContext, trackEvent, trackPageView, trackTiming } from "./lib/analytics.js";

const VIEW_FRONT = "front";
const VIEW_CHART = "chart";
const VIEW_GALLERY = "gallery";
const VIEW_STORY = "story";

const hashToView = (hash) => {
  const cleanHash = hash.split("?")[0];
  switch (cleanHash) {
    case "#/gallery":
      return VIEW_GALLERY;
    case "#/story":
      return VIEW_STORY;
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
    case VIEW_STORY:
      return "#/story";
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
  const viewTimerRef = useRef({ view: null, startedAt: 0 });
  const lastViewRef = useRef(null);

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
      trackEvent("navigate_request", {
        target_view: nextView,
        from_view: view,
        mode: "ssr",
      });
      setView(nextView);
      return;
    }
    trackEvent("navigate_request", {
      target_view: nextView,
      from_view: view,
      mode: "client",
    });
    const targetHash = viewToHash(nextView);
    if (window.location.hash === targetHash) {
      setView(nextView);
      return;
    }
    window.location.hash = targetHash;
  }, [view]);

  const flushViewDuration = useCallback((reason) => {
    if (typeof window === "undefined") return;
    const { view: currentView, startedAt } = viewTimerRef.current;
    if (!currentView || !startedAt) return;
    const timestamp = typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
    const duration = timestamp - startedAt;
    if (duration <= 0) return;
    trackTiming("view_duration", duration, {
      view_name: currentView,
      reason,
    });
    viewTimerRef.current = { view: null, startedAt: 0 };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const viewLabels = {
      [VIEW_FRONT]: "Frontage",
      [VIEW_CHART]: "Programme Overview",
      [VIEW_GALLERY]: "Image Carousel",
      [VIEW_STORY]: "Course Story",
    };

    const now = typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

    viewTimerRef.current = { view, startedAt: now };

    const pageTitle = viewLabels[view] || "Architecture";
    const hashPath = window.location.hash || "#/";
    trackPageView({
      name: view,
      title: pageTitle,
      path: hashPath,
      location: window.location.href,
    });
    setAnalyticsContext({ app_view: view, page_title: pageTitle });
    trackEvent("view_change", {
      view_name: view,
      previous_view: lastViewRef.current,
      hash: hashPath,
    });
    lastViewRef.current = view;

    return () => {
      flushViewDuration("navigation");
    };
  }, [flushViewDuration, view]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleBeforeUnload = () => {
      flushViewDuration("before_unload");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flushViewDuration]);

  if (view === VIEW_GALLERY) {
    return <CarouselPage onNavigate={navigate} />;
  }

  if (view === VIEW_STORY) {
    return <StoryPage onNavigate={navigate} />;
  }

  if (view === VIEW_CHART) {
    return <HomePage onNavigate={navigate} />;
  }

  return <FrontagePage onNavigate={navigate} />;
}
