import { useEffect, useMemo, useRef, useState } from "react";
import CompassChart from "../../../components/CompassChart.jsx";
import moduleInfo from "../../../data/moduleInfo.json";
import programmeInfo from "../../../data/programmeInfo.json";
import SceneHeading from "../components/SceneHeading.jsx";

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

export default function ChartScene({ scene }) {
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedModuleColor, setSelectedModuleColor] = useState(null);
  const [chartSize, setChartSize] = useState(480);
  const canvasRef = useRef(null);

  const MIN_CHART_SIZE = 260;
  const DETAIL_MIN_WIDTH = 260;
  const STACK_BREAKPOINT = "(max-width: 960px)";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const node = canvasRef.current;
    if (!node) return undefined;

    const getSafeSize = () => {
      const rect = node.getBoundingClientRect();
      const top = rect.top || 0;
      const viewportHeight = window.innerHeight || rect.height || 0;
      const stage = node.closest && node.closest(".story-stage");
      let stagePaddingBottom = 24;
      if (stage) {
        const stageStyles = window.getComputedStyle(stage);
        stagePaddingBottom = Math.max(
          stagePaddingBottom,
          Number.parseFloat(stageStyles.paddingBottom) || 0,
        );
      }
      const verticalAllowance = Math.max(
        MIN_CHART_SIZE,
        viewportHeight - top - stagePaddingBottom,
      );

      let containerWidth = rect.width || 0;
      let gap = 0;

      const container = node.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        containerWidth = containerRect.width || containerWidth;
        const computed = window.getComputedStyle(container);
        const maybeGap = computed.columnGap || computed.gap || "0";
        gap = Number.parseFloat(maybeGap) || 0;
      }

      const isStacked =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia(STACK_BREAKPOINT).matches;
      let horizontalAllowance = containerWidth;
      if (!isStacked) {
        horizontalAllowance = containerWidth - DETAIL_MIN_WIDTH - gap;
      }
      horizontalAllowance = Math.max(
        MIN_CHART_SIZE,
        Math.min(horizontalAllowance, containerWidth),
      );

      const maxHeight = Math.max(MIN_CHART_SIZE, verticalAllowance);
      const maxWidth = Math.max(MIN_CHART_SIZE, horizontalAllowance);
      const size = Math.max(MIN_CHART_SIZE, Math.min(maxWidth, maxHeight));
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

  const selectedModule = selectedModuleId
    ? moduleInfo[selectedModuleId]
    : null;
  const moduleDetails = useMemo(() => {
    if (!selectedModule) return null;
    return {
      title: selectedModule.moduleName || selectedModuleId,
      code: selectedModuleId,
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

  return (
    <div className="story-scene story-scene--chart">
      <SceneHeading scene={scene} />
      <div className="story-chart" style={{ "--chart-size": `${chartSize}px` }}>
        <div
          className="story-chart-canvas"
          ref={canvasRef}
        >
          <div
            className="story-chart-inner"
            style={{
              width: chartSize,
              height: chartSize,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <CompassChart
              width={chartSize}
              height={chartSize}
              padding={0}
              onInfoSelect={(selection) => {
                const moduleId = typeof selection === "string" ? selection : selection?.moduleId;
                const color = typeof selection === "object" ? selection?.color : null;
                if (!moduleId) {
                  setSelectedModuleId(null);
                  setSelectedModuleColor(null);
                  return;
                }
                setSelectedModuleId(moduleId);
                setSelectedModuleColor(color || null);
              }}
            />
          </div>
        </div>
        <aside
          className="story-chart-detail"
          style={{ "--story-detail-accent": selectedModuleColor || "transparent" }}
        >
          {moduleDetails ? (
            <>
              <h2>{moduleDetails.title}</h2>
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
            </>
          ) : (
            <>
              <h2>Explore the modules</h2>
              {toParagraphs(programmeInfo?.synopsis).map((text, index) => (
                <p key={index} className="module-help">
                  {text}
                </p>
              ))}
              <p className="module-help">
                Select a segment on the chart to see its key information.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
