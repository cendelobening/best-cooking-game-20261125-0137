// main.js — Ember & Thyme, the game itself: the loop, keyboard and mouse
// input, what happens at every station, scoring, and the staged states
// (?shot=) used to photograph the kitchen at its best.

import { INGREDIENTS, RECIPES, recipeForPlate } from './recipes.js';
import {
  buildKitchen, stationById, stationFront, stationAtPoint,
  createBoard, boardTick, grillTick, grillFreeSlot, grillReadySlot,
  FLOOR,
} from './kitchen.js';
import { createChef, chefSetTarget, chefMove, chefPickUp, chefTake, chefHolds } from './chef.js';
import { createOrderBoard, orderBoardTick, spawnOrder, servePlate, isRushHour } from './orders.js';
import { createSoundFX } from './audio.js';
import {
  VIEW_W, VIEW_H,
  drawKitchen, drawChef, drawOrderBoard, drawHUD,
  drawParticles, drawPopups, drawTitleScreen, drawEndScreen,
} from './render.js';

export const SHIFT_LENGTH = 180; // a 3-minute shift

export function createGame() {
  return {
    state: 'title', // title | playing | over
    timeLeft: SHIFT_LENGTH,
    score: 0,
    coins: 0,
    hearts: 3,
    stations: buildKitchen(),
    board: createBoard(),
    grill: stationById(buildKitchen(), 'grill'), // replaced below
    chef: createChef(640, 560),
    orderBoard: createOrderBoard(),
    plate: { items: [], recipe: null },
    particles: [],
    popups: [],
    keys: new Set(),
    fx: createSoundFX(),
    serveFlash: 0,
    lastServed: null,
    elapsed: 0,
    chopHeld: false,
  };
}

// The grill station object lives inside `stations`; keep one reference.
export function wireGrill(game) {
  game.grill = stationById(game.stations, 'grill');
  return game;
}

export function startShift(game) {
  game.state = 'playing';
  game.timeLeft = SHIFT_LENGTH;
  game.score = 0;
  game.coins = 0;
  game.hearts = 3;
  game.orderBoard = createOrderBoard();
  game.plate = { items: [], recipe: null };
  game.board = createBoard();
  game.grill.slots = [null, null];
  game.particles = [];
  game.popups = [];
  game.chef = createChef(640, 560);
  game.serveFlash = 0;
  game.lastServed = null;
  game.elapsed = 0;
  spawnOrder(game.orderBoard, 0);
}

function addPopup(game, x, y, text, color, size = 18) {
  game.popups.push({ x, y, text, color, size, life: 1.4, maxLife: 1.4 });
}

function burstCoins(game, x, y, n = 8) {
  for (let i = 0; i < n; i++) {
    game.particles.push({
      kind: 'coin', x, y,
      vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120,
      size: 5 + Math.random() * 4, life: 0.9, maxLife: 0.9,
    });
  }
}

function puffSteam(game, x, y) {
  game.particles.push({
    kind: 'steam', x: x + (Math.random() - 0.5) * 30, y,
    vx: (Math.random() - 0.5) * 10, vy: -28 - Math.random() * 14,
    size: 5 + Math.random() * 6, life: 0.8, maxLife: 0.8,
  });
}

// --- Interaction -----------------------------------------------------------
// What happens when the chef arrives at a station (click-to-walk) or
// presses E / Space next to one.
export function interactAtStation(game, station) {
  const chef = game.chef;
  const fx = game.fx;
  if (station.kind === 'bin') {
    const ing = INGREDIENTS[station.ingredient];
    if (chef.hands.length >= 2) { fx.error(); addPopup(game, chef.x, chef.y - 60, 'Hands full!', '#e84a3a'); return; }
    chefPickUp(chef, { id: station.ingredient, finished: ing.prep === 'none' });
    fx.pickup();
    return;
  }
  if (station.kind === 'board') {
    const held = chef.hands.find((h) => INGREDIENTS[h.id].prep === 'chop' && !h.finished);
    if (game.board.item) {
      // Take the chopped result back if it is done, else keep chopping.
      return;
    }
    if (held) {
      chefTake(chef, held.id);
      game.board.item = held;
      game.board.progress = 0;
      fx.place();
    } else {
      fx.error();
      addPopup(game, chef.x, chef.y - 60, 'Bring something to chop!', '#e84a3a');
    }
    return;
  }
  if (station.kind === 'grill') {
    const ready = grillReadySlot(game.grill);
    if (ready >= 0) {
      const slot = game.grill.slots[ready];
      game.grill.slots[ready] = null;
      if (slot.state === 'burnt') {
        fx.error();
        addPopup(game, chef.x, chef.y - 60, 'Burnt! Compost it.', '#e84a3a');
        return;
      }
      if (chef.hands.length >= 2) { game.grill.slots[ready] = slot; fx.error(); return; }
      chefPickUp(chef, { id: 'patty', finished: true });
      fx.pickup();
      return;
    }
    const raw = chefHolds(chef, 'patty', false);
    if (raw) {
      const free = grillFreeSlot(game.grill);
      if (free < 0) { fx.error(); return; }
      chefTake(chef, 'patty');
      game.grill.slots[free] = { state: 'cooking', t: 0 };
      fx.place();
      fx.startSizzle();
    } else {
      fx.error();
      addPopup(game, chef.x, chef.y - 60, 'Bring a raw patty!', '#e84a3a');
    }
    return;
  }
  if (station.kind === 'plate') {
    if (chef.hands.length === 0) {
      if (game.plate.items.length > 0) {
        // Take the top item back off the plate.
        const top = game.plate.items.pop();
        chefPickUp(chef, top);
        refreshPlate(game);
        fx.pickup();
      }
      return;
    }
    const item = chef.hands[chef.hands.length - 1];
    if (!item.finished) { fx.error(); addPopup(game, chef.x, chef.y - 60, 'Finish it first!', '#e84a3a'); return; }
    chefTake(chef, item.id);
    game.plate.items.push(item);
    refreshPlate(game);
    fx.place();
    return;
  }
  if (station.kind === 'serve') {
    serveReadyPlate(game);
    return;
  }
  if (station.kind === 'trash') {
    if (chef.hands.length > 0) {
      chefTake(chef);
      fx.place();
      addPopup(game, chef.x, chef.y - 60, 'Composted', '#7ac74f', 14);
    } else if (game.plate.items.length > 0) {
      game.plate.items = [];
      refreshPlate(game);
      fx.place();
    }
    return;
  }
}

// Re-check whether the plated items complete any open ticket.
export function refreshPlate(game) {
  const open = game.orderBoard.orders.map((o) => o.recipe);
  game.plate.recipe = recipeForPlate(game.plate.items.map((i) => i.id), open);
}

export function serveReadyPlate(game) {
  if (!game.plate.recipe) {
    game.fx.error();
    addPopup(game, game.chef.x, game.chef.y - 60, 'No finished dish yet!', '#e84a3a');
    return false;
  }
  const recipe = game.plate.recipe;
  const earned = servePlate(game.orderBoard, recipe);
  if (earned <= 0) {
    game.fx.error();
    addPopup(game, game.chef.x, game.chef.y - 60, 'No ticket wants this!', '#e84a3a');
    return false;
  }
  game.coins += earned;
  game.score += earned * 10;
  game.plate = { items: [], recipe: null };
  game.lastServed = recipe.needs[0];
  game.serveFlash = 1.6;
  const serve = stationById(game.stations, 'serve');
  burstCoins(game, serve.x + serve.w / 2, serve.y + 20, 10);
  addPopup(game, serve.x + serve.w / 2, serve.y - 14, `+${earned} coins!`, '#ffd97a', 22);
  game.fx.ding();
  game.fx.coin();
  return true;
}

// Find the station the chef is standing in front of, if any.
export function chefStation(game) {
  const chef = game.chef;
  for (const st of game.stations) {
    const front = stationFront(st);
    if (Math.hypot(chef.x - front.x, chef.y - front.y) < 70) return st;
  }
  return null;
}

// --- Update ------------------------------------------------------------------
export function updateGame(game, dt) {
  if (game.state !== 'playing') return;
  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.state = 'over';
    game.fx.stopSizzle();
    game.fx.win();
    return;
  }
  chefMove(game.chef, dt, game.keys, FLOOR);

  // Chopping runs while the chef stands at the board; Space speeds it.
  const atBoard = chefStation(game) && chefStation(game).id === 'board';
  const chopBoost = game.chopHeld ? 2.2 : 1;
  if (boardTick(game.board, dt * chopBoost, atBoard)) {
    const done = game.board.item;
    if (chefPickUp(game.chef, { id: done.id, finished: true })) {
      game.board.item = null;
      game.fx.chop();
      addPopup(game, game.chef.x, game.chef.y - 60, `${INGREDIENTS[done.id].name} chopped!`, '#7ac74f', 15);
    }
  }
  grillTick(game.grill, dt);
  const cooking = game.grill.slots.some((s) => s && s.state === 'cooking');
  if (cooking) {
    game.grill.slots.forEach((slot, i) => {
      if (slot && slot.state === 'cooking' && Math.random() < dt * 6) {
        puffSteam(game, 370 + i * 150 + 60, 488);
      }
    });
    game.fx.startSizzle();
  } else {
    game.fx.stopSizzle();
  }

  const expired = orderBoardTick(game.orderBoard, dt, game.elapsed, isRushHour(game.timeLeft));
  for (const order of expired) {
    game.hearts -= 1;
    game.fx.expired();
    addPopup(game, 640, 190, `Order lost: ${order.recipe.name}!`, '#e84a3a', 22);
    if (game.hearts <= 0) {
      game.state = 'over';
      game.fx.stopSizzle();
      return;
    }
  }

  // Particles and popups.
  for (const p of game.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  for (const p of game.popups) {
    p.life -= dt;
    p.y -= 22 * dt;
  }
  game.popups = game.popups.filter((p) => p.life > 0);
  if (game.serveFlash > 0) game.serveFlash -= dt;
}

// --- Draw --------------------------------------------------------------------
export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  // Warm wall above the counters.
  ctx.fillStyle = '#f7e8c8';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawOrderBoard(ctx, game.orderBoard);
  drawKitchen(ctx, game);
  drawParticles(ctx, game.particles);
  drawChef(ctx, game.chef);
  drawPopups(ctx, game.popups);
  drawHUD(ctx, game);
  if (game.state === 'title') drawTitleScreen(ctx, game);
  if (game.state === 'over') drawEndScreen(ctx, game);
}

// --- Boot ----------------------------------------------------------------------
export function bootGame(canvas) {
  const ctx = canvas.getContext('2d');
  const game = wireGrill(createGame());
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');

  // Input: keys.
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    game.keys.add(key);
    if (key === ' ') { game.chopHeld = true; e.preventDefault(); }
    if (key === 'enter' && game.state === 'title') startShift(game);
    if (key === 'r' && game.state === 'over') startShift(game);
    if (key === 'm') game.fx.toggleMute();
    if (key === 'e' && game.state === 'playing') {
      const st = chefStation(game);
      if (st) interactAtStation(game, st);
    }
    if (key === 'q' && game.state === 'playing') serveReadyPlate(game);
    if (key >= '1' && key <= '6' && game.state === 'playing') {
      const ids = ['bread', 'tomato', 'lettuce', 'cheese', 'patty', 'onion'];
      const id = ids[Number(key) - 1];
      const st = stationById(game.stations, `bin-${id}`);
      if (st && chefStation(game) && chefStation(game).id === st.id) interactAtStation(game, st);
    }
  });
  window.addEventListener('keyup', (e) => {
    game.keys.delete(e.key.toLowerCase());
    if (e.key === ' ') game.chopHeld = false;
  });

  // Input: mouse — click a station to walk there and use it; click the
  // floor to walk; click the title/over buttons to start again.
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (VIEW_W / rect.width);
    const y = (e.clientY - rect.top) * (VIEW_H / rect.height);
    game.fx.ensure();
    if (game.state === 'title') {
      if (x >= 520 && x <= 760 && y >= 462 && y <= 510) startShift(game);
      return;
    }
    if (game.state === 'over') {
      if (x >= 520 && x <= 760 && y >= 452 && y <= 498) startShift(game);
      return;
    }
    const st = stationAtPoint(game.stations, x, y);
    if (st) {
      const front = stationFront(st);
      chefSetTarget(game.chef, front.x, front.y, FLOOR);
      game.pendingStation = st;
    } else {
      chefSetTarget(game.chef, x, y, FLOOR);
      game.pendingStation = null;
    }
  });

  // Walk-to interaction: when the chef arrives at the clicked station, use it.
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    updateGame(game, dt);
    if (game.pendingStation && !game.chef.moving) {
      const st = game.pendingStation;
      game.pendingStation = null;
      interactAtStation(game, st);
    }
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }

  if (shot) stageShot(game, shot);
  // Expose the live game for play-testing and debugging.
  window.__game = game;
  requestAnimationFrame(frame);
  return game;
}

// Stage a photo: seed the live state machine into a busy, readable moment.
// The same game state machine, pre-seeded so each photo shows a different
// moment: a busy kitchen, a patty on the grill, a plate ready to serve,
// and the final rush. The game stays fully playable from any of them.
export function stageShot(game, shot) {
  const board = game.orderBoard;
  board.orders = [];
  const pick = (id) => RECIPES.find((r) => r.id === id);
  const add = (id, patienceFrac) => {
    const recipe = pick(id);
    const order = {
      id: board.nextId++, recipe,
      patience: recipe.time * patienceFrac,
      maxPatience: recipe.time, born: game.elapsed,
    };
    board.orders.push(order);
  };
  const grill = game.grill;
  if (shot === 'cover') {
    // The money shot: full board, chopping mid-way, patty on the grill,
    // a burger half-built on the plate, timer mid-shift.
    add('classic-burger', 0.62);
    add('garden-salad', 0.45);
    add('cheesy-melt', 0.8);
    game.timeLeft = 134;
    game.score = 340;
    game.coins = 42;
    game.board.item = { id: 'tomato', finished: false };
    game.board.progress = 0.85;
    // Chef stands just off the board so the chop ring holds mid-chop for the photo.
    game.chef.x = 300; game.chef.y = 620; game.chef.tx = 300; game.chef.ty = 620;
    game.chef.hands = [{ id: 'lettuce', finished: true }];
    grill.slots[0] = { state: 'cooking', t: 4.2 };
    game.plate.items = [
      { id: 'bread', finished: true },
      { id: 'patty', finished: true },
      { id: 'cheese', finished: true },
    ];
    refreshPlate(game);
    addPopup(game, 640, 430, 'Lunch rush is on!', '#2e2118', 20);
  } else if (shot === 'cooking') {
    add('ember-stack', 0.7);
    add('classic-burger', 0.55);
    game.timeLeft = 107;
    game.score = 210;
    game.coins = 26;
    game.board.item = { id: 'lettuce', finished: false };
    game.board.progress = 0.5;
    game.chef.x = 470; game.chef.y = 645; game.chef.tx = 470; game.chef.ty = 645;
    game.chef.hands = [{ id: 'tomato', finished: true }];
    grill.slots[0] = { state: 'cooking', t: 5.1 };
    grill.slots[1] = { state: 'cooked', t: 7.5 };
    puffSteam(game, 430, 488);
    puffSteam(game, 580, 488);
  } else if (shot === 'serve') {
    add('classic-burger', 0.9);
    add('garden-salad', 0.35);
    game.timeLeft = 58;
    game.score = 520;
    game.coins = 64;
    game.chef.x = 1090; game.chef.y = 610; game.chef.tx = 1090; game.chef.ty = 610;
    game.plate.items = [
      { id: 'bread', finished: true },
      { id: 'patty', finished: true },
      { id: 'cheese', finished: true },
      { id: 'lettuce', finished: true },
    ];
    refreshPlate(game);
    game.serveFlash = 999; // hold the served glow for the photo
    game.lastServed = 'bread';
    burstCoins(game, 1094, 500, 10);
    addPopup(game, 1094, 440, '+18 coins!', '#c98a1b', 22);
    addPopup(game, 640, 430, 'Classic Burger ready — ring the bell!', '#2e2118', 20);
  } else if (shot === 'rush') {
    add('ember-stack', 0.22);
    add('classic-burger', 0.4);
    add('garden-salad', 0.18);
    add('crunch-bowl', 0.65);
    game.timeLeft = 32;
    game.score = 780;
    game.coins = 96;
    game.board.item = { id: 'onion', finished: false };
    game.board.progress = 1.0;
    game.chef.x = 800; game.chef.y = 610; game.chef.tx = 800; game.chef.ty = 610;
    game.chef.hands = [{ id: 'patty', finished: true }, { id: 'cheese', finished: true }];
    grill.slots[0] = { state: 'cooked', t: 8.0 };
    game.plate.items = [
      { id: 'bread', finished: true },
      { id: 'patty', finished: true },
    ];
    refreshPlate(game);
    game.orderBoard.combo = 4;
    addPopup(game, 640, 430, 'RUSH HOUR — hold the line!', '#e84a3a', 24);
  }
  game.state = 'playing';
  // Staged callouts linger for the photo instead of fading in 1.4s.
  for (const p of game.popups) { p.life = 3; p.maxLife = 3; }
}
