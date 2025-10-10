import { useCallback, useEffect, useRef } from "react";
import SceneRenderer from "./SceneRenderer.jsx";
import StoryTopBar from "./components/StoryTopBar.jsx";
import { useStoryState } from "./hooks/useStoryState.js";
import storyScenes from "../../data/storyScenes.json";
import uweLogo from "../../assets/uwe-bristol-logo.jpg";
import "./storyPage.css";
import { setAnalyticsContext, trackEvent, trackTiming } from "../../lib/analytics.js";

const SCENES = Array.isArray(storyScenes?.scenes) ? storyScenes.scenes : [];

export default function StoryPage() {
  const {
    bridgeActive,
    canGoBack,
    canGoForward,
    handleNext: baseHandleNext,
    handlePrev: baseHandlePrev,
    handleSelect: baseHandleSelect,
    isShareMode,
    progressDots,
    scene,
    index,
    total,
  } = useStoryState(SCENES);
  const sceneTimerRef = useRef({ sceneId: null, startedAt: 0, index: null });
  const stageRef = useRef(null);

  const flushSceneDuration = useCallback((reason) => {
    if (typeof window === "undefined") return;
    const { sceneId, startedAt, index: previousIndex } = sceneTimerRef.current;
    if (!sceneId || !startedAt) return;
    const timestamp = typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
    const duration = timestamp - startedAt;
    if (duration <= 0) return;
    trackTiming("story_scene_duration", duration, {
      scene_id: sceneId,
      scene_index: previousIndex,
      reason,
    });
    sceneTimerRef.current = { sceneId: null, startedAt: 0, index: null };
  }, []);

  useEffect(() => {
    if (!scene) return undefined;
    const sceneId = scene?.id || `scene-${index}`;
    const timestamp = typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

    sceneTimerRef.current = { sceneId, startedAt: timestamp, index };
    setAnalyticsContext({ story_scene: sceneId, story_scene_index: index });
    trackEvent("story_scene_view", {
      scene_id: sceneId,
      scene_index: index,
      scene_label: scene.label || scene.title,
      total_scenes: total,
    });

    return () => {
      flushSceneDuration("scene_navigation");
    };
  }, [flushSceneDuration, index, scene, total]);

  useEffect(() => {
    return () => {
      flushSceneDuration("story_unmount");
    };
  }, [flushSceneDuration]);

  const handleNext = useCallback(() => {
    const sceneId = scene?.id || `scene-${index}`;
    trackEvent("story_navigate", {
      action: "next",
      from_scene: sceneId,
      from_index: index,
      total_scenes: total,
    });
    baseHandleNext();
  }, [baseHandleNext, index, scene, total]);

  const handlePrev = useCallback(() => {
    const sceneId = scene?.id || `scene-${index}`;
    trackEvent("story_navigate", {
      action: "previous",
      from_scene: sceneId,
      from_index: index,
      total_scenes: total,
    });
    baseHandlePrev();
  }, [baseHandlePrev, index, scene, total]);

  const handleSelect = useCallback((targetIndex) => {
    const sceneId = scene?.id || `scene-${index}`;
    trackEvent("story_select", {
      target_index: targetIndex,
      from_scene: sceneId,
      from_index: index,
      total_scenes: total,
    });
    baseHandleSelect(targetIndex);
  }, [baseHandleSelect, index, scene, total]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const stageEl = stageRef.current;
    if (!stageEl) return undefined;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartedAt = 0;

    const resetGesture = () => {
      touchStartX = 0;
      touchStartY = 0;
      touchStartedAt = 0;
    };

    const handleTouchStart = (event) => {
      if (event.touches?.length !== 1) return;
      resetGesture();
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartedAt = Date.now();
    };

    const handleTouchEnd = (event) => {
      if (!touchStartedAt) return;
      const gestureStartedAt = touchStartedAt;
      const startX = touchStartX;
      const startY = touchStartY;
      const touch = event.changedTouches?.[0];
      resetGesture();
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      const elapsed = Date.now() - gestureStartedAt;

      const horizontalDistance = Math.abs(deltaX);
      const SWIPE_DISTANCE = 60;
      const SWIPE_VERTICAL_LIMIT = 80;
      const SWIPE_TIME_LIMIT = 600;

      if (horizontalDistance < SWIPE_DISTANCE) return;
      if (deltaY > SWIPE_VERTICAL_LIMIT) return;
      if (elapsed > SWIPE_TIME_LIMIT) return;

      if (deltaX < 0 && canGoForward) {
        handleNext();
      } else if (deltaX > 0 && canGoBack) {
        handlePrev();
      }
    };

    const handleTouchCancel = () => {
      resetGesture();
    };

    stageEl.addEventListener("touchstart", handleTouchStart, { passive: true });
    stageEl.addEventListener("touchend", handleTouchEnd);
    stageEl.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      stageEl.removeEventListener("touchstart", handleTouchStart);
      stageEl.removeEventListener("touchend", handleTouchEnd);
      stageEl.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [canGoBack, canGoForward, handleNext, handlePrev]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const stageEl = stageRef.current;
    if (!stageEl) return undefined;

    const scrollToTop = () => {
      if (typeof stageEl.scrollTo === "function") {
        stageEl.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } else {
        stageEl.scrollTop = 0;
      }
    };

    const isMobileViewport = typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 900px)").matches
      : window.innerWidth <= 900;
    if (!isMobileViewport) {
      // Ensure the desktop view also resets when scenes change, even though it normally doesn't scroll.
      scrollToTop();
      return undefined;
    }

    const rafId = window.requestAnimationFrame(scrollToTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [index]);

  if (!scene) {
    return (
      <div className="story-page">
        <div className="story-stage">
          <p>Scene data missing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`story-page${isShareMode ? " story-page--share" : ""}`}>
      <StoryTopBar
        brand={{ logo: uweLogo, label: "BSc (Hons) Architecture" }}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handlePrev}
        onNext={handleNext}
        onSelect={handleSelect}
        progressDots={progressDots}
      />

      <div
        className={`story-stage${bridgeActive ? " bridge-active" : ""}`}
        role="group"
        aria-roledescription="Slide"
        aria-label={scene.label}
        ref={stageRef}
      >
        <div
          key={scene?.id ?? index}
          className="story-stage__slide"
        >
          <SceneRenderer scene={scene} />
        </div>
      </div>
    </div>
  );
}
