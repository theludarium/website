// Shapes returned by the Worker. BGG values are carried through unchanged;
// only the format changes (XML to JSON). Ludarium suggestions live in their
// own object so the two sources are never mixed.

export interface PlayerCountVotes {
  /** Player count label exactly as BGG gives it, e.g. "3" or "5+". */
  count: string;
  best: number;
  recommended: number;
  notRecommended: number;
}

export interface BggThing {
  bggId: number;
  type: string;
  name: string;
  year: number | null;
  image: string | null;
  thumbnail: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  minAge: number | null;
  categories: string[];
  mechanics: string[];
  families: string[];
  designers: string[];
  publishers: string[];
  /** Community poll: best / recommended / not recommended at each count. */
  playerCountPoll: PlayerCountVotes[];
  playerCountPollTotal: number;
  /** Community poll: suggested minimum age, votes per age label. */
  agePoll: { age: string; votes: number }[];
  /** Community poll: language dependence, level 1 (none) to 5 (unplayable in another language). */
  languagePoll: { level: number; label: string; votes: number }[];
  stats: {
    usersRated: number | null;
    average: number | null;
    bayesAverage: number | null;
    rank: number | null;
    owned: number | null;
    averageWeight: number | null;
    numWeights: number | null;
  } | null;
}

export interface BggCollectionItem {
  bggId: number;
  collId: number | null;
  subtype: string;
  name: string;
  year: number | null;
  image: string | null;
  thumbnail: string | null;
  numPlays: number;
  /** The user's own BGG rating, 1-10, or null when unrated. */
  rating: number | null;
  status: {
    own: boolean;
    prevOwned: boolean;
    wantToPlay: boolean;
    wishlist: boolean;
    forTrade: boolean;
    preordered: boolean;
  };
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
}

export interface BggPlayPlayer {
  username: string | null;
  name: string | null;
  score: string | null;
  win: boolean;
  isNew: boolean;
}

export interface BggPlay {
  playId: number;
  date: string | null;
  quantity: number;
  length: number | null;
  incomplete: boolean;
  location: string | null;
  bggId: number | null;
  gameName: string | null;
  comments: string | null;
  players: BggPlayPlayer[];
}

export interface BggPlaysPage {
  username: string;
  total: number;
  page: number;
  plays: BggPlay[];
}

export interface BggSearchHit {
  bggId: number;
  type: string;
  name: string;
  year: number | null;
}

/** Ludarium's own suggestions derived from BGG facts. Staff confirm before filing. */
export interface LudariumSuggestion {
  bggId: number;
  name: string;
  shelf: string | null;
  sub: string | null;
  shelfReason: string | null;
  dims: {
    theme: number | null;
    luck: number | null;
    inter: number | null;
    learn: number | null;
    tempo: number | null;
    /** Always null: Table Talk is filed by The Ludarium, never derived. */
    talk: null;
  };
  dimReasons: Partial<Record<'theme' | 'luck' | 'inter' | 'learn' | 'tempo', string>>;
  players: [number, number] | null;
  bestAt: number[];
  recommendedAt: number[];
  minutes: number | null;
  suggestedAge: number | null;
  languageLevel: number | null;
  occasions: string[];
  callCutter: string;
}

export interface Envelope<T> {
  data: T;
  source: 'BoardGameGeek';
  attribution: { text: string; url: string; termsOfUse: string };
  cached: boolean;
  fetchedAt: string;
}
