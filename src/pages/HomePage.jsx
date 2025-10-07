import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CompassChart from "../components/CompassChart.jsx";
import moduleInfo from "../data/moduleInfo.json";
import programmeInfo from "../data/programmeInfo.json";
import { trackEvent } from "../lib/analytics.js";

const MotionDiv = motion.div;

const getKeyInfoValue = (mod, label) =>
  mod?.keyInfo?.find((item) => item.label === label)?.value;

const toParagraphs = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const buildField = (label, rawValue, fallback) => {
  const parts = toParagraphs(rawValue);
  return { label, value: parts.length ? parts : [fallback] };
};

export default function HomePage({ onNavigate }) {
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const selectedModule = selectedModuleId ? moduleInfo[selectedModuleId] : null;
  const moduleDetails = useMemo(() => {
    if (!selectedModule) return null;
    return {
      title: selectedModule.moduleName || selectedModuleId,
      fields: [
        buildField(
          "Year of Study",
          selectedModule["year of study"],
          "Not specified",
        ),
        buildField(
          "UWE Credits",
          getKeyInfoValue(selectedModule, "Credits"),
          "Not specified",
        ),
        buildField(
          "Module Theme",
          selectedModule.moduleTheme,
          "Not specified",
        ),
        buildField(
          "Description",
          selectedModule.synopsis,
          "Description coming soon.",
        ),
        buildField(
          "Assessment",
          getKeyInfoValue(selectedModule, "Assessment"),
          "Assessment details coming soon.",
        ),
      ],
    };
  }, [selectedModule, selectedModuleId]);

  const handleNavigateToCarousel = (event) => {
    if (!onNavigate) return;
    event?.preventDefault?.();
    trackEvent("chart_link_click", {
      target_view: "gallery",
      control: "view_carousel_button",
    });
    onNavigate("gallery");
  };

  return (
    <div className="app-shell">
      <div className="page-grid">
        <div className="page-header">
          <h1 className="page-title">BSc Architecture @ UWE Bristol</h1>
          <div className="page-actions">
            <a
              className="btn secondary"
              href="#/gallery"
              onClick={handleNavigateToCarousel}
            >
              View Image Carousel
            </a>
          </div>
        </div>
        <div className="panel chart-panel">
          <div className="panel-header">
            <div className="breadcrumbs" />
          </div>
          <div className="chart-wrapper">
            <div className="chart-inner">
              <CompassChart
                onInfoSelect={(id) => {
                  trackEvent("chart_info_select", { module_id: id });
                  setSelectedModuleId(id);
                }}
              />
            </div>
          </div>
        </div>
        <div className="panel details-panel">
          <AnimatePresence mode="wait">
            <MotionDiv
              key={moduleDetails ? selectedModuleId : "programme"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
      {moduleDetails ? (
        <div className="module-detail">
          <h2 className="module-title">{moduleDetails.title}</h2>
                  <dl className="module-summary">
                    {moduleDetails.fields.map(({ label, value }) => (
                      <div className="module-summary__row" key={label}>
                        <dt>{label}</dt>
                        <dd>
                          {value.map((text, index) => (
                            <p key={index}>{text}</p>
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : (
                <div className="module-placeholder">
                  <h2 className="module-title">Explore the course</h2>
                  {toParagraphs(programmeInfo?.synopsis).map((text, index) => (
                    <p key={index} className="module-help">
                      {text}
                    </p>
                  ))}
                  <p className="module-help">
                    Tap a module on the left to see its key information.
                  </p>
                </div>
              )}
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
