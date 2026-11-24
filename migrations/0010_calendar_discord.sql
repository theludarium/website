-- Announcements to the Cube Commonwealth Discord, 2026-11-24.
-- The ludarium-calendar-discord Worker posts each approved event to the events
-- channel a week before it starts, then the Cube the vote picked when voting
-- closes, and a note if an announced event is cancelled. These columns say
-- whether to announce an event and what has already been posted, so nothing is
-- posted twice. Sample events are never posted.
ALTER TABLE cal_events ADD COLUMN announce INTEGER NOT NULL DEFAULT 1;   -- 1: post it in Discord
ALTER TABLE cal_events ADD COLUMN announced_at TEXT;                   -- when the event was posted
ALTER TABLE cal_events ADD COLUMN result_posted_at TEXT;               -- when the vote result was posted
ALTER TABLE cal_events ADD COLUMN cancel_posted_at TEXT;               -- when the cancellation was posted
