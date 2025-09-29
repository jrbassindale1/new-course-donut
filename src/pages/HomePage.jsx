import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CompassChart from "../components/CompassChart.jsx";
import moduleInfo from "../data/moduleInfo.json";
import programmeInfo from "../data/programmeInfo.json";

const MotionDiv = motion.div;

export default function HomePage({ onNavigate }) {
  const [infoModuleId, setInfoModuleId] = useState(null);
  const [infoKey, setInfoKey] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);

  const handleReset = () => {
    setInfoModuleId(null);
    setInfoKey(null);
    setResetSignal((value) => value + 1);
  };

  const handleNavigateToCarousel = (event) => {
    if (onNavigate) {
      event?.preventDefault?.();
      onNavigate("gallery");
    }
  };

  return (
    <div className="app-shell">
      <div className="page-grid">
        <div className="page-header">
          <h1 className="page-title">BSc Architecture @ UWE Bristol</h1>
          <div className="page-actions">
            <a className="btn secondary" href="#/gallery" onClick={handleNavigateToCarousel}>
              View Image Carousel
            </a>
            <button className="btn" type="button" onClick={handleReset}>
              Reset Chart
            </button>
          </div>
        </div>
        <div className="panel chart-panel">
          <div className="panel-header">
            <div className="breadcrumbs" />
          </div>
          <div className="chart-wrapper">
            <div className="chart-inner">
              <CompassChart
                resetSignal={resetSignal}
                onInfoSelect={(id, key) => {
                  setInfoModuleId(id);
                  setInfoKey(key);
                }}
              />
            </div>
          </div>
        </div>
        <div className="panel details-panel">
          <AnimatePresence mode="wait">
            {!infoKey && (
              <MotionDiv
                key="programme"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {(() => {
                  const syn = programmeInfo && programmeInfo.synopsis ? String(programmeInfo.synopsis).trim() : "";
                  const paras = syn.split(/\n\s*\n/).filter(Boolean);
                  return (
                    <div>
                      {paras.length
                        ? paras.map((p, i) => (
                            <p key={i} className="item-desc">
                              {p}
                            </p>
                          ))
                        : null}
                      <p className="item-desc">
                        <strong>Click on the programme diagram to find out more about the course.</strong>
                      </p>
                    </div>
                  );
                })()}
              </MotionDiv>
            )}
            {infoKey && infoModuleId && (
              <div>
                {(() => {
                  const isProgramme = infoModuleId === "PROGRAMME";
                  const sectionLabel = (() => {
                    if (infoKey === "threads") return "Studio Threads";
                    if (infoKey === "outcomes") return isProgramme ? "Outcomes" : "Module Outcomes";
                    return (
                      {
                        keyInfo: "Key Info",
                        synopsis: "Synopsis",
                        learningAndTeaching: "Learning & Teaching",
                        supportAndFacilities: "Support & Facilities",
                        professionalRecognition: "Professional Recognition",
                      }[infoKey] || infoKey
                    );
                  })();
                  const titleLeft =
                    infoModuleId === "PROGRAMME"
                      ? "Programme"
                      : (moduleInfo[infoModuleId] && moduleInfo[infoModuleId].moduleName) || infoModuleId;
                  return (
                    <h2 className="panel-title">
                      {titleLeft} — {sectionLabel}
                      {!isProgramme && <span className="muted"> ({infoModuleId})</span>}
                    </h2>
                  );
                })()}
                {(() => {
                  const src = infoModuleId === "PROGRAMME" ? programmeInfo : moduleInfo[infoModuleId] || {};
                  const val = src?.[infoKey];

                  if (infoModuleId === "PROGRAMME" && infoKey === "threads") {
                    const renderThread = (thread, index) => {
                      if (!thread) return null;
                      if (typeof thread === "string") {
                        const parts = thread.trim().split(/\n\s*\n/).filter(Boolean);
                        return (
                          <div key={index}>
                            {parts.map((part, idx) => (
                              <p key={idx} className="item-desc">
                                {part}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      const title = thread.title || "";
                      const keywords = thread.keywords || thread.keyword || "";
                      const desc = thread.description || "";
                      const paras = String(desc).trim().split(/\n\s*\n/).filter(Boolean);
                      return (
                        <div key={index}>
                          {title && (
                            <p className="item-desc">
                              <strong>{title}</strong>
                            </p>
                          )}
                          {keywords && <p className="item-desc">({keywords})</p>}
                          {paras.length > 0 ? paras.map((p, idx) => <p key={idx} className="item-desc">{p}</p>) : null}
                        </div>
                      );
                    };
                    const intro = programmeInfo?.threadsIntro ? (
                      <p className="item-desc">{programmeInfo.threadsIntro}</p>
                    ) : null;
                    if (Array.isArray(val)) {
                      return (
                        <div>
                          {intro}
                          {val.map(renderThread)}
                        </div>
                      );
                    }
                    return (
                      <div>
                        {intro}
                        {renderThread(val, 0) || <p className="item-desc">No content yet.</p>}
                      </div>
                    );
                  }

                  if (infoKey === "threads" && infoModuleId !== "PROGRAMME") {
                    const renderModuleThread = (thread, index) => {
                      if (!thread) return null;
                      if (typeof thread === "string")
                        return (
                          <p key={index} className="item-desc">
                            {thread}
                          </p>
                        );
                      const label = thread.label || thread.title || "";
                      const desc = thread.value || thread.description || "";
                      const keywords = thread.keywords || thread.keyword || "";
                      return (
                        <div key={index}>
                          {label && (
                            <p className="item-desc">
                              <strong>{label}</strong>
                            </p>
                          )}
                          {keywords && <p className="item-desc">({keywords})</p>}
                          {String(desc)
                            .split(/\n\s*\n/)
                            .filter(Boolean)
                            .map((p, idx) => (
                              <p key={idx} className="item-desc">
                                {p}
                              </p>
                            ))}
                        </div>
                      );
                    };
                    if (Array.isArray(val)) return <div>{val.map(renderModuleThread)}</div>;
                    return renderModuleThread(val, 0) || <p className="item-desc">No content yet.</p>;
                  }

                  if (infoModuleId === "PROGRAMME" && infoKey === "outcomes") {
                    const intro = programmeInfo?.outcomesIntro ? (
                      <p className="item-desc">{programmeInfo.outcomesIntro}</p>
                    ) : null;
                    if (Array.isArray(val)) {
                      return (
                        <div>
                          {intro}
                          {val.map((outcome, index) => {
                            if (outcome && typeof outcome === "object") {
                              const code = outcome.code || outcome.id || "";
                              const keyword = outcome.keyword || outcome.keywords || outcome.title || "";
                              const desc = outcome.description || "";
                              return (
                                <p key={index} className="item-desc">
                                  {code && <strong>{code}:</strong>} {keyword && <strong> {keyword} —</strong>} {desc}
                                </p>
                              );
                            }
                            return (
                              <p key={index} className="item-desc">
                                {String(outcome)}
                              </p>
                            );
                          })}
                        </div>
                      );
                    }
                    return <p className="item-desc">{String(val || "No content yet.")}</p>;
                  }

                  if (!val) {
                    return <p className="item-desc">No content yet.</p>;
                  }

                  if (Array.isArray(val)) {
                    return (
                      <div className="item-list">
                        {val.map((entry, index) => {
                          if (entry && typeof entry === "object") {
                            const title = entry.title || entry.name || entry.label || "";
                            const desc = entry.description || entry.synopsis || entry.value || "";
                            return (
                              <div key={index} className="item-row">
                                {title && <p className="item-title">{title}</p>}
                                {desc && <p className="item-desc">{desc}</p>}
                              </div>
                            );
                          }
                          return (
                            <p key={index} className="item-desc">
                              {String(entry)}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }

                  if (typeof val === "string") {
                    return val
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index} className="item-desc">
                          {paragraph}
                        </p>
                      ));
                  }

                  if (typeof val === "object") {
                    return (
                      <div className="item-list">
                        {Object.entries(val).map(([key, value]) => (
                          <div key={key} className="item-row">
                            <p className="item-title">{key}</p>
                            <p className="item-desc">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return <p className="item-desc">{String(val)}</p>;
                })()}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
