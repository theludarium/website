---
title: "Auction Theory for Board Games: Bid Smart, Avoid the Winner's Curse"
description: "Auction theory for board games: open, sealed, and second-price auctions, the winner's curse, and how to bid in Power Grid and Modern Art without overpaying."
course: game-theory
order: 11
level: 2
emailSubject: "Winning the auction is the warning"
pubDate: 2026-11-27
draft: false
oneIdea: "Know what a prize is worth to you before the bidding starts. When everyone is guessing at the same hidden value, winning is a sign you guessed high, so bid below your guess."
tryThis: "In your next auction game, write your top price for the lot before anyone bids. Stop at that number, however the room feels."
nextTeaser: "Level 3 starts with bargaining: your walk-away, how a deal's gains get split, and the ultimatum game, where people turn down free points."
---
Auctions are the purest form of game theory you can buy in a box. Everyone wants the same thing, everyone has a limit, and nobody knows anyone else's. Power Grid, Modern Art, and many other games are built on them. This lesson covers the main kinds of auction, the trap that catches the top bidder, and one rule that makes bidding simple.

## Four classic auctions

William Vickrey's 1961 paper set out the four auctions economists still start from.

- **Open, rising price.** Bids go up until nobody will go higher. Power Grid's plant auctions work this way, going clockwise, and a player who passes is out of that auction.
- **Falling price.** The price starts high and drops until someone claims the lot. It is often called a Dutch auction.
- **Sealed, first price.** Everyone bids in secret, and the top bid wins and pays its own bid.
- **Sealed, second price.** Everyone bids in secret, the top bid wins, and the winner pays the second highest bid. This one is named after Vickrey.

Modern Art puts several formats in one box. Each painting card shows how it is sold: open bidding, once around the table with one bid each, a hidden bid in a closed fist, a fixed price set by the seller, or a double that sells two paintings together.

## Private value or common value?

Paul Milgrom and Robert Wilson shared the 2020 Nobel Prize for their work on auctions. One key line they studied: is the prize worth different amounts to different bidders, or the same amount to everyone, with nobody sure what that amount is?

- **Private value.** A Power Grid plant is worth more to the player whose network needs it and less to the player who just bought a big one. Your value is your own.
- **Common value.** A Modern Art painting sells to the bank at the end of the round for the same amount, whoever owns it. Nobody knows that amount yet. Everyone is estimating one hidden number.

## The winner's curse

In 1971, three oil engineers, Capen, Clapp, and Campbell, wrote that companies bidding for offshore oil leases kept earning less than expected. Their explanation gave the trap its name. When everyone estimates the same hidden value, some estimates are high and some are low. The highest bid tends to come from the highest estimate. So winning is itself bad news: it suggests you guessed high.

Max Bazerman and William Samuelson tested this in business school classes, auctioning jars of coins and other small lots of known worth. As Richard Thaler later summarized, the average bid came in below the true value, but the winning bid averaged about a quarter more than the lot was worth. Nobody did anything silly. The person who guessed highest simply won.

The fix is to **bid below your estimate**, and further below when more players are bidding, because the top guess out of many is more likely to be an outlier.

## The second-price rule on a score pad

Say a lot is worth 10 to you, and your rival's best bid will be 7, 9, or 11. In a second-price auction you pay the rival's bid if you win. Here is what you gain with three different bids.

| Your bid | Rival bids 7 | Rival bids 9 | Rival bids 11 |
| --- | --- | --- | --- |
| 8 (under your value) | Win, pay 7: gain 3 | Lose: 0 | Lose: 0 |
| 10 (your value) | Win, pay 7: gain 3 | Win, pay 9: gain 1 | Lose: 0 |
| 12 (over your value) | Win, pay 7: gain 3 | Win, pay 9: gain 1 | Win, pay 11: lose 1 |

Bidding your true value is never worse than the other bids, and sometimes better. That is a weakly dominant strategy, the idea from lesson 4. An open rising auction behaves much the same way: the winner pays about where the last rival dropped out. So in Power Grid you do not need clever jumps. Stay in until the price reaches your top value, then stop. The [Power Grid auction lesson](/academy/power-grid/power-grid-auction-strategy/) shows how to work out that value.

## Modern Art's twist

In Modern Art, when you buy another player's painting, your money goes to that player. When the seller buys their own painting, the money goes to the bank. So every purchase helps a rival. If a painting will be worth 30 and you pay 20, you gain 10 and the seller gains 20. Against the seller, you only come out ahead when you pay less than half its value. Against everyone else at the table, any price under 30 is a gain. Good players weigh both.

## At the table

- **Set your top price before the bidding.** Auctions are fast and loud, and numbers drift upward in the moment.
- **Ask whose value it is.** Private value: bid up to what it is worth to you. Common value: bid below your estimate.
- **Count the bidders.** More bidders means a bigger curse for the winner.
- **Remember where the money goes.** In some games it goes to the bank, in others to a rival.

## At work

Bidding wars happen at work too: for a new hire, a contract, or a vendor deal. When the value is uncertain and the same for every bidder, the winner's curse applies, and it also runs in reverse when you bid to do a job: the lowest bid often comes from whoever underestimated the cost. Write down your limit before the process starts, and bring a colleague who will hold you to it. One firm rule: never agree with other bidders on who wins or what to bid. That is bid rigging, and it is illegal.

## Sources

- William Vickrey, "Counterspeculation, Auctions, and Competitive Sealed Tenders," *Journal of Finance* 16, no. 1 (1961): 8 to 37
- E. C. Capen, R. V. Clapp, and W. M. Campbell, "Competitive Bidding in High-Risk Situations," *Journal of Petroleum Technology* 23 (1971): 641 to 653
- Max H. Bazerman and William F. Samuelson, "I Won the Auction But Don't Want the Prize," *Journal of Conflict Resolution* 27, no. 4 (1983): 618 to 634
- Richard H. Thaler, "Anomalies: The Winner's Curse," *Journal of Economic Perspectives* 2, no. 1 (1988): 191 to 202
- The Nobel Prize in Economic Sciences 2020, press release: [nobelprize.org](https://www.nobelprize.org/prizes/economic-sciences/2020/press-release/)
