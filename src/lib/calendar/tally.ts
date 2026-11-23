// Ranked-choice counting for "which Cube do we draft": instant runoff.
//
// Every ballot counts for its highest-ranked Cube that is still in the race.
// A Cube with more than half of the counted ballots wins. If none has that,
// the Cube with the fewest votes is dropped and its ballots move to their
// next choice. Repeat until one Cube has a majority or stands alone.
//
// Ties for last place: the Cube with fewer first choices in round one is
// dropped; if that is level too, the Cube suggested later is dropped. The
// result says when a tie-break between Cubes that had votes shaped the count.
import type { Tally, TallyRound } from './shared.ts';

/**
 * @param candidates Cube ids in the order they were suggested, earliest first.
 * @param ballots    Each voter's ranking, first choice first. Ids that are not
 *                   candidates and repeats are ignored; empty ballots do not count.
 */
export function tallyRankedChoice(candidates: number[], ballots: number[][]): Tally {
  const order = new Map<number, number>();
  for (const id of candidates) if (!order.has(id)) order.set(id, order.size);

  const clean = ballots
    .map((ballot) => {
      const seen = new Set<number>();
      return ballot.filter((id) => order.has(id) && !seen.has(id) && Boolean(seen.add(id)));
    })
    .filter((ballot) => ballot.length > 0);

  if (clean.length === 0) return { ballots: 0, winner: null, tied: false, rounds: [] };

  const firstChoices = new Map<number, number>([...order.keys()].map((id) => [id, 0]));
  for (const ballot of clean) firstChoices.set(ballot[0], firstChoices.get(ballot[0])! + 1);

  const alive = new Set(order.keys());
  const rounds: TallyRound[] = [];
  let tied = false;

  for (;;) {
    const votes = new Map<number, number>([...alive].map((id) => [id, 0]));
    let counted = 0;
    for (const ballot of clean) {
      const top = ballot.find((id) => alive.has(id));
      if (top === undefined) continue;
      votes.set(top, votes.get(top)! + 1);
      counted += 1;
    }
    const counts = [...votes]
      .map(([cubeId, n]) => ({ cubeId, votes: n }))
      .sort((a, b) => b.votes - a.votes || order.get(a.cubeId)! - order.get(b.cubeId)!);

    const leader = counts[0];
    if (alive.size === 1 || leader.votes * 2 > counted) {
      rounds.push({ counts, eliminated: null });
      return { ballots: clean.length, winner: leader.cubeId, tied, rounds };
    }

    const low = counts[counts.length - 1].votes;
    const lowest = counts.filter((c) => c.votes === low);
    if (lowest.length > 1 && low > 0) tied = true;
    const loser = [...lowest].sort(
      (a, b) => firstChoices.get(a.cubeId)! - firstChoices.get(b.cubeId)! || order.get(b.cubeId)! - order.get(a.cubeId)!,
    )[0];
    rounds.push({ counts, eliminated: loser.cubeId });
    alive.delete(loser.cubeId);
  }
}
