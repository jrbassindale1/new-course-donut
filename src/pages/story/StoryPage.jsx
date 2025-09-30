import SceneRenderer from "./SceneRenderer.jsx";
import StoryTopBar from "./components/StoryTopBar.jsx";
import { useStoryState } from "./hooks/useStoryState.js";
import storyScenes from "../../data/storyScenes.json";
import uweLogo from "../../assets/1280px-UWE_Bristol_logo.svg copy.jpg";
import "./storyPage.css";

const SCENES = Array.isArray(storyScenes?.scenes) ? storyScenes.scenes : [];

export default function StoryPage({ onNavigate }) {
  const {
    bridgeActive,
    canGoBack,
    canGoForward,
    handleNext,
    handlePrev,
    handleSelect,
    isShareMode,
    progressDots,
    scene,
  } = useStoryState(SCENES);

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
      >
        <SceneRenderer
          scene={scene}
          onOpenFullChart={onNavigate ? () => onNavigate("chart") : undefined}
        />
      </div>
    </div>
  );
}
