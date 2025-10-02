import { useEffect, useMemo, useRef, useState } from "react";
import CompassChart from "../../../components/CompassChart.jsx";
import moduleInfo from "../../../data/moduleInfo.json";
import programmeInfo from "../../../data/programmeInfo.json";
import SceneHeading from "../components/SceneHeading.jsx";

export default function ChartScene({ scene }) {
  const [selected, setSelected] = useState({ moduleId: null, key: null });
  const [resetSignal, setResetSignal] = useState(0);
  const [chartSize, setChartSize] = useState(480);
  const canvasRef = useRef(null);

  const handleReset = () => {
    setSelected({ moduleId: null, key: null });
    setResetSignal((value) => value + 1);
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const node = canvasRef.current;
    if (!node) return undefined;

    const getSafeSize = () => {
      const rect = node.getBoundingClientRect();
      const width = rect.width || 0;
      const height = rect.height || 0;
      const top = rect.top || 0;
      const viewportHeight = window.innerHeight || height;
      const verticalAllowance = viewportHeight - top - 32;
      const maxHeight = Math.max(260, Math.min(height, verticalAllowance));
      const maxWidth = Math.max(260, width - 24);
      const size = Math.max(260, Math.min(maxWidth, maxHeight));
      setChartSize(size);
    };

    getSafeSize();
    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => getSafeSize());
      resizeObserver.observe(node);
    }
    window.addEventListener("resize", getSafeSize);
    return () => {
      resizeObserver?.disconnect?.();
      window.removeEventListener("resize", getSafeSize);
    };
  }, []);

  const detail = useMemo(() => {
    const { moduleId, key } = selected;
    if (!moduleId || !key) {
      return {
        title: "Explore the layers",
        body: [
          "Highlight any segment on the chart to see how design, technology and practice strands stack across the three years.",
        ],
      };
    }

    const isProgramme = moduleId === "PROGRAMME";
    const source = isProgramme ? programmeInfo : moduleInfo[moduleId] || {};
    const raw = source?.[key];

    const titleLeft = isProgramme
      ? "Programme"
      : (moduleInfo[moduleId] && moduleInfo[moduleId].moduleName) || moduleId;

    const sectionLabel = (() => {
      if (key === "threads") return "Studio Threads";
      if (key === "outcomes") return isProgramme ? "Outcomes" : "Module Outcomes";
      const labels = {
        keyInfo: "Key Info",
        synopsis: "Synopsis",
        learningAndTeaching: "Learning & Teaching",
        supportAndFacilities: "Support & Facilities",
        professionalRecognition: "Professional Recognition",
      };
      return labels[key] || key;
    })();

    const toParagraphs = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item : item?.value || item?.text || ""))
          .filter(Boolean);
      }
      const stringValue = String(value);
      return stringValue.split(/\n\s*\n/).filter(Boolean);
    };

    const body = toParagraphs(raw);

    if (key === "threads" && Array.isArray(raw)) {
      return {
        title: `${titleLeft} — ${sectionLabel}`,
        body: raw
          .map((thread) => {
            if (!thread) return null;
            if (typeof thread === "string") return thread;
            const parts = [];
            if (thread.title) parts.push(thread.title);
            if (thread.keywords) parts.push(`(${thread.keywords})`);
            if (thread.description) parts.push(thread.description);
            return parts.filter(Boolean).join(" — ");
          })
          .filter(Boolean),
      };
    }

    return {
      title: `${titleLeft} — ${sectionLabel}`,
      body: body.length
        ? body
        : ["Details coming soon. Select another area to keep exploring."],
    };
  }, [selected]);

  return (
    <div className="story-scene story-scene--chart">
      <SceneHeading scene={scene} />
      <div className="story-chart">
        <aside className="story-chart-detail">
          <h2>{detail.title}</h2>
          {detail.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </aside>
        <div className="story-chart-canvas" ref={canvasRef}>
          <button className="btn story-chart-reset" type="button" onClick={handleReset}>
            Reset Chart
          </button>
          <div className="story-chart-inner" style={{ width: chartSize, height: chartSize }}>
            <CompassChart
              width={chartSize}
              height={chartSize}
              resetSignal={resetSignal}
              onInfoSelect={(moduleId, key) => setSelected({ moduleId, key })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
