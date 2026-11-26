// Words for the Ludus Latrunculorum print-and-play PDF. The rules match the course's
// "Ludarium table rules" (src/content/courses/ludus-latrunculorum.yaml), built on the
// Locus Ludi "Piso variant" (University of Fribourg, 2022). Sources:
// docs/academy/ludus-latrunculorum-research.md. No em dashes anywhere.
export const RULES = {
  board: { perSide: 16, dux: false },
  print: {
    cell: 0.82,
    piecesPerRow: 9,
    spares: 2,
    piecesNote:
      'Print this page on card if you can. Each army is 16 pieces plus 2 spares. The disc on each piece is drawn after the small glass counters Romans played with. Learning the bound-piece variant? Turn a bound piece 45 degrees so it sits as a diamond.',
  },
  boards: [
    {
      cols: 8,
      rows: 8,
      eyebrow: 'The board',
      title: 'The 8 by 8 board',
      note: 'Eight by eight is the most common size among surviving Roman boards. Letters and numerals let you write down a game. Glue the page to card from a cereal box for a board that lies flat.',
    },
    {
      cols: 7,
      rows: 8,
      eyebrow: 'Bonus board',
      title: 'The 7 by 8 board',
      note: 'The other size found intact in Italy, and common in Roman Britain. Same rules, same pieces, a tighter fight. Try it once you know the 8 by 8.',
    },
  ],
  credit: 'Original design by The Ludarium. Free for home and classroom use.',
  lede: 'The soldiers’ game of ancient Rome, scratched into stone at forts and in cities across the empire. Trap an enemy piece between two of yours and it is gone. Two players, about 30 minutes.',
  contents: 'Inside: these rules, an 8 by 8 board, 16 light and 16 dark pieces with spares, and a bonus 7 by 8 board.',
  make: [
    'Print every page at 100% or "actual size". Letter and A4 both work.',
    'Print the pieces on card stock, or glue the page to thin card first.',
    'Cut each strip of pieces along the long grey lines, then cut the strips into squares.',
    'Glue the board to card, or just lay it flat under a book for a minute.',
  ],
  paperNote: 'No printer? Any chessboard works, with checkers, coins, or buttons in two colours.',
  quick: [
    { h: 'Goal', p: 'Capture more enemy pieces than your opponent captures of yours.' },
    {
      h: 'Placing',
      list: [
        'The board starts empty. Light places first.',
        'Take turns placing one piece on any empty square until all 32 are down.',
        'Nothing is captured while placing. Then Light makes the first move.',
      ],
    },
    {
      h: 'Moving',
      list: [
        'Move one piece one square forward, back, left or right. Never diagonally, never jumping.',
        'You may not move a piece straight back to the square it just left on your next turn.',
      ],
    },
    {
      h: 'Capturing',
      list: [
        'Move a piece so it traps an enemy piece between itself and another of yours in a row or column, and remove the trapped piece.',
        'One move can capture on more than one side, but only single pieces: two enemies in a row between yours are safe.',
        'A piece in a corner is captured by two enemies on its neighbouring squares.',
        'Only the player who moves captures. You may step between two enemies safely.',
      ],
    },
    {
      h: 'Ending',
      p: 'The game ends when a player has one piece left or cannot move. Most captures wins. If 30 turns in a row pass with no capture, stop: most pieces on the board wins. A tie is a draw.',
    },
  ],
  diagrams: [
    { grid: ['....', 'LXL.', '....'], arrow: [3, 1, 2, 1], caption: 'Sandwich: Light moves in, and the dark piece between two light pieces is taken.' },
    { grid: ['XL.', 'L..', '...'], corner: true, arrow: [1, 1, 1, 0], caption: 'Corner: a piece in the corner falls to two enemies on its neighbouring squares.' },
    { grid: ['...', 'LSL', '...'], arrow: [1, 2, 1, 1], caption: 'Safe entry: Dark may step between two light pieces. Nothing is captured.' },
  ],
  honesty:
    'No Roman rulebook survives. Ovid, Martial and the poem Laus Pisonis tell us about the sandwich capture, the two colours, and the glass soldiers. Placing pieces on an empty board is a strong scholarly reading of that poem. Movement, corners, and the ending are modern choices, built on the Locus Ludi project led by Ulrich Schädler. The free course explains every choice.',
};
