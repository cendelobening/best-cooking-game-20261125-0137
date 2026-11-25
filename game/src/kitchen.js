// kitchen.js — the floor plan of Ember & Thyme: every counter, bin, board,
// grill and window, where it sits, what it does, and the grill/board
// timers that turn raw ingredients into finished ones.

import { INGREDIENTS } from './recipes.js';

export const FLOOR = { x: 24, y: 300, w: 1232, h: 392 };
export const COUNTER_Y = 196;
export const COUNTER_H = 104;

// Stations are rectangles the chef walks up to. `kind` decides the action.
export function buildKitchen() {
  const stations = [];
  const binW = 118, binGap = 26;
  const binIds = ['bread', 'tomato', 'lettuce', 'cheese', 'patty', 'onion'];
  let x = 48;
  for (const id of binIds) {
    stations.push({
      id: `bin-${id}`, kind: 'bin', ingredient: id,
      x, y: COUNTER_Y, w: binW, h: COUNTER_H,
      label: INGREDIENTS[id].name, key: INGREDIENTS[id].key,
    });
    x += binW + binGap;
  }
  stations.push({
    id: 'board', kind: 'board', x: 48, y: 470, w: 240, h: 110,
    label: 'Chopping Board',
  });
  stations.push({
    id: 'grill', kind: 'grill', x: 340, y: 470, w: 300, h: 110,
    label: 'Ember Grill', slots: [null, null],
  });
  stations.push({
    id: 'plate', kind: 'plate', x: 690, y: 470, w: 240, h: 110,
    label: 'Plating Counter',
  });
  stations.push({
    id: 'serve', kind: 'serve', x: 980, y: 470, w: 228, h: 110,
    label: 'Serve Window',
  });
  stations.push({
    id: 'trash', kind: 'trash', x: 48, y: 612, w: 150, h: 64,
    label: 'Compost',
  });
  return stations;
}

export function stationById(stations, id) {
  return stations.find((s) => s.id === id) || null;
}

// The spot the chef stands on to use a station (its front edge, floor side).
export function stationFront(station) {
  return {
    x: station.x + station.w / 2,
    y: station.y + station.h + 26,
  };
}

export function stationAtPoint(stations, px, py) {
  for (let i = stations.length - 1; i >= 0; i--) {
    const s = stations[i];
    if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return s;
  }
  return null;
}

// --- Chopping board -------------------------------------------------------
// One item at a time. chopping runs while the chef stands at the board;
// `tick` advances it and returns true the moment the chop finishes.
export function createBoard() {
  return { item: null, progress: 0, needed: 1.4 };
}

export function boardTick(board, dt, chefPresent) {
  if (!board.item || !chefPresent) return false;
  board.progress += dt;
  if (board.progress >= board.needed) {
    board.progress = 0;
    return true;
  }
  return false;
}

// --- Ember grill ----------------------------------------------------------
// Two slots. A raw patty cooks in COOK_TIME, then stays good until
// BURN_TIME, after which it is burnt and must be binned.
export const GRILL_COOK_TIME = 6;
export const GRILL_BURN_TIME = 11;

export function grillTick(grill, dt) {
  for (const slot of grill.slots) {
    if (slot && slot.state === 'cooking') {
      slot.t += dt;
      if (slot.t >= GRILL_COOK_TIME) slot.state = 'cooked';
    } else if (slot && slot.state === 'cooked') {
      slot.t += dt;
      if (slot.t >= GRILL_BURN_TIME) slot.state = 'burnt';
    }
  }
}

export function grillFreeSlot(grill) {
  return grill.slots.findIndex((s) => s === null);
}

export function grillReadySlot(grill) {
  return grill.slots.findIndex((s) => s && (s.state === 'cooked' || s.state === 'burnt'));
}
