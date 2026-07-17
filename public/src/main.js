// Kasi Lifestyle — bootstrap.
// Creates the canvas, engine systems, and the game, then starts the loop.

import { GameLoop } from './engine/core/GameLoop.js';
import { Input } from './engine/core/Input.js';
import { UIManager } from './engine/ui/UIManager.js';
import { KasiGame } from './game/KasiGame.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels, stay crisp on retina
  return { w, h };
}

async function boot() {
  const input = new Input(window);
  const ui = new UIManager();
  const game = new KasiGame({ canvas, input, ui });

  const size = fitCanvas();
  game.resize(size.w, size.h);
  window.addEventListener('resize', () => {
    const s = fitCanvas();
    game.resize(s.w, s.h);
  });

  // Optional: load a different map via ?map=<name> (see README).
  const params = new URLSearchParams(window.location.search);
  const mapOverride = params.get('map');
  const mapUrl = mapOverride ? `/data/maps/${mapOverride}.json` : null;

  try {
    await game.load((p) => ui.setLoadingProgress(p), mapUrl);
  } catch (err) {
    console.error(err);
    ui.setLoadingError(`Failed to load: ${err.message}`);
    return;
  }
  ui.hideLoading();

  const loop = new GameLoop({
    update: (dt) => game.update(dt),
    render: () => game.render(),
    step: 1 / 60,
  });
  loop.start();
}

boot();
