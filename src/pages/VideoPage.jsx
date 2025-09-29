import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIDEO_ID = "PP802_dLKC4";
const RATIO = 16 / 9;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }
  if (window._ytApiPromise) {
    return window._ytApiPromise;
  }
  window._ytApiPromise = new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => reject(new Error("Failed to load YouTube API"));

    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") {
        try {
          previous();
        } catch {
          // ignore failures from earlier hooks
        }
      }
      resolve(window.YT);
    };
  });
  return window._ytApiPromise;
}

function computeVideoBox() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }
  const vw = window.innerWidth * 0.9;
  const vh = window.innerHeight * 0.9;
  let width = vw;
  let height = width / RATIO;

  if (height > vh) {
    height = vh;
    width = height * RATIO;
  }

  return { width, height };
}

export default function VideoPage({ onNavigate }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [box, setBox] = useState(() => computeVideoBox());
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window === "undefined") return true;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setBox(computeVideoBox());
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        playerRef.current = new YT.Player(containerRef.current, {
          videoId: VIDEO_ID,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            playsinline: 1,
            showinfo: 0,
          },
          events: {
            onReady: () => {
              if (!cancelled) {
                setIsReady(true);
              }
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (hasEntered) return undefined;
    if (typeof window === "undefined") {
      setHasEntered(true);
      return undefined;
    }
    const id = window.setTimeout(() => {
      setHasEntered(true);
    }, 20);
    return () => window.clearTimeout(id);
  }, [hasEntered]);

  const handlePlay = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  }, []);

  const handleStop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
  }, []);

  const handleNavigateForward = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (onNavigate) {
        onNavigate("story");
      }
    },
    [onNavigate]
  );

  const statusLabel = useMemo(() => {
    if (error) return "Video failed to load";
    if (!isReady) return "Loading video";
    return null;
  }, [error, isReady]);

  return (
    <div
      className={`video-page${hasEntered ? " video-page-enter" : ""}`}
      style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, #fde68a 0%, #fbbf24 55%, #f59e0b 100%)",
        color: "#0f172a",
        position: "relative",
        overflow: "hidden",
        padding: "5vh 5vw",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: box.width ? `${box.width}px` : "90vw",
          height: box.height ? `${box.height}px` : "min(90vh, 50vw)",
          maxWidth: "100%",
          maxHeight: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.3)",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          }}
        aria-label="Programme introduction video"
      >
        <div
          ref={containerRef}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          marginTop: "24px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={handlePlay}
          disabled={!isReady || !!error}
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            color: "#0f172a",
            border: "1px solid rgba(15, 23, 42, 0.18)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
            backdropFilter: "blur(4px)",
            fontWeight: 600,
          }}
        >
          Play
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={handleStop}
          disabled={!isReady || !!error}
          style={{
            background: "rgba(255, 255, 255, 0.72)",
            color: "#0f172a",
            border: "1px solid rgba(15, 23, 42, 0.18)",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",
            backdropFilter: "blur(4px)",
            fontWeight: 600,
          }}
        >
          Stop
        </button>
        {statusLabel && (
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "rgba(15,23,42,0.65)" }}>
            {statusLabel}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleNavigateForward}
        className="btn"
        style={{
          position: "absolute",
          right: "32px",
          bottom: "32px",
          borderRadius: "999px",
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          background: "rgba(255, 255, 255, 0.9)",
          color: "#0f172a",
          border: "1px solid rgba(15, 23, 42, 0.18)",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.2)",
          backdropFilter: "blur(8px)",
        }}
        aria-label="Explore the 7-scene story"
      >
        &gt;
      </button>

      <button
        type="button"
        onClick={() => onNavigate && onNavigate("chart")}
        className="link"
        style={{
          position: "absolute",
          right: "32px",
          bottom: "112px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "11px",
          color: "rgba(15,23,42,0.72)",
        }}
      >
        Skip to chart
      </button>
    </div>
  );
}
