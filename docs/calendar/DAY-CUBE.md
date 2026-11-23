# The day Cube

How a day on the events calendar opens. Three prototypes were built and compared (a Cube that unfolds flat, a box whose lid opens, and an exploded view). The Cube that unfolds won. This file says what to port and what to change on the way in.

## The idea in one line

The day square lifts off the calendar, thickens into a paper Cube, rolls toward the visitor, and unfolds flat like the paper net of a cube. The flat net becomes the panel, and each event lands on it as a mini-Cube.

It is the closest reading of what Levi asked for: "the square to turn into a 3D Cube and rotate toward the visitor and open up to show the events for that day", with the events as "mini-Cubes instead of the dots".

## The reference

The reference was a one-file prototype of about 1,330 lines, kept outside the repo during the build. `src/scripts/calendar-cube.ts` and `src/styles/calendar.css` are its port. The look of the month grid, the day panel, the mini-Cubes, and the motion all come from it.

It was run in a real browser at 120 frames a second with no frame longer than 9 ms and a 7 ms click handler. Keep it that way: `render(p)` writes only `transform` and `opacity`, and every measurement happens once, before the first frame.

### The motion, as built

One function, `render(p)`, draws any moment of the opening: `p = 0` is the day square in the grid and `p = 1` is the flat open panel. Opening takes 900 ms, closing 420 ms (the same timeline backward), and the turn between the day card and the event card takes 520 ms. The beats overlap:

| Progress | What happens |
| --- | --- |
| 0.00 to 0.20 | The square leaves an empty well in the grid and thickens into a slab, then a Cube |
| 0.03 to 0.62 | The Cube rolls a quarter turn toward the visitor, with a little yaw, so the face printed with the weekday, the date, and the day's mini-Cubes comes to the front |
| 0.10 to 0.54 | It travels to the center and grows, and the scrim fades in |
| 0.52 to 0.85 | The top flap hinges up, then the sides, then the bottom, flat around the front face. Tall panels (phones, the event card) get the six-square cross; squarer panels get the five-square plus |
| 0.76 to 0.95 | The net fills its corners, the fold lines fade, and the shape settles into the panel's rectangle |
| 0.79 to 1.00 | The mini-Cubes drop onto the paper one by one with a small bounce, each followed by its words |
| 0.90 to 0.97 | The real flat panel fades in over the net |

At `p = 1` the 3D stage is hidden and the panel is plain DOM with no transform, so text is sharp and the panel scrolls normally. Time is eased on top (`p = 1 - (1 - t)^1.5` opening, `p = t^1.5` closing), and reversing mid-flight keeps `p`, so an interrupted opening never jumps.

Tapping an event turns the day card a quarter turn, like a Cube face, to bring the event card round. Back turns it the other way.

Reduced motion (`prefers-reduced-motion: reduce`): no Cube and no travel. The scrim and panel fade in over 150 ms. Mini-Cubes hold a still pose. The cards swap at once. Focus, Escape, and the focus trap are the same.

## What changes in the port

1. **Split the file.** Geometry and motion go in `src/scripts/calendar-cube.ts`: `measure`, `render(p)`, `run`, the reduced-motion path, and the card turn. It knows nothing about events, requests, or the URL; it is handed elements and callbacks. Everything else (data, requests, state, the URL, building the lists) is `src/scripts/calendar.ts`. Pure HTML builders are `src/lib/calendar/render.ts`. Styles are `src/styles/calendar.css` with the `cal-` prefix, using the site's tokens (`src/styles/tokens.css`), never hard-coded colors.
2. **Real data.** The prototype's `EVENTS` array becomes `GET /api/events` (SPEC section 4). The prototype's event card (`buildDetail`) is replaced by `mountEventView` (SPEC section 7 and "The event view, for the Calendar builder" below).
3. **Where the dialog lives.** Append the scrim, the 3D stage, and the dialog to `document.body`, outside the site's header, main, and footer, and set `inert` on those three while it is open. Keep the Tab wrap too, but have it cover every focusable control (the event view has inputs, a search box, checkboxes, `summary`, and links), not just `button, a[href]`.
4. **Scroll lock without a jump.** Locking scroll removes a classic scrollbar and shifts the page sideways, which would move the day square out from under the Cube. Lock first, pad the root by the scrollbar's width, then measure.
5. **Size.** The day panel is at most 34rem wide. With the event view showing, the panel may grow to about 40rem on wide screens and must scroll inside itself, never taller than the viewport minus a margin (use `dvh` so a phone's address bar does not hide the bottom). On phones it is nearly full width with a 12px gutter. The scrim and the dialog sit above the site's sticky header. The close and back buttons stay reachable while the event view scrolls (a sticky bar), and are at least 44px.
6. **Resize and rotate while open.** The panel is flat DOM at rest, so it reflows by itself. Closing measures again. If the day button is no longer on screen when closing (the month changed underneath, or the view was opened straight from "Coming up" or from `?event=`), skip the flight and fade out.
7. **Opened by link.** `?day=YYYY-MM-DD` plays the opening once the events and fonts are ready. `?event=<id>` opens the event card at once with no flight (the visitor came for the details). `?freeze=<0..1>` with `day` holds the opening at that progress, and `?turn=<0..1>` with `event` holds the card turn, both for screenshots. Keep the prototype's `?clock=timer` switch as well, so a headless browser on virtual time can play the motion.
8. **Empty days.** An empty day still opens. Its face shows the weekday and date with no mini-Cubes, and the panel says "Nothing planned yet." with the link to suggest an event for that day.
9. **More than four events.** The date face shows four mini-Cubes and "+2". In the panel every event drops in; from the ninth on, rows fade in with the words instead of dropping.
10. **The date face stays undistorted.** Keep the prototype's counter-scale on the date face.
11. **Past days and cancelled events** open the same way. A cancelled event's mini-Cube is drawn muted with its title struck through.

### Worth taking from the other two prototypes

- From the exploded view: its Cube carried the weekday, the month, and the date on three faces, like a desk calendar block, which gave the turn more character. If it stays crisp, print the month's short name ("Nov") on the face that shows on the right during the roll, in the same small capitals as the weekday. It fades with the fold lines before the net settles. If it looks crowded or blurs at an angle, leave the faces blank as they are.
- From the box with a lid: nothing in the motion. Its idea of a Felt Green inside is not used; the inside of this Cube is the paper the panel is made of.

### Known rough spots in the reference, to fix while porting

- Event lines in the wide grid truncate hard ("10:00 am New Pla..."). Use the short time there ("10 am", "6:30 pm") so more of the title shows. Full times stay everywhere else.
- For days in the bottom rows the Cube rolls against its direction of travel. Leave the roll direction alone (it must come toward the visitor), but check a bottom-row day and a top-row day in stills and soften the yaw if it looks wrong.
- Between about 0.84 and 0.90 the net has a full-width top and a narrower bottom band for about 50 ms. Acceptable. Do not spend time on it unless it shows in a still at 0.87.
- November's sample data had no day with more than four events, so the "+2" marker on the date face and in the grid was never seen. Check it against the stand-in server's data or by adding events in a harness.

## What the judges found in the reference

Three judges scored the prototypes after this file was first written (looks, accessibility, engineering). Each lens picked a different winner, and the engineering judge picked this one as the best engine to port. Their findings about this prototype follow. The port must not carry them over.

### Bugs: fix these in the port

1. **A copy of the day square is left on screen after closing.** The reference never hides the Cube when the close ends, so the copy floats over the wrong day after a scroll or a month change. Hide and empty the 3D stage when the close ends.
2. **A click during the card turn closes the whole dialog.** The turning cards let clicks through to the scrim, so a double click on an event (or on Back) closes everything. While a turn or the opening is running, the scrim ignores clicks, and a second click on a row or on Back does nothing.
3. **A double click on a day opens it and then closes it.** The second click lands on the scrim while it is still clear. The scrim ignores clicks for the first 400 ms after an opening starts.
4. **A long word or link pushes the panel off the screen.** The panel's width followed its content, so a 21-letter word in a title moved Close off a phone screen. The panel's width never depends on its content: `min-width: 0` on the grid and flex children, a `minmax(0, 1fr)` title column, and `overflow-wrap: anywhere` on titles, places, and descriptions. Test with an event titled with one 40-letter word and a description holding a long link.
5. **The shading on the card turn misses the sticky bar.** The Back and Close bar paints above the shade, so a bright band crosses the face for the whole turn. The shade covers the whole face, bar included.
6. **Only `main` was inert.** In the site, the header and footer must be inert too (see "What changes in the port", item 3).
7. **The day list's heading scrolled away.** Close stays reachable on the day list as it does on the event card: a sticky heading bar on both.
8. **No safety net if frames stop.** If animation frames stall (a slow phone, a tab sent to the background mid-flight), the opening could hang with a blank panel. Behind every animation run a timer that lands it on its end state a little after it should have finished.
9. **Mini-Cubes spin forever.** Moving content that never stops needs a way to stop it. Each mini-Cube makes one slow turn after it lands and then rests. It turns again while its row is hovered or focused. With reduced motion it never turns.
10. **Reduced motion was read once, at load.** Read it each time a day opens.
11. **Small accessibility gaps.** Today carries `aria-current="date"`. Arrow keys in the grid ignore presses that carry Alt, Control, or Command, so the browser's own shortcuts still work. The hover lift on a day only applies where hover exists (`@media (hover: hover)`), and the Cube is measured from the day's resting place, not its lifted one. An event row's accessible name starts with its title, then the time and the kind. Arrows drawn in CSS after a link are not read as part of its name. Past-day text and past-day mini-Cubes keep at least 4.5:1 and 3:1 contrast.
12. **Not exact at the start.** The copy of the day square was built large and scaled down, so the first frame was soft and a pixel off. Draw the copy at its natural size, snap measured positions to whole device pixels, and check that a still at `freeze=0` matches the closed calendar.

### The second pass (planned; leave these unless you are told you are the second pass)

These change the choreography, so they get their own pass with their own stills once the port works end to end.

- **The mini-Cubes should come from the Cube.** In the reference they appear from nowhere at 0.79 and drop in. The day's mini-Cubes are already printed on the Cube's front face; they should step off that face and travel to their rows, growing as they go, so the same Cubes are followed from the day square, to the Cube, to the panel. None may ever be drawn over the scrim: each travels over paper only.
- **The last 15 percent, from flat net to panel.** The reference stretches the net to the panel's shape while the words ride it. On a tall list or a phone on its side the words leave the paper or overlap, and the net's square corners show behind the panel's round ones until the last frame. Replace the stretch with a reveal: once the net is a full rectangle, the real panel is uncovered from that rectangle outward to its own edges with its own rounded corners, and nothing inside it moves or scales.
- **The card turn on a phone.** Mid-turn the two faces are different heights and run past the screen's edges. Give both faces one height for the turn and step the turning box back far enough that it stays on screen.
- **A bigger Cube on phones.** At 360px wide the Cube is about 105px, because three squares must fit across the screen. Try letting the side flaps run past the screen's edges so the Cube can be larger, and keep it only if it reads better.

## The event view, for the Calendar builder

The event view is finished and is not yours to change (`src/scripts/calendar-event.ts`, `src/lib/calendar/event-render.ts`, `src/styles/calendar-event.css`). What the calendar must do for it:

- Import its stylesheet in the page's frontmatter: `import '@/styles/calendar-event.css';` (the script does not).
- Give it a container with a definite width: a normal block or a stretched grid or flex item. `.cev` is a size container, so inside a shrink-to-fit parent it collapses to nothing.
- Call `mountEventView(container, eventId, summaryOrNull, { api, cubesApi, pageUrl, siteKey, suggestUrl, onChange })`. `pageUrl` is the calendar page's absolute URL with no query string. Call `destroy()` when leaving the event card or closing the dialog.
- `onChange(summary)` fires on every fresh answer from the server (first load, every action, and a quiet reload when the tab comes back after a minute). Use it to update that event's "going" count and Cube name in the grid, the day list, and "Coming up". An event the server no longer has cannot be reported this way: the view shows "We could not find that event." and the calendar drops it on its next list request.
- The view never takes focus when it mounts. When the event card arrives, focus `#cev-title` (it has `tabindex="-1"`).
- Escape: the view closes its own open layer first (the Cube picker, the name form, the leave question) and stops the key there. So the calendar's Escape handler must be a bubbling listener on the document or the dialog, not a capturing one.
- Its alerts scroll into view with a `scroll-margin-block` of `var(--space-8)`. If your sticky bar is taller than that, the builder of the bar pads the scroll container instead of editing the view's stylesheet.
- The view marks the visitor's sign-up in `localStorage` under `attendeeStorageKey(eventId)` (`src/lib/calendar/shared.ts`). Read it to mark events the visitor is going to (a small check beside the event in the day list and "Coming up"). Wrap storage reads in `try`.
- The page loads the Turnstile script once (`render=explicit`); the view renders the widget itself when it needs it.

## What "done" looks like

Stills at 360x740 and 1280x800, light and dark, of the grid, the opening at 0.15, 0.35, 0.55, 0.75, 0.90, and 1, a four-event day, an empty day, a day with more than four events, the event card, the card turn at 0.5, a bottom-row day at 0.35, and reduced motion. Then one played run (`clock=timer`) that opens a day, opens an event, goes back, and closes, ending with focus on the day button.
