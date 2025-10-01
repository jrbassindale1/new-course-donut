export default function SceneHeading({ scene }) {
  if (!scene) {
    return null;
  }

  return (
    <header className="story-heading">
      {scene.title ? <h1 className="story-title">{scene.title}</h1> : null}
      {scene.headline ? <p className="story-headline">{scene.headline}</p> : null}
    </header>
  );
}
