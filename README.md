# Ember & Thyme — Rush Hour Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/cendelobening/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/cendelobening/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Built for [make.fun](https://make.fun/c/best-cooking-game-20261125-0137?ref=jme44qjv) — bounty: [Make the best cooking game](https://make.fun/c/best-cooking-game-20261125-0137).

A complete, original, offline cooking game that runs in desktop Chrome from
static files — no build step, no network, no libraries. You are the chef of
**Ember & Thyme**, a little kitchen with a big lunch crowd.

## How to play

Tickets fly onto the order board with a patience bar. Grab ingredients from
the bins, chop them on the board, sear patties on the ember grill (don't let
them burn!), stack the dish on the plating counter, and ring the serve
window bell before the ticket runs dry. Serve fast for patience bonuses,
chain serves for combos, and survive the final 45-second **Rush Hour**.
A 3-minute shift, 3 hearts — lose a heart for every order that expires.

- **Click** a station to walk there and use it, or steer with **WASD / arrows**
- **1–6** grab bread, tomato, lettuce, cheese, patty, onion
- **E** interact · **Space** chop faster · **Q** serve a ready plate · **M** mute
- **Enter** start · **R** play again

## The menu

| Dish | Needs | Pays |
| --- | --- | --- |
| Garden Salad | tomato, lettuce, onion | $12 |
| Cheesy Melt | bread, cheese, tomato | $15 |
| Classic Burger | bread, patty, cheese, lettuce | $18 |
| Crunch Bowl | lettuce, tomato, cheese | $14 |
| Ember Stack | bread, patty ×2, cheese, onion | $24 |

## Layout

- `game/index.html` — the page shell (canvas + module boot)
- `game/styles.css` — page chrome around the canvas
- `game/src/main.js` — game loop, input, station interactions, staged shots
- `game/src/recipes.js` — ingredients and the menu
- `game/src/kitchen.js` — floor plan, stations, board and grill timers
- `game/src/chef.js` — movement, hands, click-to-walk
- `game/src/orders.js` — order board, patience, combos, rush hour
- `game/src/render.js` — all canvas art: kitchen, food, chef, tickets, HUD
- `game/src/audio.js` — synthesised Web Audio sounds (chop, sizzle, ding)
- `main.ts` — the hand-in program (Node 22 stdlib only)

## Play it

```sh
node serve.mjs   # serves game/ at http://localhost:8080
```

or open `game/index.html` from any static server. Screenshots live in
`screenshots/` — real renders of this game's own code, staged with
`?shot=cover|cooking|serve|rush`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT licensed — see `LICENSE`.
