import { useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

const FAQ_IMAGE = "/images/story/IMG_0737 copy.webp";

function renderAnswerContent(item) {
  const answer = item?.answer;
  const bullets = Array.isArray(item?.bullets) ? item.bullets : [];
  const paragraphs = Array.isArray(answer) ? answer : [answer].filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {bullets.length > 0 ? (
        <ul>
          {bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export default function FaqScene({ scene }) {
  const intro = scene?.intro;
  const footer = scene?.footer;
  const faqs = Array.isArray(scene?.faqs) ? scene.faqs : [];
  const [openItems, setOpenItems] = useState(() => new Set());

  const toggleItem = (index) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="story-scene story-scene--faq">
      <SceneHeading scene={scene} />
      {intro ? <p className="story-faq-intro">{intro}</p> : null}
      <div className="story-faq-layout">
        <div className="story-faq-media">
          <img
            src={withBase(FAQ_IMAGE)}
            alt="Architecture students collaborating in studio"
            loading="lazy"
          />
        </div>
        <div className="story-faq-questions">
          <div className="story-faq-scroll">
            {faqs.map((item, index) => {
              const key = item?.question || index;
              const isOpen = openItems.has(index);
              const linkHref = item?.link?.href;
              const linkLabel = item?.link?.label || linkHref;
              const answerId = `story-faq-answer-${index}`;

              return (
                <article key={key} className="story-faq-card">
                  <button
                    type="button"
                    className={`story-faq-toggle${isOpen ? " is-open" : ""}`}
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                  >
                    {item?.question ? <span className="story-faq-question">{item.question}</span> : null}
                    <span className="story-faq-icon" aria-hidden="true">
                      <span />
                      <span />
                    </span>
                  </button>
                  <div
                    className={`story-faq-answer${isOpen ? " is-open" : ""}`}
                    id={answerId}
                    hidden={!isOpen}
                  >
                    {renderAnswerContent(item)}
                    {linkHref ? (
                      <a className="story-faq-link" href={linkHref} target="_blank" rel="noreferrer">
                        {linkLabel || "Find out more"}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
      {footer ? <p className="story-faq-footer">{footer}</p> : null}
    </div>
  );
}
