// orders.js — the order board: tickets arrive, patience drains, serving a
// matching plate pays coins and builds a combo, and a ticket that runs out
// of patience costs a heart.

import { pickNextRecipe } from './recipes.js';

export const MAX_ORDERS = 4;
export const FIRST_ORDER_DELAY = 1.5;

export function createOrderBoard() {
  return {
    orders: [], // { id, recipe, patience, maxPatience, born }
    nextId: 1,
    spawnIn: FIRST_ORDER_DELAY,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
  };
}

export function spawnOrder(board, now) {
  if (board.orders.length >= MAX_ORDERS) return null;
  const recipe = pickNextRecipe(board.served);
  const order = {
    id: board.nextId++,
    recipe,
    patience: recipe.time,
    maxPatience: recipe.time,
    born: now,
  };
  board.orders.push(order);
  return order;
}

// Advance timers. Returns orders whose patience just hit zero.
export function orderBoardTick(board, dt, now, rush) {
  const expired = [];
  const drain = rush ? 1.35 : 1;
  for (const order of board.orders) {
    order.patience -= dt * drain;
    if (order.patience <= 0) expired.push(order);
  }
  for (const dead of expired) {
    board.orders.splice(board.orders.indexOf(dead), 1);
    board.lost += 1;
    board.combo = 0;
  }
  board.spawnIn -= dt;
  if (board.spawnIn <= 0) {
    const made = spawnOrder(board, now);
    board.spawnIn = made ? Math.max(7, 13 - board.served * 0.4) : 3;
  }
  return expired;
}

// Serve a finished plate. Returns the coins earned, or 0 when no open
// ticket matches the plate.
export function servePlate(board, recipe) {
  const idx = board.orders.findIndex((o) => o.recipe.id === recipe.id);
  if (idx < 0) return 0;
  const order = board.orders[idx];
  board.orders.splice(idx, 1);
  board.served += 1;
  board.combo += 1;
  board.bestCombo = Math.max(board.bestCombo, board.combo);
  const patienceBonus = Math.round((order.patience / order.maxPatience) * 6);
  const comboBonus = Math.min(board.combo - 1, 5) * 2;
  return recipe.price + patienceBonus + comboBonus;
}

// Rush hour: the last 45 seconds of a shift, when tickets drain faster.
export function isRushHour(timeLeft) {
  return timeLeft <= 45 && timeLeft > 0;
}
