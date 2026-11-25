// render.js — everything the eye sees in Ember & Thyme: the tiled kitchen
// floor, the wooden counters and ingredient bins, food drawn piece by
// piece so it looks worth serving, the chef, the order tickets, the shift
// timer and the floating score popups. All art is canvas vector drawing.

import { INGREDIENTS } from './recipes.js';
import { GRILL_COOK_TIME, GRILL_BURN_TIME } from './kitchen.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'center', font = 'Georgia, serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Food art ------------------------------------------------------------
// Draw one ingredient centred at (x, y) with radius r. `finished` means
// chopped / grilled / ready to plate; raw items look raw.
export function drawIngredient(ctx, id, x, y, r, finished = false) {
  ctx.save();
  ctx.translate(x, y);
  const ing = INGREDIENTS[id];
  if (!ing) { ctx.restore(); return; }
  if (id === 'bread') {
    // Golden bun dome with sesame seeds.
    ctx.fillStyle = '#c98a3d';
    rr(ctx, -r, -r * 0.25, r * 2, r * 0.9, r * 0.45); ctx.fill();
    ctx.fillStyle = '#f0c078';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.2, r, r * 0.72, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3cf';
    for (const [sx, sy] of [[-0.45, -0.55], [0.1, -0.75], [0.5, -0.45], [-0.05, -0.35]]) {
      ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0.4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'tomato') {
    if (finished) {
      // Three glossy slices.
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = '#e84a3a';
        ctx.beginPath(); ctx.arc(i * r * 0.62, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f28a7d';
        ctx.beginPath(); ctx.arc(i * r * 0.62, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd9d2';
        ctx.beginPath(); ctx.arc(i * r * 0.62 - r * 0.1, -r * 0.1, r * 0.08, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#d63c2c';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e84a3a';
      ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.15, r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb3a7';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.4, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a8c2c';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.95, r * 0.22, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    if (finished) {
      ctx.fillStyle = '#5da83a';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.42, r * 0.26, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8ed35f';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#4a8c2c';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7ac74f';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.55, r * 0.4, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#a8e07e';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#e8a91c';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7); ctx.lineTo(r, r * 0.7); ctx.lineTo(r * 0.15, -r * 0.85); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.55); ctx.lineTo(r * 0.8, r * 0.55); ctx.lineTo(r * 0.12, -r * 0.7); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a91c';
    for (const [hx, hy] of [[-0.3, 0.25], [0.35, 0.1], [0.05, -0.35]]) {
      ctx.beginPath(); ctx.arc(hx * r, hy * r, r * 0.11, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    const base = finished === 'burnt' ? '#2b1a12' : finished ? '#6e4426' : '#a9765a';
    const top = finished === 'burnt' ? '#4a2c1c' : finished ? '#8a5a3b' : '#c08a68';
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = top;
    ctx.beginPath(); ctx.ellipse(0, -r * 0.08, r * 0.88, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    if (finished && finished !== 'burnt') {
      ctx.strokeStyle = '#4a2c17'; ctx.lineWidth = r * 0.09;
      for (const gx of [-0.45, 0, 0.45]) {
        ctx.beginPath(); ctx.moveTo(gx * r, -r * 0.35); ctx.lineTo(gx * r, r * 0.3); ctx.stroke();
      }
    }
    if (finished === 'burnt') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'onion') {
    if (finished) {
      ctx.strokeStyle = '#d9c2e0'; ctx.lineWidth = r * 0.16;
      for (const rad of [0.85, 0.55, 0.28]) {
        ctx.beginPath(); ctx.arc(0, 0, r * rad, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = '#b9a3c4'; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = '#c9b3d4';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#efe3f2';
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.1, r * 0.78, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b9a3c4'; ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0.4, Math.PI * 1.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0.6, Math.PI * 1.5); ctx.stroke();
      ctx.fillStyle = '#7ac74f';
      ctx.beginPath(); ctx.ellipse(r * 0.45, -r * 0.85, r * 0.3, r * 0.12, 0.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// --- The kitchen ------------------------------------------------------------
export function drawKitchen(ctx, game) {
  const { stations, board, grill, plate } = game;
  // Floor: warm checker tiles.
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#f3e2c2' : '#ecd3a8';
      ctx.fillRect(24 + tx * 154, 300 + ty * 98, 154, 98);
    }
  }
  ctx.strokeStyle = 'rgba(120,80,30,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 300, 1232, 392);

  // Back wall band behind the bins.
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(24, 178, 1232, 122);
  ctx.fillStyle = '#8a5a35';
  for (let x = 24; x < 1256; x += 44) ctx.fillRect(x, 178, 22, 122);

  for (const st of stations) {
    if (st.kind === 'bin') drawBin(ctx, st);
    else if (st.kind === 'board') drawBoard(ctx, st, board);
    else if (st.kind === 'grill') drawGrill(ctx, st, grill);
    else if (st.kind === 'plate') drawPlating(ctx, st, plate, game);
    else if (st.kind === 'serve') drawServeWindow(ctx, st, game);
    else if (st.kind === 'trash') drawTrash(ctx, st);
  }
}

function counterTop(ctx, st, base, edge) {
  ctx.fillStyle = edge;
  rr(ctx, st.x - 4, st.y - 6, st.w + 8, st.h + 12, 12); ctx.fill();
  ctx.fillStyle = base;
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
}

function drawBin(ctx, st) {
  counterTop(ctx, st, '#a9713f', '#7c4f27');
  // Crate of the ingredient, piled high.
  drawIngredient(ctx, st.ingredient, st.x + st.w / 2, st.y + st.h / 2 - 6, 30, false);
  drawIngredient(ctx, st.ingredient, st.x + st.w / 2 - 26, st.y + st.h / 2 + 12, 18, false);
  drawIngredient(ctx, st.ingredient, st.x + st.w / 2 + 28, st.y + st.h / 2 + 12, 18, false);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, st.x + 8, st.y + st.h - 26, st.w - 16, 20, 6); ctx.fill();
  text(ctx, st.label, st.x + st.w / 2, st.y + st.h - 15, 13, '#fff', '700');
  // Hotkey chip.
  ctx.fillStyle = '#2e2118';
  ctx.beginPath(); ctx.arc(st.x + st.w - 14, st.y + 14, 11, 0, Math.PI * 2); ctx.fill();
  text(ctx, st.key, st.x + st.w - 14, st.y + 15, 12, '#ffd97a', '800');
}

function drawBoard(ctx, st, board) {
  counterTop(ctx, st, '#b98a56', '#8a5f33');
  ctx.fillStyle = '#e8d5ae';
  rr(ctx, st.x + 18, st.y + 14, st.w - 36, st.h - 44, 8); ctx.fill();
  ctx.strokeStyle = '#c9ad7d'; ctx.lineWidth = 2;
  rr(ctx, st.x + 18, st.y + 14, st.w - 36, st.h - 44, 8); ctx.stroke();
  if (board.item) {
    drawIngredient(ctx, board.item.id, st.x + st.w / 2, st.y + st.h / 2 - 8, 30, false);
    // Chop progress ring.
    const p = board.progress / board.needed;
    ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + st.h / 2 - 8, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#e8a91c';
    ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + st.h / 2 - 8, 44, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    text(ctx, 'CHOPPING…', st.x + st.w / 2, st.y + st.h - 16, 12, '#5d3a24', '800');
  } else {
    text(ctx, '🔪', st.x + st.w / 2, st.y + st.h / 2 - 10, 30, '#fff');
    text(ctx, 'Chopping Board', st.x + st.w / 2, st.y + st.h - 16, 13, '#fff', '700');
  }
}

function drawGrill(ctx, st, grill) {
  counterTop(ctx, st, '#3d3a38', '#232120');
  // Two grill grates, glowing when hot.
  grill.slots.forEach((slot, i) => {
    const gx = st.x + 30 + i * 150, gy = st.y + 18, gw = 120, gh = 58;
    const hot = slot !== null;
    ctx.fillStyle = hot ? '#5a2e1a' : '#2a2725';
    rr(ctx, gx, gy, gw, gh, 8); ctx.fill();
    ctx.strokeStyle = hot ? '#ff8c42' : '#55504c'; ctx.lineWidth = 3;
    for (let lx = gx + 12; lx < gx + gw - 6; lx += 14) {
      ctx.beginPath(); ctx.moveTo(lx, gy + 6); ctx.lineTo(lx, gy + gh - 6); ctx.stroke();
    }
    if (slot) {
      const state = slot.state === 'burnt' ? 'burnt' : slot.state === 'cooked' ? true : false;
      drawIngredient(ctx, 'patty', gx + gw / 2, gy + gh / 2, 26, state);
      // Cook progress bar.
      const frac = slot.state === 'cooking'
        ? slot.t / GRILL_COOK_TIME
        : slot.state === 'cooked'
          ? 1 - (slot.t - GRILL_COOK_TIME) / (GRILL_BURN_TIME - GRILL_COOK_TIME)
          : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      rr(ctx, gx + 8, gy + gh - 12, gw - 16, 7, 3); ctx.fill();
      ctx.fillStyle = slot.state === 'burnt' ? '#888' : slot.state === 'cooked' ? '#ffb347' : '#ff8c42';
      rr(ctx, gx + 8, gy + gh - 12, (gw - 16) * Math.max(0, Math.min(1, frac)), 7, 3); ctx.fill();
      if (slot.state === 'cooked') text(ctx, 'READY!', gx + gw / 2, gy - 6, 11, '#ffd97a', '800');
      if (slot.state === 'burnt') text(ctx, 'BURNT!', gx + gw / 2, gy - 6, 11, '#ff6b5e', '800');
    }
  });
  text(ctx, 'Ember Grill', st.x + st.w / 2, st.y + st.h - 14, 13, '#ffd9a0', '700');
}

function drawPlating(ctx, st, plate, game) {
  const ready = plate.recipe !== null;
  counterTop(ctx, st, ready ? '#2f7a4a' : '#c8b18a', ready ? '#1e5232' : '#8a6f45');
  // The white plate.
  ctx.fillStyle = '#fdfbf6';
  ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + st.h / 2 - 4, 78, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8cfc0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + st.h / 2 - 4, 78, 34, 0, 0, Math.PI * 2); ctx.stroke();
  // Plated ingredients, stacked as a little dish.
  plate.items.forEach((item, i) => {
    drawIngredient(ctx, item.id, st.x + st.w / 2 + (i - (plate.items.length - 1) / 2) * 34,
      st.y + st.h / 2 - 8 - i * 7, 17, true);
  });
  if (plate.items.length === 0) {
    text(ctx, 'Plating Counter', st.x + st.w / 2, st.y + st.h / 2 - 4, 13, '#6b543a', '700');
  }
  if (ready) {
    text(ctx, `✓ ${plate.recipe.name} — READY TO SERVE`, st.x + st.w / 2, st.y + st.h - 14, 13, '#eafff0', '800');
  } else if (plate.items.length > 0) {
    text(ctx, 'Keep building…', st.x + st.w / 2, st.y + st.h - 14, 12, '#5d4a2e', '700');
  }
}

function drawServeWindow(ctx, st, game) {
  counterTop(ctx, st, '#7a4a2b', '#5d3418');
  // Window frame and warm light from the dining room.
  ctx.fillStyle = '#ffe9b8';
  rr(ctx, st.x + 16, st.y + 12, st.w - 32, st.h - 52, 8); ctx.fill();
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(st.x + st.w / 2 - 3, st.y + 12, 6, st.h - 52);
  ctx.fillRect(st.x + 16, st.y + st.h / 2 - 20, st.w - 32, 6);
  // A served plate waiting in the window glows.
  if (game.serveFlash > 0) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + st.h / 2 - 8, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
    if (game.lastServed) drawIngredient(ctx, game.lastServed, st.x + st.w / 2, st.y + st.h / 2 - 12, 18, true);
    text(ctx, 'SERVED!', st.x + st.w / 2, st.y + st.h - 16, 15, '#fff', '800');
  } else {
    text(ctx, '🔔', st.x + st.w / 2, st.y + st.h / 2 - 14, 30, '#5d3418');
    text(ctx, 'Serve Window', st.x + st.w / 2, st.y + st.h - 16, 13, '#ffe9b8', '700');
  }
}

function drawTrash(ctx, st) {
  ctx.fillStyle = '#4a6b3a';
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
  ctx.fillStyle = '#33502a';
  rr(ctx, st.x + 8, st.y + 6, st.w - 16, 12, 5); ctx.fill();
  text(ctx, '🗑 Compost', st.x + st.w / 2, st.y + st.h / 2 + 12, 14, '#eafff0', '700');
}

// --- The chef ---------------------------------------------------------------
export function drawChef(ctx, chef) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  const x = chef.x, y = chef.y + bob * 0.3;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 22, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2f7a78';
  rr(ctx, -16, -6, 32, 28, 10); ctx.fill();
  ctx.fillStyle = '#fdfbf6';
  rr(ctx, -12, -2, 24, 24, 8); ctx.fill();
  ctx.fillStyle = '#e8a91c';
  ctx.fillRect(-12, 6, 24, 3);
  // Head and toque.
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fdfbf6';
  ctx.beginPath(); ctx.arc(-7, -30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -33, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -32, 22, 8);
  // Face.
  ctx.fillStyle = '#2e2118';
  ctx.beginPath(); ctx.arc(-4.5 * chef.face, -18, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4.5 * chef.face, -18, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2e2118'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -15, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  // Arms.
  ctx.strokeStyle = '#2f7a78'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  const swing = chef.moving ? Math.sin(chef.walkPhase) * 6 : 0;
  ctx.beginPath(); ctx.moveTo(-13, 2); ctx.lineTo(-20, 12 + swing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13, 2); ctx.lineTo(20, 12 - swing); ctx.stroke();
  // Carried ingredients float above the toque.
  chef.hands.forEach((item, i) => {
    const hx = (i - (chef.hands.length - 1) / 2) * 26;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(hx, -48, 14, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, item.id, hx, -48, 10, item.finished);
  });
  ctx.restore();
}

// --- Order board and HUD ----------------------------------------------------
export function drawOrderBoard(ctx, board) {
  // Board header.
  ctx.fillStyle = '#2e2118';
  rr(ctx, 24, 66, 1232, 104, 12); ctx.fill();
  ctx.fillStyle = '#3d2c1e';
  rr(ctx, 28, 70, 1232 - 8, 96, 10); ctx.fill();
  text(ctx, '📋 ORDER BOARD', 48, 88, 15, '#ffd97a', '800', 'left');
  text(ctx, 'serve the ticket before its patience runs out', 190, 88, 12, '#cbb693', '400', 'left');
  if (board.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is on its way…', 640, 132, 15, '#cbb693', '600');
    return;
  }
  board.orders.forEach((order, i) => {
    drawTicket(ctx, order, 48 + i * 300, 100, 282, 58);
  });
}

function drawTicket(ctx, order, x, y, w, h) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.3;
  ctx.fillStyle = urgent ? '#fff0e8' : '#fffaf0';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = urgent ? '#e84a3a' : '#d8c9a8';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 8); ctx.stroke();
  text(ctx, order.recipe.name, x + 10, y + 14, 15, '#2e2118', '800', 'left');
  text(ctx, `$${order.recipe.price}`, x + w - 10, y + 14, 15, '#b57e2e', '800', 'right');
  // Needed ingredients as little icons.
  order.recipe.needs.forEach((id, i) => {
    drawIngredient(ctx, id, x + 24 + i * 34, y + 38, 12, true);
  });
  // Patience bar.
  ctx.fillStyle = '#e8ddc8';
  rr(ctx, x + 10, y + h - 12, w - 20, 7, 3); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7ac74f' : frac > 0.3 ? '#f7c948' : '#e84a3a';
  rr(ctx, x + 10, y + h - 12, (w - 20) * frac, 7, 3); ctx.fill();
}

export function drawHUD(ctx, game) {
  const { timeLeft, score, coins, hearts, orderBoard } = game;
  // Top bar.
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, VIEW_W, 58);
  ctx.fillStyle = '#e8a91c';
  ctx.fillRect(0, 58, VIEW_W, 4);
  text(ctx, '🍳 EMBER & THYME', 24, 30, 22, '#ffd97a', '800', 'left');
  text(ctx, 'Rush Hour Kitchen', 330, 32, 13, '#cbb693', '600', 'left');
  // Shift timer — big, and it turns red in the rush.
  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.floor(Math.max(0, timeLeft) % 60);
  const timerText = `${mins}:${secs.toString().padStart(2, '0')}`;
  const rush = timeLeft <= 45 && timeLeft > 0;
  ctx.fillStyle = rush ? '#e84a3a' : '#3d2c1e';
  rr(ctx, 560, 8, 160, 42, 10); ctx.fill();
  text(ctx, `⏱ ${timerText}`, 640, 30, 24, rush ? '#fff' : '#ffd97a', '800');
  text(ctx, `⭐ ${score}`, 800, 30, 20, '#fff', '800', 'left');
  text(ctx, `🪙 ${coins}`, 920, 30, 20, '#ffd97a', '800', 'left');
  text(ctx, `Combo ×${orderBoard.combo}`, 1040, 30, 16, orderBoard.combo >= 3 ? '#7ac74f' : '#cbb693', '800', 'left');
  // Hearts.
  for (let i = 0; i < 3; i++) {
    text(ctx, i < hearts ? '❤️' : '🖤', 1180 + i * 30, 30, 18, '#fff');
  }
  // Hint line at the bottom.
  text(ctx, 'Click a station to walk there  •  1–6 grab ingredients  •  E interact  •  Space chop faster  •  Q serve  •  M mute',
    640, 706, 12, '#8a6f45', '600');
}

// --- Particles and popups ---------------------------------------------------
export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    if (p.kind === 'steam') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'coin') {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b57e2e';
      text(ctx, '$', p.x, p.y + 1, p.size + 4, '#b57e2e', '800');
    } else if (p.kind === 'spark') {
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawPopups(ctx, popups) {
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    text(ctx, p.text, p.x, p.y, p.size, p.color, '800');
    ctx.globalAlpha = 1;
  }
}

// --- Screens ------------------------------------------------------------------
export function drawTitleScreen(ctx, game) {
  ctx.fillStyle = 'rgba(30,18,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fffaf0';
  rr(ctx, 340, 130, 600, 400, 18); ctx.fill();
  ctx.strokeStyle = '#e8a91c'; ctx.lineWidth = 4;
  rr(ctx, 340, 130, 600, 400, 18); ctx.stroke();
  text(ctx, '🍳', 640, 200, 64, '#fff');
  text(ctx, 'EMBER & THYME', 640, 268, 44, '#2e2118', '800');
  text(ctx, 'Rush Hour Kitchen', 640, 308, 22, '#b57e2e', '700');
  text(ctx, 'Tickets fly in. Chop it, grill it, plate it, serve it', 640, 348, 16, '#5d4a2e', '600');
  text(ctx, '— before the patience bar runs dry.', 640, 372, 16, '#5d4a2e', '600');
  text(ctx, 'Click a station to walk there, or steer with WASD / arrows.', 640, 408, 14, '#8a6f45', '600');
  text(ctx, '1–6 grab ingredients  •  E interact  •  Space chop  •  Q serve', 640, 432, 14, '#8a6f45', '600');
  ctx.fillStyle = '#e8a91c';
  rr(ctx, 520, 462, 240, 48, 12); ctx.fill();
  text(ctx, '▶  START SHIFT  (Enter)', 640, 487, 18, '#2e2118', '800');
  text(ctx, '3-minute shift  •  3 hearts  •  combos pay extra', 640, 540 - 8, 13, '#8a6f45', '600');
}

export function drawEndScreen(ctx, game) {
  ctx.fillStyle = 'rgba(30,18,10,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fffaf0';
  rr(ctx, 360, 150, 560, 380, 18); ctx.fill();
  ctx.strokeStyle = '#e8a91c'; ctx.lineWidth = 4;
  rr(ctx, 360, 150, 560, 380, 18); ctx.stroke();
  const win = game.score >= 150;
  text(ctx, win ? '🏆 SHIFT COMPLETE!' : '⏰ SHIFT OVER', 640, 216, 36, '#2e2118', '800');
  text(ctx, win ? 'The lunch crowd leaves happy.' : 'The crowd thins out… next shift, chef!', 640, 256, 16, '#5d4a2e', '600');
  text(ctx, `Score  ${game.score}`, 640, 316, 24, '#2e2118', '800');
  text(ctx, `Coins earned  🪙 ${game.coins}`, 640, 352, 20, '#b57e2e', '800');
  text(ctx, `Dishes served  ${game.board.served}   •   Best combo ×${game.board.bestCombo}`, 640, 388, 17, '#5d4a2e', '700');
  text(ctx, `Orders lost  ${game.board.lost}`, 640, 418, 17, '#5d4a2e', '700');
  ctx.fillStyle = '#e8a91c';
  rr(ctx, 520, 452, 240, 46, 12); ctx.fill();
  text(ctx, '↻  PLAY AGAIN  (R)', 640, 476, 18, '#2e2118', '800');
}
