# BSc Architecture Donut site

This Vite + React application powers the BSc Architecture course experience. It now includes client-side analytics helpers so you can understand how visitors browse, which components they interact with, and how long they stay on each experience.

## Analytics setup

1. Create a Google Analytics 4 property (or reuse an existing one) and copy its measurement ID (looks like `G-XXXXXXXXXX`).
2. Add a `.env` file at the project root with `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`. The ID is read at build time; restart the dev server after updating it.
3. Deploy as normal. The site automatically injects the GA tag, captures page-level view durations, carousel interactions, and detailed story-scene timings. All button and link clicks are recorded via delegated listeners.
4. If the environment variable is absent, the analytics module falls back to console logging so you can verify events locally without sending real traffic.

### Event catalogue

- `page_view`: fired whenever the current app view changes (`front`, `chart`, `gallery`, `story`). Includes `page_path`, `view_name`, and URL metadata.
- `view_duration`: emitted on every view exit (navigation, unload) with the milliseconds spent on the previous view.
- `navigate_request`: triggered when in-app navigation is requested, including `from_view` and `target_view`.
- `ui_click`: delegated listener that records every `<a>` and `<button>` activation with label, type, and href.
- `story_scene_view`, `story_scene_duration`, `story_navigate`, `story_select`: track the story journey, time on each scene, and navigation patterns.
- `carousel_slide_view`, `carousel_slide_duration`, `carousel_interaction`, `carousel_link_click`: track carousel dwell time, direction, and CTA usage.
- `chart_info_select`, `chart_reset`, `chart_link_click`: capture module drilldowns and CTA usage on the programme overview.

Each timing event reports `value` in milliseconds so you can chart dwell times inside GA/Looker Studio. Because `session_id` is appended to every payload, you can group events by visitor session for richer funnels.

## Development scripts

- `npm run dev` – start Vite in dev mode with fast refresh.
- `npm run build` – generate a production build.
- `npm run preview` – preview the build output locally.
- `npm run lint` – run ESLint across the workspace.
