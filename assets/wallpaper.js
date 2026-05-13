/* ============================================================
   Mesh gradient wallpaper — colors pulled from the portrait.
   Soft color blobs drift and react to the cursor.
   ============================================================ */
(() => {
  const canvas = document.getElementById('wallpaper');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PALETTE = [
    [22, 46, 52],     // dark teal storm
    [38, 70, 78],     // deeper sky teal
    [58, 92, 100],    // mid storm-teal
    [80, 116, 124],   // pale teal-grey cloud
    [42, 52, 60],     // slate cloud shadow
    [30, 56, 70],     // cool storm blue
    [18, 32, 38],     // deep curtain shadow (anchors edges)
    [12, 20, 24]      // near-black sky base
  ];
  const BG = [9, 14, 18];
  const rgba = (c, a=1) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

  let W = 0, H = 0, DPR = 1;
  let mouseX = 0.5, mouseY = 0.5;
  let targetMX = 0.5, targetMY = 0.5;
  let t0 = performance.now();
  let blobs = [];
  let flashes = [];
  let nextFlash = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
  }

  function seed() {
    blobs = [];
    for (let i = 0; i < PALETTE.length; i++) {
      blobs.push({
        color: PALETTE[i],
        hx: rand(0.05, 0.95),
        hy: rand(0.05, 0.95),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: rand(0.00006, 0.00014),
        speedY: rand(0.00005, 0.00012),
        ampX:   rand(0.06, 0.14),
        ampY:   rand(0.05, 0.12),
        radius: rand(0.45, 0.75),
        alpha:  rand(0.55, 0.85),
        pull:   rand(0.05, 0.18)
      });
    }
  }

  function draw(now) {
    mouseX += (targetMX - mouseX) * 0.05;
    mouseY += (targetMY - mouseY) * 0.05;

    ctx.fillStyle = rgba(BG, 1);
    ctx.fillRect(0, 0, W, H);

    const t = now - t0;
    const maxDim = Math.max(W, H);

    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const dx = Math.cos(t * b.speedX + b.phaseX) * b.ampX;
      const dy = Math.sin(t * b.speedY + b.phaseY) * b.ampY;
      const px = (mouseX - b.hx) * b.pull;
      const py = (mouseY - b.hy) * b.pull;
      const cx = (b.hx + dx + px) * W;
      const cy = (b.hy + dy + py) * H;
      const r  = b.radius * maxDim;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,   rgba(b.color, b.alpha));
      g.addColorStop(0.4, rgba(b.color, b.alpha * 0.35));
      g.addColorStop(1,   rgba(b.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.25, W/2, H/2, Math.max(W,H)*0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    // subtle intermittent sky flashes — distant lightning behind the clouds
    if (!nextFlash) nextFlash = now + rand(2500, 5500);
    if (now >= nextFlash) {
      flashes.push({
        born: now,
        life: rand(520, 900),
        peak: rand(0.07, 0.14),
        // off-center bias so it feels like a distant strike
        cx: rand(0.15, 0.85),
        cy: rand(0.20, 0.70)
      });
      // sometimes a quick second flicker
      if (Math.random() < 0.30) {
        flashes.push({
          born: now + rand(120, 240),
          life: rand(280, 460),
          peak: rand(0.05, 0.10),
          cx: rand(0.15, 0.85),
          cy: rand(0.20, 0.70)
        });
      }
      nextFlash = now + rand(4000, 8500);
    }
    flashes = flashes.filter(f => now - f.born < f.life);
    ctx.globalCompositeOperation = 'screen';
    for (const f of flashes) {
      if (now < f.born) continue;
      const tt = (now - f.born) / f.life;
      const env = tt < 0.10 ? (tt / 0.10) : Math.pow(1 - (tt - 0.10) / 0.90, 1.8);
      const a = Math.max(0, f.peak * env);
      const fx = f.cx * W, fy = f.cy * H;
      const fr = Math.max(W, H) * 0.95;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
      fg.addColorStop(0,    `rgba(190,215,230,${a})`);
      fg.addColorStop(0.35, `rgba(170,200,220,${a * 0.45})`);
      fg.addColorStop(1,    'rgba(170,200,220,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';

    const gx = mouseX * W, gy = mouseY * H;
    const pulse = 0.94 + 0.06 * Math.sin(t * 0.0022);
    const orbR = 220 * pulse;
    const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, orbR);
    gg.addColorStop(0,    'rgba(226,196,120,0.55)');
    gg.addColorStop(0.18, 'rgba(201,164,74,0.30)');
    gg.addColorStop(0.45, 'rgba(201,164,74,0.12)');
    gg.addColorStop(1,    'rgba(201,164,74,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(gx, gy, orbR, 0, Math.PI * 2);
    ctx.fill();
    const cR = 28 * pulse;
    const cg = ctx.createRadialGradient(gx, gy, 0, gx, gy, cR);
    cg.addColorStop(0, 'rgba(255,236,180,0.55)');
    cg.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(gx, gy, cR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', (e) => {
    targetMX = e.clientX / window.innerWidth;
    targetMY = e.clientY / window.innerHeight;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!e.touches[0]) return;
    targetMX = e.touches[0].clientX / window.innerWidth;
    targetMY = e.touches[0].clientY / window.innerHeight;
  }, { passive: true });

  let idleT = 0;
  setInterval(() => {
    idleT += 0.018;
    if (document.hidden) return;
    targetMX += (0.5 + Math.cos(idleT) * 0.32 - targetMX) * 0.0015;
    targetMY += (0.5 + Math.sin(idleT * 0.85) * 0.28 - targetMY) * 0.0015;
  }, 33);

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
