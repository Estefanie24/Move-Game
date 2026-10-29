/* Arcane Alchemist — shared sound + visual effects (no external files needed).
   Sounds are synthesised with the Web Audio API; effects are drawn on a full-screen canvas. */
(function () {
  'use strict';
  var LS = 'arcane-sound-off';
  var muted = false;
  try { muted = localStorage.getItem(LS) === '1'; } catch (e) {}

  /* ---------------------------------------------------------------- audio */
  var ac = null, master = null, musicTimer = null, musicStep = 0;

  function A() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.85;
        master.connect(ac.destination);
      } catch (e) { return null; }
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    return ac;
  }

  function tone(freq, dur, type, vol, delay, slideTo) {
    if (muted) return;
    var a = A(); if (!a) return;
    dur = dur || 0.15; vol = vol == null ? 0.14 : vol;
    var t = a.currentTime + (delay || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, delay, freq) {
    if (muted) return;
    var a = A(); if (!a) return;
    var t = a.currentTime + (delay || 0);
    var n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(); s.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1800;
    var g = a.createGain(); g.gain.value = vol || 0.1;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }

  var C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;

  var sfx = {
    good: function (streak) {            // correct / score
      var up = Math.min(6, streak || 0) * 40;
      tone(C5 + up, 0.12, 'triangle', 0.16, 0);
      tone(E5 + up, 0.12, 'triangle', 0.16, 0.07);
      tone(G5 + up, 0.22, 'triangle', 0.16, 0.14);
      tone(C6 + up, 0.3, 'sine', 0.08, 0.2);
    },
    bad: function () {                   // wrong / miss
      tone(220, 0.28, 'sawtooth', 0.11, 0, 110);
      tone(165, 0.32, 'square', 0.06, 0.08, 82);
    },
    grab: function () { tone(440, 0.09, 'triangle', 0.14, 0, 880); noise(0.08, 0.05, 0, 3000); },
    drop: function () { tone(180, 0.22, 'sine', 0.22, 0, 55); noise(0.12, 0.06, 0, 400); },
    whoosh: function () { noise(0.25, 0.07, 0, 1200); },
    pop: function () { tone(700, 0.08, 'sine', 0.12, 0, 1100); },
    tick: function (n) { tone(n === 0 ? 1320 : 880, n === 0 ? 0.25 : 0.1, 'square', 0.07, 0); },
    go: function () { tone(660, 0.1, 'triangle', 0.14, 0); tone(990, 0.2, 'triangle', 0.14, 0.1); },
    win: function () {
      [C5, E5, G5, C6, G5, C6, E6].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.15, i * 0.11); });
      tone(C6 / 2, 0.7, 'sine', 0.1, 0.6);
    },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.28, 'triangle', 0.13, i * 0.16); }); },
    draw: function () { tone(440, 0.15, 'triangle', 0.13, 0); tone(440, 0.15, 'triangle', 0.13, 0.18); },
    thud: function () { tone(150, 0.25, 'sine', 0.24, 0, 50); noise(0.14, 0.07, 0, 350); },
    release: function () { tone(520, 0.1, 'triangle', 0.12, 0, 330); },
    start: function () { tone(523.25, 0.1, 'triangle', 0.13, 0); tone(659.25, 0.1, 'triangle', 0.13, 0.09); tone(783.99, 0.22, 'triangle', 0.14, 0.18); },
    beep: function () { tone(740, 0.12, 'sine', 0.12, 0); },
    sparkle: function () { [1568, 1976, 2349].forEach(function (f, i) { tone(f, 0.12, 'sine', 0.06, i * 0.05); }); }
  };

  /* Gentle ambient loop (pentatonic), only while a game is running. */
  var SCALE = [261.63, 311.13, 349.23, 392.0, 466.16];
  function musicTick() {
    if (muted) return;
    var n = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.35 ? 2 : 1);
    tone(n, 1.0, 'triangle', 0.028, 0);
    if (musicStep % 8 === 0) { tone(130.81, 3.2, 'sine', 0.035, 0); tone(196.0, 3.2, 'sine', 0.02, 0); }
    musicStep++;
  }
  function musicStart() { if (musicTimer) return; A(); musicStep = 0; musicTimer = setInterval(musicTick, 520); }
  function musicStop() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  /* ---------------------------------------------------------- visual FX */
  var cv, cx, parts = [], raf = 0, dpr = 1;

  function injectCss() {
    if (document.getElementById('fxStyle')) return;
    var st = document.createElement('style'); st.id = 'fxStyle';
    st.textContent =
      '@keyframes fxFlash{0%{opacity:.5}100%{opacity:0}}' +
      '@keyframes fxShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-9px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(5px)}80%{transform:translateX(-2px)}}' +
      '@keyframes fxPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}' +
      '@keyframes fxBump{0%{transform:scale(1)}35%{transform:scale(1.22)}100%{transform:scale(1)}}' +
      '@keyframes fxPulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.8);transform:translate(-50%,-50%) scale(1)}50%{box-shadow:0 0 0 24px rgba(255,255,255,0);transform:translate(-50%,-50%) scale(1.15)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0);transform:translate(-50%,-50%) scale(1)}}' +
      '.fxShake{animation:fxShake .42s ease}.fxPop{animation:fxPop .4s ease}.fxBump{animation:fxBump .45s ease}.fxPulse{animation:fxPulse .6s ease-out}' +
      '#fxFlash{position:fixed;inset:0;pointer-events:none;z-index:99997;opacity:0}' +
      '#fxSoundBtn{position:fixed;right:14px;bottom:14px;z-index:99998;width:48px;height:48px;border-radius:50%;border:1px solid #f4c87999;background:#1a1430ee;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 0 18px #6d43ad66;padding:0;display:grid;place-items:center}';
    document.head.appendChild(st);
  }

  function ensure() {
    if (cv) return;
    injectCss();
    cv = document.createElement('canvas'); cv.id = 'fxCanvas';
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
    document.body.appendChild(cv); cx = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
  }
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }

  function frame() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life > 0; });
    parts.forEach(function (p) {
      p.life--; var k = Math.max(0, p.life / p.max);
      cx.save(); cx.globalAlpha = Math.min(1, k * 1.6);
      if (p.kind === 'ring') {
        p.r += p.vr; cx.strokeStyle = p.color; cx.lineWidth = 4 * k + 1; cx.shadowColor = p.color; cx.shadowBlur = 16;
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.stroke();
      } else if (p.kind === 'text') {
        p.y += p.vy; cx.font = 'bold ' + (p.size || 30) + 'px system-ui,sans-serif'; cx.textAlign = 'center';
        cx.lineWidth = 5; cx.strokeStyle = 'rgba(8,5,20,.9)'; cx.strokeText(p.text, p.x, p.y);
        cx.fillStyle = p.color; cx.shadowColor = p.color; cx.shadowBlur = 14; cx.fillText(p.text, p.x, p.y);
      } else {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
        cx.translate(p.x, p.y); cx.rotate(p.rot);
        if (p.kind === 'emoji') { cx.font = p.size + 'px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(p.emoji, 0, 0); }
        else if (p.kind === 'conf') { cx.fillStyle = p.color; cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
        else { cx.fillStyle = p.color; cx.shadowColor = p.color; cx.shadowBlur = 12; cx.beginPath(); cx.arc(0, 0, p.size * k + 1, 0, 6.283); cx.fill(); }
      }
      cx.restore();
    });
    raf = parts.length ? requestAnimationFrame(frame) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function add(p) { ensure(); parts.push(p); if (!raf) raf = requestAnimationFrame(frame); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var PALETTE = ['#f4c879', '#70f4e8', '#c5a2ff', '#ff7ab8', '#8dff9a', '#7fb4ff', '#fff4a8'];

  function burst(x, y, o) {
    o = o || {}; var n = o.count || 28, color = o.color, emojis = o.emojis;
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.283), s = rnd(2, o.speed || 7), life = Math.floor(rnd(34, 62));
      var p = { x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: 0.16, rot: 0, vr: rnd(-0.2, 0.2), life: life, max: life, size: rnd(4, 8) };
      if (emojis && i % 4 === 0) { p.kind = 'emoji'; p.emoji = emojis[Math.floor(Math.random() * emojis.length)]; p.size = rnd(18, 30); }
      else { p.kind = 'dot'; p.color = color || PALETTE[Math.floor(Math.random() * PALETTE.length)]; }
      add(p);
    }
    ring(x, y, color || '#f4c879');
  }
  function ring(x, y, color) { add({ kind: 'ring', x: x, y: y, r: 8, vr: 3.4, color: color || '#fff', life: 28, max: 28 }); }
  function floatText(text, x, y, color, size) { add({ kind: 'text', text: text, x: x, y: y, vy: -1.5, color: color || '#fff4a8', size: size || 32, life: 56, max: 56 }); }
  function confetti(n) {
    n = n || 130;
    for (var i = 0; i < n; i++) {
      var life = Math.floor(rnd(90, 170));
      add({ kind: 'conf', x: rnd(0, innerWidth), y: rnd(-80, -10), vx: rnd(-1.4, 1.4), vy: rnd(1, 4), g: 0.05, rot: rnd(0, 6), vr: rnd(-0.25, 0.25), size: rnd(8, 16), color: PALETTE[i % PALETTE.length], life: life, max: life });
    }
  }
  function flash(color) {
    ensure();
    var f = document.getElementById('fxFlash');
    if (!f) { f = document.createElement('div'); f.id = 'fxFlash'; document.body.appendChild(f); }
    f.style.background = 'radial-gradient(circle at 50% 50%,' + (color || '#fff') + '66,transparent 70%)';
    f.style.animation = 'none'; void f.offsetWidth; f.style.animation = 'fxFlash .5s ease-out';
  }
  function cls(el, name, ms) {
    if (!el) return; el.classList.remove(name); void el.offsetWidth; el.classList.add(name);
    setTimeout(function () { el.classList.remove(name); }, ms || 450);
  }
  function shake(el) { cls(el, 'fxShake', 450); }
  function pop(el) { cls(el, 'fxPop', 420); }
  function centerOf(el) {
    if (!el) return { x: innerWidth / 2, y: innerHeight / 2 };
    var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ----------------------------------------------------------- mute UI */
  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(LS, muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.85;
    var b = document.getElementById('fxSoundBtn'); if (b) b.textContent = muted ? '🔇' : '🔊';
    if (muted) musicStop();
  }
  function addButton() {
    if (document.getElementById('soundBtn') || document.getElementById('fxSoundBtn')) return; // page has its own
    injectCss();
    var b = document.createElement('button'); b.id = 'fxSoundBtn'; b.type = 'button';
    b.setAttribute('aria-label', 'Toggle sound'); b.textContent = muted ? '🔇' : '🔊';
    b.addEventListener('click', function () { setMuted(!muted); if (!muted) { sfx.pop(); } });
    document.body.appendChild(b);
  }
  function unlock() { A(); }
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();

  function sound(name, arg) {
    var f = { success: function () { sfx.good(arg); }, combo: function () { sfx.good(6); sfx.sparkle(); }, fail: sfx.bad, win: sfx.win, lose: sfx.lose };
    var fn = f[name] || sfx[name]; if (fn) fn(arg);
  }
  function at(el, fx, fy) {
    if (!el) return { x: innerWidth / 2, y: innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width * (fx == null ? 0.5 : fx), y: r.top + r.height * (fy == null ? 0.5 : fy) };
  }
  function trail(x, y, color) {
    add({ kind: 'dot', x: x, y: y, vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.6), g: 0.02, rot: 0, vr: 0, size: rnd(3, 6), color: color || '#fff', life: 22, max: 22 });
  }
  function bumpEl(el) { cls(el, 'fxBump', 480); }
  function pulseEl(el) { cls(el, 'fxPulse', 650); }
  function burstOpts(x, y, o) {
    o = o || {}; var power = o.power ? Math.max(3, o.power / 28) : 7;
    burst(x, y, { count: o.count, color: o.color, speed: power, emojis: o.emojis });
  }

  window.FX = {
    sound: sound, at: at, trail: trail, bump: bumpEl, pulse: pulseEl,
    float: floatText, burst: burstOpts, confetti: confetti, flash: flash, shake: shake,
    unlock: unlock, music: function (on) { if (on) { A(); musicStart(); } else musicStop(); },
    tone: tone, sfx: sfx, ring: ring, centerOf: centerOf,
    setMuted: setMuted, isMuted: function () { return muted; }
  };
})();
