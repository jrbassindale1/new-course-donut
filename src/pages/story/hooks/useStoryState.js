import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getHashContext() {
  if (typeof window === "undefined") {
    return { path: "", params: new URLSearchParams() };
  }
  const hash = window.location.hash || "";
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path = "", search = ""] = withoutHash.split("?");
  return {
    path,
    params: new URLSearchParams(search),
  };
}

function updateHash(index) {
  if (typeof window === "undefined") return;
  const { path, params } = getHashContext();
  params.set("scene", String(index));
  const query = params.toString();
  const nextHash = `#${path}${query ? `?${query}` : ""}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function getInitialIndex(total) {
  if (typeof window === "undefined") return 0;
  const { params } = getHashContext();
  const value = params.get("scene");
  if (value == null) return 0;
  const idx = Number.parseInt(value, 10);
  if (Number.isNaN(idx)) return 0;
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, idx));
}

function useShareMode() {
  if (typeof window === "undefined") {
    return false;
  }
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("share") === "1") {
    return true;
  }
  const { params } = getHashContext();
  return params.get("share") === "1";
}

export function useStoryState(scenes) {
  const total = Array.isArray(scenes) ? scenes.length : 0;
  const [index, setIndex] = useState(() => getInitialIndex(total));
  const [bridgeActive, setBridgeActive] = useState(false);
  const bridgeTimerRef = useRef(null);
  const isShareMode = useShareMode();

  const scene = total > 0 ? scenes[Math.max(0, Math.min(index, total - 1))] : null;

  const clearBridgeTimer = useCallback(() => {
    if (bridgeTimerRef.current && typeof window !== "undefined") {
      window.clearTimeout(bridgeTimerRef.current);
      bridgeTimerRef.current = null;
    }
  }, []);

  const scheduleBridge = useCallback(
    (currentIndex, nextIndex) => {
      if (nextIndex < 0 || nextIndex >= total) {
        clearBridgeTimer();
        setBridgeActive(false);
        return;
      }

      const currentId = scenes?.[currentIndex]?.id;
      const nextId = scenes?.[nextIndex]?.id;
      const shouldBridge = currentId === "video" && nextId === "leaders";

      clearBridgeTimer();

      if (shouldBridge && typeof window !== "undefined") {
        setBridgeActive(true);
        bridgeTimerRef.current = window.setTimeout(() => {
          setBridgeActive(false);
          bridgeTimerRef.current = null;
        }, 600);
      } else {
        setBridgeActive(false);
      }
    },
    [clearBridgeTimer, scenes, total],
  );

  const goToIndex = useCallback(
    (updater) => {
      setIndex((current) => {
        const nextProposed = typeof updater === "function" ? updater(current) : updater;
        const bounded = Math.max(0, Math.min(total - 1, nextProposed));
        if (bounded !== current) {
          scheduleBridge(current, bounded);
        }
        return bounded;
      });
    },
    [scheduleBridge, total],
  );

  const handleNext = useCallback(() => {
    goToIndex((current) => Math.min(total - 1, current + 1));
  }, [goToIndex, total]);

  const handlePrev = useCallback(() => {
    goToIndex((current) => Math.max(0, current - 1));
  }, [goToIndex]);

  const handleSelect = useCallback((idx) => {
    if (!Number.isInteger(idx)) return;
    goToIndex(idx);
  }, [goToIndex]);

  useEffect(() => () => {
    clearBridgeTimer();
  }, [clearBridgeTimer]);

  useEffect(() => {
    if (!scene) return;
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      updateHash(index);
    }
  }, [index, scene]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const listener = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowRight" || event.key === "n" || event.key === "N") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft" || event.key === "b" || event.key === "B") {
        event.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleNext, handlePrev]);

  const progressDots = useMemo(() => {
    if (!Array.isArray(scenes)) return [];
    return scenes.map((item, idx) => ({
      id: item?.id || `scene-${idx}`,
      label: item?.label || item?.title || `Scene ${idx + 1}`,
      active: idx === index,
    }));
  }, [index, scenes]);

  return {
    bridgeActive,
    canGoBack: index > 0,
    canGoForward: index < total - 1,
    handleNext,
    handlePrev,
    handleSelect,
    index,
    isShareMode,
    progressDots,
    scene,
    total,
  };
}
