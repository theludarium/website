---
title: "Ludus Latrunculorum Captures: Pairs, Edges, Corners, and Doubles"
description: "Every capture in Ludus Latrunculorum explained: the sandwich, double and triple captures, edges, corners, safe entry, and the 2x2 block that can never be taken."
course: ludus-latrunculorum
order: 5
level: 1
emailSubject: "Two pieces, one trap"
pubDate: 2026-11-26
draft: false
oneIdea: "Every capture needs two of your pieces: one already in place, and one that moves in to close the trap. Learn to see both halves, and you will spot captures for yourself and dangers to your own pieces long before they happen."
tryThis: "In your next game, before each move, touch the square you plan to move to and check all four of its neighbours for a capture."
nextTeaser: "Next, a break from the board: the soldiers, poets, and one calm condemned man who played this game, and how we know."
---
The whole game turns on one idea, the trap between two. This lesson takes that idea apart so you can see every version of it on the board: single captures, double and triple captures, edges, corners, and the gaps that look safe but are not. The rules are the Ludarium table rules from [lesson 1](/academy/ludus-latrunculorum/how-to-play-ludus-latrunculorum/). The patterns that follow are logic from those rules, not ancient teaching.

In the diagrams, L is light, D is dark, a dot is an empty square, and an arrow shows the piece that moves.

## Anvil and hammer

Every capture has two parts. The **anvil** is your piece already standing on one side of the enemy. The **hammer** is the piece you move to the other side. The hammer must be the piece you moved this turn. That is why only the moving player captures, and why a piece that walks into a gap between two enemies is safe.

```
before:  L D . L      after:  L D L .
                ←                       (D is captured)
```

Light moves the right-hand piece one square left. The dark piece is now between two light pieces in a row, so it is removed.

## Double and triple captures

Away from the edges, your hammer lands on a square with four neighbours. It came from one of them, which is now empty. Each of the other three could hold an enemy with one of your anvils beyond it. So one move can capture up to three pieces. On an edge square, the most is two.

The most useful version is safe entry with a bite:

```
before:  L D . D L      after:  L D L D L
                                  ↑ moved in from below
```

The light piece steps into the gap between two dark pieces. It is safe there, because Light is the one moving. And it closes two traps at once: each dark piece now sits between two light pieces. Both are captured. Lesson 7 shows why a Roman poet may have been describing exactly this.

## What cannot be captured

- **Two in a row.** The trap holds one piece. Two enemy pieces side by side between yours are both safe along that line.
- **Diagonals.** Pieces that touch only at the corners never form a trap.
- **A 2x2 block.** Each piece has a friend in its row and in its column, so no sandwich can form while the block holds.
- **Old sandwiches.** A piece that was placed or moved between two enemies is not captured later just because it is still there. Only a move that closes a trap captures.

## Edges

A piece on the edge of the board can be trapped only along the edge. The edge itself is never an anvil. So an edge piece has one line of danger instead of two, and an edge piece with a friend next to it along the edge cannot be captured at all. Be precise about the direction. A friend beside it along the edge blocks the only line of danger. A friend just inside the board, at right angles to the edge, does not help: enemies on both sides of the edge piece, along the edge, still capture it.

## Corners

The corner is the one special case. A corner piece is captured when enemy pieces stand on **both** of its neighbouring squares, one along each edge:

```
D L .
L . .        (dark corner piece, top left, is captured)
. . .
```

The second light piece to arrive is the hammer. A lone corner piece has just two exits, so it is easy to trap. But a corner piece with a friend beside it can never be taken, because both neighbours must be enemies. The friend is safe too: it sits on an edge, and the corner piece blocks its only line of danger.

## The trap that reopens

Safe entry is safe for now. Look at this:

```
L D L
```

The dark piece stepped in safely. If the light piece on the right steps away, and later any light piece steps back onto that square, the trap closes and the dark piece is captured. The same piece cannot step straight back on its very next turn (the no-shuffling rule), so with that piece it takes three of Light's turns: step away, make any other move, then step back. A second light piece nearby can close the trap on the very next turn. Either way, a piece sitting between two enemies needs a plan to leave.

## Reading danger to your own pieces

Your own move can never lose you a piece, because captures only happen on the mover's turn. So danger is always one enemy move away. For each of your pieces that touches an enemy, ask:

1. Is the square on the far side of my piece empty? (For a corner piece, that means its other neighbouring square.)
2. Can an enemy piece step onto it next turn?

If both answers are yes, that piece is under threat. Fill the gap, move the piece, or make a bigger threat of your own.

## Sources

- Ovid, *Ars Amatoria* 3.357 to 360, on [The Latin Library](https://www.thelatinlibrary.com/ovid/ovid.artis3.shtml)
- Locus Ludi rules, English edition (2022): [rules PDF](https://locusludi.ch/wp-content/uploads/2022/08/LUDUS-LATRUNCULORUM_rules_GB.pdf)
- Crist et al. (2024): [PDF](https://cris.maastrichtuniversity.nl/ws/portalfiles/portal/221344302/Giannini-2024-Computational-Approaches-for-Recognising-and.pdf)
