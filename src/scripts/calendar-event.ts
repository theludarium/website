// The event view inside the calendar's day dialog: details, who is going, and
// the Cube vote. Spec: docs/calendar/SPEC.md, section 7.
// STUB: the Event view builder replaces this body. The signature is the contract.
import type { EventSummary } from '@/lib/calendar/shared';

export type EventViewOptions = {
  /** CAL_API, for example '/api/events'. */
  api: string;
  /** The Cube Library API, '/api/cubes'. Answers { cubes: PublicCube[] }. */
  cubesApi: string;
  /** Absolute URL of the calendar page without its query string. */
  pageUrl: string;
  /** Turnstile site key. Null or empty skips the check. */
  siteKey: string | null;
  /** CAL_SUGGEST. */
  suggestUrl: string;
  /** Called whenever a fresh payload arrives, so lists can update the going count. */
  onChange?: (summary: EventSummary) => void;
};

export type EventView = { destroy(): void };

export function mountEventView(container: HTMLElement, eventId: number, preview: EventSummary | null, options: EventViewOptions): EventView {
  void options;
  container.innerHTML = '';
  const title = document.createElement('h3');
  title.id = 'cev-title';
  title.textContent = preview?.title ?? `Event ${eventId}`;
  const note = document.createElement('p');
  note.textContent = 'Loading event details.';
  container.append(title, note);
  return {
    destroy() {
      container.innerHTML = '';
    },
  };
}
