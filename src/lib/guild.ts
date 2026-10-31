// The Ludarium Guild of Game Guides: the Academy's skills program on how to
// teach a board game. Unlike the game courses it teaches the teacher, so it has
// its own lessons collection (src/content/guild-lessons/), its own pages under
// /academy/guild/, a toolkit of printables, and a capstone that Levi reviews by
// hand before a student is certified as an Expert Game Guide.
// Writer's guide: docs/academy/GUILD.md. Decision log: DECISIONS.md, 2026-10-26.
import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from '@/lib/articles';
import { GUILD_TOOL_SLUGS, type GuildToolSlug } from '@/lib/guild-tools';

export { GUILD_TOOL_SLUGS, type GuildToolSlug };

export type GuildLesson = CollectionEntry<'guildLessons'>;

export const GUILD = {
  slug: 'guild',
  title: 'The Ludarium Guild of Game Guides',
  shortTitle: 'Guild of Game Guides',
  /** The title graduates earn. */
  credential: 'Expert Game Guide',
  promise: 'Teach any board game in five minutes, and get a yes to the next game night.',
  description:
    'A free training program in 35 short lessons: pick the right game, teach it in five minutes, run a first game newcomers love, and earn the Expert Game Guide title.',
  audience: [
    'You always want to play more, and the people you love mostly do not play board games.',
    'You have watched a newcomer’s eyes glaze over during your rules explanation, and you know the game deserved better.',
    'You host game nights, run a play group, or lead a team, and you are the one who teaches every game.',
  ],
  /** The original article the program grew out of. */
  article: { href: '/articles/how-to-teach-a-board-game/', title: 'How to Teach a Board Game in Five Minutes' },
  /** On the Table slugs: the program is about teaching in general, not one game. */
  games: [] as string[],
};

export interface GuildModule {
  module: number;
  name: string;
  /** Short plain label for where the module sits in a game night. */
  label: string;
  /** What a student can do after the module. */
  outcome: string;
}

/** Five moves (Modules 1 to 5) between a mindset module and a field guide, then the capstone. */
export const MODULES: GuildModule[] = [
  { module: 0, name: 'The Second Game', label: 'Mindset', outcome: 'Judge every teach by one score: whether the newcomer wants to play again.' },
  { module: 1, name: 'Pick', label: 'Choose the game', outcome: 'Pick the right game for one person and one evening, and plan the three games after it.' },
  { module: 2, name: 'Prep', label: 'Before they arrive', outcome: 'Teach a gateway game without opening the rulebook, from a timed one-page script.' },
  { module: 3, name: 'The Five-Minute Teach', label: 'The teach', outcome: 'Deliver a teach in under five minutes, in the order a newcomer’s questions arise.' },
  { module: 4, name: 'Play', label: 'The first game', outcome: 'Run a first game where the newcomer makes a good move early and nobody gets crushed.' },
  { module: 5, name: 'Close', label: 'After the game', outcome: 'Leave every game night with the next one on the calendar.' },
  { module: 6, name: 'The Field Guide', label: 'Special situations', outcome: 'Teach kids, cooperative games, party games, heavy games, mixed tables, and games you have never played.' },
  { module: 7, name: 'The Capstone', label: 'Certification', outcome: 'Teach one new player, score your own teach, and earn the title Expert Game Guide.' },
];

/** Ranks a student passes on the way to certification. The last one is earned only through the capstone. */
export const RANKS = [
  { name: 'Apprentice', after: 'Modules 0 to 2', text: 'You know why teaches fail and you can prepare one that will not.' },
  { name: 'Journeyman', after: 'Modules 3 to 5', text: 'You can teach, run, and close a first game from start to finish.' },
  { name: 'Expert Game Guide', after: 'Modules 6 and 7, and the capstone', text: 'You have taught a new player who said yes to the next game, and the Guild has reviewed it.' },
];

/** The five principles under every lesson. */
export const PRINCIPLES = [
  { name: 'Frame before facts', text: 'Nobody can hold a rule until they know what it is for. Goal first, always.' },
  { name: 'Just in time, not just in case', text: 'A rule explained before it matters is forgotten. Explain it when it matters.' },
  { name: 'First win early', text: 'One good decision in the first ten minutes makes the game feel like theirs.' },
  { name: 'Protect dignity', text: 'Remove every chance to look foolish. Fear is the biggest cost a newcomer pays.' },
  { name: 'End on a high', text: 'The last ten minutes decide the memory, so call it at a good moment.' },
];

export function moduleOf(n: number): GuildModule {
  const found = MODULES.find((m) => m.module === n);
  if (!found) throw new Error(`Unknown Guild module ${n}`);
  return found;
}

export function guildLessonSlug(lesson: GuildLesson): string {
  return lesson.id.split('/').pop() ?? lesson.id;
}

export function guildLessonUrl(lesson: GuildLesson): string {
  return `/academy/guild/${guildLessonSlug(lesson)}/`;
}

export function guildLessonNumber(lesson: GuildLesson): string {
  return String(lesson.data.order).padStart(2, '0');
}

/** Lesson code in the program's own numbering: module.position, such as 3.4. */
export function guildLessonCode(lesson: GuildLesson, all: GuildLesson[]): string {
  const inModule = all.filter((l) => l.data.module === lesson.data.module);
  return `${lesson.data.module}.${inModule.findIndex((l) => l.id === lesson.id) + 1}`;
}

/** Every lesson, drafts included, in program order. */
export async function getGuildLessons(): Promise<GuildLesson[]> {
  return (await getCollection('guildLessons')).sort((a, b) => a.data.order - b.data.order);
}

export function guildHasPage(lesson: GuildLesson): boolean {
  return SHOW_DRAFTS || !lesson.data.draft;
}

const WORDS_PER_MINUTE = 230;

export function guildLessonMinutes(lesson: GuildLesson): number {
  const words = (lesson.body ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
