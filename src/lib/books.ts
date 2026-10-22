// Books by The Ludarium's people, sold on Amazon. Plain Amazon links, not
// affiliate links. The Ludarium does not sell them itself; Amazon prints,
// sells and ships. Prices are left off the site because KDP prices can change.
import { MALAPHOR_BOOK_URL, MALAPHOR_KINDLE_URL } from '@/lib/config';

export interface Book {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  /** One or two sentences for cards and meta descriptions. */
  blurb: string;
  paperbackUrl: string;
  kindleUrl: string;
  isbn: string;
  pages: number;
  format: string;
  publisher: string;
  /** ISO date the editions went live. */
  published: string;
  publishedLabel: string;
}

export const MALAPHOR_BOOK: Book = {
  slug: 'well-burn-that-bridge',
  title: "We'll Burn That Bridge When We Get to It",
  subtitle: 'A Field Guide to Malaphors, and the Beautiful Mess Inside Your Head',
  author: 'Levi JA Wilson',
  blurb:
    '148 malaphors, the accidental collisions of two idioms, each traced to its parents, scored, and acted out in a comic strip by four old friends at a game table.',
  paperbackUrl: MALAPHOR_BOOK_URL,
  kindleUrl: MALAPHOR_KINDLE_URL,
  isbn: '9798164249311',
  pages: 254,
  format: 'Full-color paperback, 6 x 9 in. Kindle eBook.',
  publisher: 'Independently published',
  published: '2026-10-22',
  publishedLabel: 'October 2026',
};

export const BOOKS: Book[] = [MALAPHOR_BOOK];
