/* NELSON CALDEIRA — motor de arte generativa (vanilla JS, sem dependências) */
"use strict";

/* ---------- utilidades ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETAS = [
  ["#d8ff3e", "#ff3ea5", "#3ec9ff", "#f2f0e9"],
  ["#ff5c00", "#ffe600", "#00e0a4", "#f2f0e9"],
  ["#b537f2", "#ff3ea5", "#3ec9ff", "#0a0a0a"],
  ["#f2f0e9", "#d8ff3e", "#8a8a8a", "#ff3ea5"],
];

const TITULOS = [
  "SISTEMA AUTÔNOMO Nº", "FRAGMENTO DE MÁQUINA", "ECO SINTÉTICO",
  "RITMO IMPOSSÍVEL", "DERIVA COMPUTACIONAL", "PAISAGEM DE ERRO",
];

function novaSemente() { return Math.floor(Math.random() * 1e9); }

function dimensoesCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(r.width * dpr));
  canvas.height = Math.max(1, Math.floor(r.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

/* ---------- 1. campo de fluxo (flow field) ---------- */
function desenharFlow(canvas, seed) {
  const rnd = mulberry32(seed);
  const { ctx, w, h } = dimensoesCanvas(canvas);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const anguloBase = rnd() * Math.PI * 2;
  const escala = 0.004 + rnd() * 0.006;
  const particulas = 900 + Math.floor(rnd() * 600);

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < particulas; i++) {
    let x = rnd() * w, y = rnd() * h;
    const cor = paleta[Math.floor(rnd() * paleta.length)];
    ctx.strokeStyle = cor;
    ctx.globalAlpha = 0.25 + rnd() * 0.5;
    ctx.lineWidth = 0.6 + rnd() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const passos = 20 + Math.floor(rnd() * 60);
    for (let s = 0; s < passos; s++) {
      const a = Math.sin(x * escala + anguloBase) * 2 + Math.cos(y * escala * 1.3) * 2;
      x += Math.cos(a) * 2.4;
      y += Math.sin(a) * 2.4;
      ctx.lineTo(x, y);
      if (x < 0 || x > w || y < 0 || y > h) break;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- 2. truchet com ruído ---------- */
function desenharTruchet(canvas, seed) {
  const rnd = mulberry32(seed);
  const { ctx, w, h } = dimensoesCanvas(canvas);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const tam = 26 + Math.floor(rnd() * 22);

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  for (let y = -tam; y < h + tam; y += tam) {
    for (let x = -tam; x < w + tam; x += tam) {
      const r = rnd();
      ctx.strokeStyle = paleta[Math.floor(rnd() * paleta.length)];
      ctx.lineWidth = 2 + rnd() * 4;
      ctx.beginPath();
      if (r < 0.5) {
        ctx.arc(x, y, tam, 0, Math.PI / 2);
        ctx.arc(x + tam, y + tam, tam, Math.PI, Math.PI * 1.5);
      } else {
        ctx.arc(x + tam, y, tam, Math.PI / 2, Math.PI);
        ctx.arc(x, y + tam, tam, Math.PI * 1.5, Math.PI * 2);
      }
      ctx.stroke();
    }
  }
}

/* ---------- 3. órbitas sísmicas ---------- */
function desenharOrbitas(canvas, seed) {
  const rnd = mulberry32(seed);
  const { ctx, w, h } = dimensoesCanvas(canvas);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const cx = w / 2, cy = h / 2;
  const corpos = 4 + Math.floor(rnd() * 5);

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < corpos; i++) {
    const raio = (0.12 + i * 0.09) * Math.min(w, h) * (0.8 + rnd() * 0.4);
    const vel = (rnd() - 0.5) * 0.05;
    const fase = rnd() * Math.PI * 2;
    const cor = paleta[i % paleta.length];
    ctx.strokeStyle = cor;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.04) {
      const wobble = Math.sin(a * (3 + i) + fase) * raio * 0.08;
      const rr = raio + wobble;
      const px = cx + Math.cos(a + fase) * rr;
      const py = cy + Math.sin(a + fase) * rr * (0.7 + rnd() * 0.0);
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    const ang = fase + vel * 100;
    ctx.fillStyle = cor;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio * 0.85, 3 + rnd() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------- 4. terreno de ruído ---------- */
function desenharRuido(canvas, seed) {
  const rnd = mulberry32(seed);
  const { ctx, w, h } = dimensoesCanvas(canvas);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const cols = 90, linhas = 90;
  const cw = w / cols, ch = h / linhas;
  const ruido = new Float32Array((cols + 1) * (linhas + 1));
  for (let i = 0; i < ruido.length; i++) ruido[i] = rnd();

  function valorSuave(gx, gy) {
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    const i = (yy, xx) => ruido[Math.min(linhas, yy) * (cols + 1) + Math.min(cols, xx)];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = i(y0, x0) + (i(y0, x0 + 1) - i(y0, x0)) * sx;
    const b = i(y0 + 1, x0) + (i(y0 + 1, x0 + 1) - i(y0 + 1, x0)) * sx;
    return a + (b - a) * sy;
  }

  const img = ctx.createImageData(w, h);
  const dados = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0, amp = 1, freq = 1, soma = 0;
      for (let o = 0; o < 4; o++) {
        v += valorSuave((x / w) * cols * freq, (y / h) * linhas * freq) * amp;
        soma += amp; amp *= 0.5; freq *= 2;
      }
      v /= soma;
      const idx = (y * w + x) * 4;
      const paletaIdx = Math.min(paleta.length - 1, Math.floor(v * paleta.length));
      const hex = paleta[paletaIdx];
      dados[idx] = parseInt(hex.slice(1, 3), 16);
      dados[idx + 1] = parseInt(hex.slice(3, 5), 16);
      dados[idx + 2] = parseInt(hex.slice(5, 7), 16);
      dados[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* ---------- 5. enxame de partículas ---------- */
function desenharEnxame(canvas, seed) {
  const rnd = mulberry32(seed);
  const { ctx, w, h } = dimensoesCanvas(canvas);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const n = 250 + Math.floor(rnd() * 200);
  const ps = [];
  for (let i = 0; i < n; i++) {
    ps.push({
      x: rnd() * w, y: rnd() * h,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      cor: paleta[Math.floor(rnd() * paleta.length)],
      r: 1 + rnd() * 2.5,
    });
  }
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);
  for (let passo = 0; passo < 220; passo++) {
    for (const p of ps) {
      let ax = 0, ay = 0;
      for (const q of ps) {
        const dx = q.x - p.x, dy = q.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1 && d2 < 2600) { ax += dx / d2; ay += dy / d2; }
      }
      p.vx = (p.vx + ax * 300 + (rnd() - 0.5) * 0.3) * 0.92;
      p.vy = (p.vy + ay * 300 + (rnd() - 0.5) * 0.3) * 0.92;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.fillStyle = p.cor;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- 6. circuito vivo ---------- */
function desenharCircuitos(canvas, seed) {
  const rnd = mulberry32(seed);
  const { ctx, w, h } = dimensoesCanvas(canvas);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const grid = 34;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  const nos = [];
  for (let i = 0; i < 40; i++) nos.push({ x: rnd() * w, y: rnd() * h });

  ctx.lineWidth = 1.5;
  for (const no of nos) {
    const vizinhos = nos
      .map(o => ({ o, d: (o.x - no.x) ** 2 + (o.y - no.y) ** 2 }))
      .filter(v => v.d > 1 && v.d < (w * 0.35) ** 2)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const v of vizinhos) {
      ctx.strokeStyle = paleta[Math.floor(rnd() * paleta.length)];
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(no.x, no.y);
      const mx = (no.x + v.o.x) / 2 + (rnd() - 0.5) * grid * 2;
      const my = (no.y + v.o.y) / 2 + (rnd() - 0.5) * grid * 2;
      ctx.lineTo(mx, my);
      ctx.lineTo(v.o.x, v.o.y);
      ctx.stroke();
    }
  }
  for (const no of nos) {
    ctx.fillStyle = paleta[Math.floor(rnd() * paleta.length)];
    ctx.globalAlpha = 1;
    ctx.fillRect(no.x - 3, no.y - 3, 6, 6);
  }
}

/* ---------- despacho ---------- */
const DESENHADORES = {
  flow: desenharFlow,
  truchet: desenharTruchet,
  orbitas: desenharOrbitas,
  ruido: desenharRuido,
  particulas: desenharEnxame,
  circuitos: desenharCircuitos,
};

function desenharPeca(fig, seed) {
  const tipo = fig.dataset.tipo.trim();
  const canvas = fig.querySelector("canvas");
  const desenhar = DESENHADORES[tipo];
  if (desenhar) {
    fig.dataset.seed = seed;
    desenhar(canvas, seed);
  }
}

/* ---------- hero ---------- */
const heroCanvas = document.getElementById("hero-canvas");
let seedHero = novaSemente();

function atualizarHero(seed) {
  seedHero = seed;
  desenharFlow(heroCanvas, seed);
  document.getElementById("obra-seed").textContent = String(seed).padStart(9, "0");
  document.getElementById("obra-num").textContent = String(seed % 9999).padStart(4, "0");
  const rnd = mulberry32(seed);
  document.getElementById("obra-titulo").textContent =
    TITULOS[Math.floor(rnd() * TITULOS.length)];
}

document.getElementById("btn-regenerar").addEventListener("click", () => {
  atualizarHero(novaSemente());
});

/* ---------- galeria ---------- */
const pecas = Array.from(document.querySelectorAll(".peca"));

function desenharGaleria() {
  pecas.forEach(fig => desenharPeca(fig, novaSemente()));
}

document.querySelectorAll(".btn-reg").forEach(btn => {
  btn.addEventListener("click", e => {
    const fig = e.target.closest(".peca");
    desenharPeca(fig, novaSemente());
  });
});

/* ---------- relógio e ano ---------- */
function tick() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  document.getElementById("relogio").textContent =
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
setInterval(tick, 1000);
tick();
document.getElementById("ano").textContent = new Date().getFullYear();

/* ---------- inicialização com resize ---------- */
function iniciar() {
  atualizarHero(seedHero);
  desenharGaleria();
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    atualizarHero(seedHero);
    pecas.forEach(fig => desenharPeca(fig, Number(fig.dataset.seed) || novaSemente()));
  }, 250);
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
