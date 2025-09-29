import { useCallback, useEffect, useRef, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";

let ytApiPromise;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube API"));
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") {
        try {
          previous();
        } catch {
          // ignore errors from previous handlers
        }
      }
      resolve(window.YT);
    };
  });
  return ytApiPromise;
}

export default function VideoScene({ scene }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        playerRef.current = new YT.Player(containerRef.current, {
          videoId: scene?.videoId || "",
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
              if (!cancelled) setIsReady(true);
            },
            onStateChange: (event) => {
              if (!event) return;
              const state = event.data;
              const PlayerState = window?.YT?.PlayerState;
              if (PlayerState && state === PlayerState.PLAYING) {
                setIsExpanded(true);
              } else if (PlayerState && (state === PlayerState.PAUSED || state === PlayerState.ENDED)) {
                setIsExpanded(false);
              }
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore cleanup failures
        }
        playerRef.current = null;
      }
    };
  }, [scene?.videoId]);

  const handlePlay = useCallback(() => {
    playerRef.current?.playVideo();
    setIsExpanded(true);
    if (typeof window !== "undefined" && window.innerWidth <= 720) {
      const iframe = playerRef.current?.getIframe?.();
      try {
        if (iframe?.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe?.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }
    }
  }, []);

  const handleStop = useCallback(() => {
    playerRef.current?.stopVideo();
    setIsExpanded(false);
  }, []);

  const handlePause = useCallback(() => {
    playerRef.current?.pauseVideo();
    setIsExpanded(false);
  }, []);

  const status = error ? "Video failed to load" : isReady ? null : "Loading video";

  return (
    <div className={`story-scene story-scene--video${isExpanded ? " is-playing" : ""}`}>
      <SceneHeading scene={scene} />
      <div className="story-video-frame" aria-label="Programme introduction video">
        <div ref={containerRef} className="story-video-player" />
      </div>
      <div className="story-video-actions">
        <button type="button" className="btn" onClick={handlePlay} disabled={!isReady || !!error}>
          Play
        </button>
        <button type="button" className="btn secondary" onClick={handlePause} disabled={!isReady || !!error}>
          Pause
        </button>
        <button type="button" className="btn secondary" onClick={handleStop} disabled={!isReady || !!error}>
          Stop
        </button>
        {status ? <span className="story-video-status">{status}</span> : null}
      </div>
    </div>
  );
}
