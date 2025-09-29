import WelcomeScene from "./scenes/WelcomeScene.jsx";
import VideoScene from "./scenes/VideoScene.jsx";
import BristolScene from "./scenes/BristolScene.jsx";
import StudioScene from "./scenes/StudioScene.jsx";
import YearScene from "./scenes/YearScene.jsx";
import ChartScene from "./scenes/ChartScene.jsx";
import LeadersScene from "./scenes/LeadersScene.jsx";
import DestinationsScene from "./scenes/DestinationsScene.jsx";
import ProjectsScene from "./scenes/ProjectsScene.jsx";
import GlobalScene from "./scenes/GlobalScene.jsx";
import OutcomesScene from "./scenes/OutcomesScene.jsx";
import PathwayScene from "./scenes/PathwayScene.jsx";
import ContactScene from "./scenes/ContactScene.jsx";
import SceneHeading from "./components/SceneHeading.jsx";

export default function SceneRenderer({ scene, onOpenFullChart }) {
  if (!scene) {
    return (
      <div className="story-scene">
        <SceneHeading scene={scene} />
        <p>Scene template coming soon.</p>
      </div>
    );
  }

  switch (scene.id) {
    case "video":
      return <VideoScene scene={scene} />;
    case "leaders":
      return <LeadersScene scene={scene} />;
    case "welcome":
      return <WelcomeScene scene={scene} />;
    case "bristol":
      return <BristolScene scene={scene} />;
    case "year1":
    case "year2":
    case "year3":
      return <YearScene scene={scene} />;
    case "destinations":
      return <DestinationsScene scene={scene} />;
    case "studio":
      return <StudioScene scene={scene} />;
    case "chart":
      return <ChartScene scene={scene} onOpenFullChart={onOpenFullChart} />;
    case "projects":
      return <ProjectsScene scene={scene} />;
    case "global":
      return <GlobalScene scene={scene} />;
    case "outcomes":
      return <OutcomesScene scene={scene} />;
    case "pathway":
      return <PathwayScene scene={scene} />;
    case "contact":
      return <ContactScene scene={scene} />;
    default:
      return (
        <div className="story-scene">
          <SceneHeading scene={scene} />
          <p>Scene template coming soon.</p>
        </div>
      );
  }
}
