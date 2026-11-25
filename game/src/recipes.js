// recipes.js — the menu of Ember & Thyme: every ingredient and every dish
// the kitchen can serve. Ingredients carry their prep rules (chop, grill,
// or ready as-is); recipes list the exact plate that fills an order ticket.

export const INGREDIENTS = {
  bread:   { name: 'Bread',   color: '#e8b96a', dark: '#b57e2e', prep: 'none',  key: '1', blurb: 'toasted bun' },
  tomato:  { name: 'Tomato',  color: '#e84a3a', dark: '#a92c20', prep: 'chop',  key: '2', blurb: 'sliced' },
  lettuce: { name: 'Lettuce', color: '#7ac74f', dark: '#4a8c2c', prep: 'chop',  key: '3', blurb: 'shredded' },
  cheese:  { name: 'Cheese',  color: '#f7c948', dark: '#c9931a', prep: 'none',  key: '4', blurb: 'melted slice' },
  patty:   { name: 'Patty',   color: '#8a5a3b', dark: '#5d3a24', prep: 'grill', key: '5', blurb: 'seared' },
  onion:   { name: 'Onion',   color: '#efe3f2', dark: '#b9a3c4', prep: 'chop',  key: '6', blurb: 'rings' },
};

// A dish is done when its plate holds exactly these ingredient ids
// (each in its finished, prepped state). `price` is the coin reward.
export const RECIPES = [
  {
    id: 'garden-salad', name: 'Garden Salad', price: 12, time: 50,
    needs: ['tomato', 'lettuce', 'onion'],
    tag: 'Fresh & crunchy',
  },
  {
    id: 'classic-burger', name: 'Classic Burger', price: 18, time: 55,
    needs: ['bread', 'patty', 'cheese', 'lettuce'],
    tag: 'The house favourite',
  },
  {
    id: 'cheesy-melt', name: 'Cheesy Melt', price: 15, time: 45,
    needs: ['bread', 'cheese', 'tomato'],
    tag: 'Golden & gooey',
  },
  {
    id: 'ember-stack', name: 'Ember Stack', price: 24, time: 65,
    needs: ['bread', 'patty', 'patty', 'cheese', 'onion'],
    tag: 'Double trouble',
  },
  {
    id: 'crunch-bowl', name: 'Crunch Bowl', price: 14, time: 45,
    needs: ['lettuce', 'tomato', 'cheese'],
    tag: 'Light but loud',
  },
];


// Look a recipe up by id.
export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Does a plate (array of finished ingredient ids) exactly match a recipe?
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.needs].sort();
  return have.every((ing, i) => ing === want[i]);
}

// Which open recipe, if any, does this plate complete?
export function recipeForPlate(plate, openRecipes) {
  for (const recipe of openRecipes) {
    if (plateMatchesRecipe(plate, recipe)) return recipe;
  }
  return null;
}

// Pick the next order, weighted so early shifts favour quick dishes.
export function pickNextRecipe(servedCount) {
  const pool = servedCount < 2
    ? RECIPES.filter((r) => r.needs.length <= 3)
    : RECIPES;
  return pool[Math.floor(Math.random() * pool.length)];
}
