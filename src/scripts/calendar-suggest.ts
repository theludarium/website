// The suggest-an-event form at /cube-commonwealth/events/suggest/. Without this
// script the page shows all three steps at once and posts as a plain form. With
// it: one step at a time, early checks in the server's own words, a last look
// before sending, and the visitor's answers put back when the server returns
// them with a problem. Spec: docs/calendar/SPEC.md, section 9.
import { addDays, formatDate, formatTimeRange, isIsoDate, isTime, todayIn } from '@/lib/calendar/dates';
import { CAL_TZ, SUGGEST_MESSAGES } from '@/lib/calendar/shared';
import { SUGGEST_MAX_DAYS_AHEAD } from '@/lib/calendar/validate';

/** Where the answers wait while the form is away at the server. This tab only, and cleared on the next visit. */
const SAVED_KEY = 'ludarium.cal.suggest';
/** The answers worth keeping. Never the spam check or the trap field. */
const KEPT = ['title', 'kind', 'date', 'start_time', 'end_time', 'location_name', 'location_address', 'description', 'has_draft', 'name', 'email'];

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Saved = Record<string, unknown>;

function saveAnswers(form: HTMLFormElement): void {
  const data = new FormData(form);
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify(Object.fromEntries(KEPT.map((name) => [name, data.get(name)]))));
  } catch {
    // Storage is blocked. The form still sends. It just cannot be refilled.
  }
}

/** Reads the saved answers and forgets them, so they never outlive one round trip. */
function takeAnswers(): Saved | null {
  try {
    const raw = sessionStorage.getItem(SAVED_KEY);
    sessionStorage.removeItem(SAVED_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    return saved && typeof saved === 'object' ? (saved as Saved) : null;
  } catch {
    return null; // storage is blocked or the text is broken: start with an empty form
  }
}

/** The sentence for a code from the server. An unknown code gets the general one. */
const message = (code: string) =>
  Object.keys(SUGGEST_MESSAGES).includes(code) ? SUGGEST_MESSAGES[code as keyof typeof SUGGEST_MESSAGES] : SUGGEST_MESSAGES.unavailable;

function start(form: HTMLFormElement): void {
  const params = new URLSearchParams(location.search);
  const part = <T extends HTMLElement = HTMLElement>(selector: string) => form.querySelector<T>(selector)!;
  const field = <T extends Field = HTMLInputElement>(name: string) => form.elements.namedItem(name) as T;

  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const last = steps.length - 1;
  const fieldsOf = (step: number) => [...steps[step].querySelectorAll<Field>('input, select, textarea')];
  const label = part('[data-step-label]');
  const back = part<HTMLButtonElement>('[data-back]');
  const next = part<HTMLButtonElement>('[data-next]');
  const submit = part<HTMLButtonElement>('[data-submit]');
  const sendLabel = submit.textContent;

  const date = field('date');
  const startTime = field('start_time');
  const endTime = field('end_time');
  const kind = field<HTMLSelectElement>('kind');
  const willDraft = field('has_draft');

  // The same window the server allows: today in the calendar's time zone, up to about 18 months out.
  date.min = todayIn(CAL_TZ);
  date.max = addDays(date.min, SUGGEST_MAX_DAYS_AHEAD);
  const inWindow = (value: string) => isIsoDate(value) && value >= date.min && value <= date.max;

  // What the server said about the last try.
  const sent = params.get('event') === 'sent';
  const code = params.get('event_error');
  if (sent) part('[data-ok]').hidden = false;
  if (code) {
    const error = part('[data-error]');
    error.textContent = message(code);
    error.hidden = false;
  }

  // Unless the last try ended in a thank-you, put the answers back: the server found a
  // problem, or the connection dropped and the visitor came back to try again.
  const saved = takeAnswers();
  const restored = saved !== null && !sent;
  if (saved && restored) {
    for (const name of KEPT) {
      const el = field<Field>(name);
      const value = saved[name];
      if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = value === el.value;
      else if (typeof value === 'string') el.value = value;
    }
  } else if (inWindow(params.get('date') ?? '')) {
    date.value = params.get('date')!; // a link from an empty day on the calendar
  }

  // "People will draft a Cube" follows the kind until the visitor decides for themselves.
  let decided = restored;
  willDraft.addEventListener('change', () => (decided = true));
  kind.addEventListener('change', () => {
    if (!decided) willDraft.checked = kind.value === 'draft';
  });

  /** True when a step would get past the server. With `show`, the first problem is pointed out. */
  const passes = (step: number, show = false) => {
    date.setCustomValidity(date.value && !inWindow(date.value) ? SUGGEST_MESSAGES.date : '');
    endTime.setCustomValidity(endTime.value && endTime.value === startTime.value ? SUGGEST_MESSAGES.time : '');
    return fieldsOf(step).every((f) => {
      // The server trims, so a field of spaces counts as empty here too.
      if ((f.type === 'text' || f.type === 'email' || f.type === 'textarea') && f.value !== f.value.trim()) f.value = f.value.trim();
      return show ? f.reportValidity() : f.checkValidity();
    });
  };

  /** A last look on the final step, in the words the calendar will use. */
  const review = () => {
    const title = field('title').value.trim();
    const ready = Boolean(title) && isIsoDate(date.value) && isTime(startTime.value) && isTime(endTime.value);
    part('[data-review]').hidden = !ready;
    if (!ready) return;
    part('[data-review-title]').textContent = title;
    const overnight = endTime.value < startTime.value ? ', ending the next day' : '';
    part('[data-review-when]').textContent = `${formatDate(date.value, 'long')}, ${formatTimeRange(startTime.value, endTime.value)}${overnight}`;
  };

  let at = 0;
  const show = (step: number, focus = false) => {
    at = step;
    steps.forEach((s, i) => (s.hidden = i !== at));
    label.hidden = false;
    label.textContent = `Step ${at + 1} of ${steps.length}`;
    back.hidden = at === 0;
    next.hidden = at === last;
    submit.hidden = at !== last;
    if (at === last) review();
    // Focus goes to the step's heading, so a screen reader says where we are and no phone keyboard pops up.
    if (focus) steps[at].querySelector<HTMLElement>('legend')?.focus();
  };

  for (const step of steps) step.querySelector('legend')?.setAttribute('tabindex', '-1');
  next.addEventListener('click', () => {
    if (passes(at, true)) show(at + 1, true);
  });
  back.addEventListener('click', () => show(at - 1, true));
  // Enter moves to the next step instead of sending a half-filled form.
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing && at < last && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      next.click();
    }
  });

  // The browser cannot point at a problem on a hidden step, so the checks run here instead.
  form.noValidate = true;
  form.addEventListener('submit', (e) => {
    const bad = steps.findIndex((_, i) => !passes(i));
    if (bad !== -1) {
      e.preventDefault();
      show(bad);
      passes(bad, true);
      return;
    }
    saveAnswers(form);
    // One click, one suggestion.
    submit.disabled = true;
    submit.textContent = 'Sending';
  });
  // Coming back with the browser's Back button shows the page as it was left.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    submit.disabled = false;
    submit.textContent = sendLabel;
  });

  // With answers put back, open on the step that needs fixing, or on the last one to send again.
  const firstBad = restored ? steps.findIndex((_, i) => !passes(i)) : 0;
  show(firstBad === -1 ? last : firstBad);
}

const form = document.querySelector<HTMLFormElement>('[data-suggest-form]');
if (form) start(form);
