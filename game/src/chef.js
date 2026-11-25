// chef.js — the cook of Ember & Thyme: movement (keys and click-to-walk),
// the two hands they carry things in, and the little walk bob that makes
// them feel alive.

export const CHEF_SPEED = 340; // px per second
export const CHEF_RADIUS = 20;

export function createChef(x, y) {
  return {
    x, y, tx: x, ty: y, // target for click-to-walk
    moving: false, face: 1, // 1 right, -1 left
    walkPhase: 0,
    hands: [], // up to 2 carried items: { id, finished }
    atStation: null, // station id the chef is standing at
  };
}

export function chefSetTarget(chef, x, y, floor) {
  chef.tx = Math.max(floor.x + CHEF_RADIUS, Math.min(floor.x + floor.w - CHEF_RADIUS, x));
  chef.ty = Math.max(floor.y + CHEF_RADIUS, Math.min(floor.y + floor.h - CHEF_RADIUS, y));
  chef.moving = true;
}

export function chefMove(chef, dt, keys, floor) {
  let dx = 0, dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (dx !== 0 || dy !== 0) {
    chef.moving = true;
    const len = Math.hypot(dx, dy);
    chef.x += (dx / len) * CHEF_SPEED * dt;
    chef.y += (dy / len) * CHEF_SPEED * dt;
    if (dx !== 0) chef.face = dx > 0 ? 1 : -1;
    chef.tx = chef.x; chef.ty = chef.y;
  } else if (chef.moving) {
    const dx2 = chef.tx - chef.x, dy2 = chef.ty - chef.y;
    const dist = Math.hypot(dx2, dy2);
    const step = CHEF_SPEED * dt;
    if (dist <= step) {
      chef.x = chef.tx; chef.y = chef.ty; chef.moving = false;
    } else {
      chef.x += (dx2 / dist) * step;
      chef.y += (dy2 / dist) * step;
      if (dx2 !== 0) chef.face = dx2 > 0 ? 1 : -1;
    }
  }
  chef.x = Math.max(floor.x + CHEF_RADIUS, Math.min(floor.x + floor.w - CHEF_RADIUS, chef.x));
  chef.y = Math.max(floor.y + CHEF_RADIUS, Math.min(floor.y + floor.h - CHEF_RADIUS, chef.y));
  if (chef.moving) chef.walkPhase += dt * 11;
}

// Hands --------------------------------------------------------------------
export function chefCanCarry(chef) {
  return chef.hands.length < 2;
}

export function chefPickUp(chef, item) {
  if (!chefCanCarry(chef)) return false;
  chef.hands.push(item);
  return true;
}

// Take the first carried item with this id (or the top one if id is null).
export function chefTake(chef, id = null) {
  const i = id === null ? chef.hands.length - 1
    : chef.hands.findIndex((h) => h.id === id);
  if (i < 0) return null;
  return chef.hands.splice(i, 1)[0];
}

export function chefHolds(chef, id, finished = null) {
  return chef.hands.some((h) => h.id === id && (finished === null || h.finished === finished));
}

export function chefHeldIds(chef) {
  return chef.hands.map((h) => h.id);
}
