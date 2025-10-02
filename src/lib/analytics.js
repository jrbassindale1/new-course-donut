const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;
let listenersBound = false;
let context = {};
const sessionId = createSessionId();

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function now() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function gtagAvailable() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function withContext(params) {
  return { session_id: sessionId, ...context, ...params };
}

function logStub(eventName, payload) {
  if (import.meta.env?.DEV) {
    console.info(`[analytics stub] ${eventName}`, payload);
  }
}

export function setAnalyticsContext(partial) {
  context = { ...context, ...partial };
}

function bindGlobalListeners() {
  if (listenersBound || typeof window === "undefined") return;

  const clickListener = (event) => {
    const target = event.target instanceof Element ? event.target.closest("a, button, [data-analytics-click]") : null;
    if (!target) return;
    const elementType = target.dataset.analyticsType || target.tagName?.toLowerCase() || "element";
    const label = target.dataset.analyticsLabel || target.getAttribute("aria-label") || target.textContent?.trim() || elementType;
    const href = target instanceof HTMLAnchorElement ? target.href : target.dataset.analyticsHref;
    const id = target.id || target.dataset.analyticsId;

    trackEvent("ui_click", {
      element_type: elementType,
      element_label: label.slice(0, 80),
      element_href: href,
      element_id: id,
    });
  };

  window.document.addEventListener("click", clickListener, { capture: true });

  const visibilityListener = () => {
    setAnalyticsContext({ visibility: window.document.visibilityState });
    trackEvent("visibility_change", { state: window.document.visibilityState });
  };

  window.document.addEventListener("visibilitychange", visibilityListener);

  listenersBound = true;
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;

  if (!measurementId) {
    logStub("init", { reason: "missing measurement id" });
    bindGlobalListeners();
    initialized = true;
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!window.document.querySelector('script[data-analytics="ga"]')) {
    const script = window.document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.analytics = "ga";
    window.document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  bindGlobalListeners();
  initialized = true;
}

export function trackEvent(eventName, params = {}) {
  const payload = withContext(params);

  if (!measurementId) {
    logStub(eventName, payload);
    return;
  }

  if (gtagAvailable()) {
    window.gtag("event", eventName, payload);
  } else {
    logStub(eventName, payload);
  }
}

export function trackPageView({ name, path, title, location, additional = {} } = {}) {
  setAnalyticsContext({
    view_name: name,
    page_title: title || name,
    page_path: path,
    page_location: location,
  });

  trackEvent("page_view", {
    page_title: title || name,
    page_path: path,
    page_location: location,
    ...additional,
  });
}

export function trackTiming(metricName, durationMs, params = {}) {
  trackEvent(metricName, {
    value: Math.round(durationMs),
    value_unit: "ms",
    ...params,
  });
}

export function markInteractionStart(key) {
  return { key, startedAt: now() };
}

export function finishInteraction(mark, params = {}) {
  if (!mark) return;
  const durationMs = now() - mark.startedAt;
  trackTiming(mark.key, durationMs, params);
}

export function getSessionId() {
  return sessionId;
}
