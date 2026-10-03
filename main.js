(() => {
  'use strict';

  const IDLE_MS = 5000; // без движения — сцена уходит на орбиту
  const IDLE_HINT_MS = 1500;
  const TILT_X = 6; // градусы наклона сцены за курсором
  const TILT_Y = 10;
  const TILT_EASE = 0.06;
  const ARRIVE_DELAY_MS = 750; // через сколько после старта поворота окно «включается»
  const LANG_SWAP_MS = 380;

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const rig = $('rig');
  const idleEl = $('idle');
  const idleTime = $('idleTime');
  const projects = window.PROJECTS || [];
  const pad2 = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Расшифровка текста ───────── */

  const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/<>_=+*';
  const GLYPHS_KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ';

  function decode(el, ms = 900, delay = 0) {
    if (calm || !el) return;
    if (el._stopDecode) el._stopDecode();
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    if (!nodes.length) return;
    const finals = nodes.map((n) => n.nodeValue);
    const total = finals.reduce((sum, text) => sum + text.length, 0);
    const glyphs = getComputedStyle(el).fontFamily.includes('Jura') ? GLYPHS + GLYPHS_KANA : GLYPHS;
    let seen = 0;
    const plan = finals.map((text) => [...text].map((ch) => ({ ch, at: (seen++ / total) * 0.65 + Math.random() * 0.35 })));
    const keepLines = Boolean(el.querySelector('br'));
    const prevWhiteSpace = el.style.whiteSpace;
    if (keepLines) el.style.whiteSpace = 'nowrap';
    el.classList.add('is-decoding');
    let raf = 0;
    let start = 0;
    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      nodes.forEach((n, i) => { if (n.isConnected) n.nodeValue = finals[i]; });
      el.style.whiteSpace = prevWhiteSpace;
      el.classList.remove('is-decoding');
      el._stopDecode = null;
    };
    el._stopDecode = stop;
    const step = (now) => {
      if (!start) start = now + delay;
      const p = Math.max(0, (now - start) / ms);
      if (p >= 1) { stop(); return; }
      if (frame++ % 3 === 0) {
        nodes.forEach((n, i) => {
          n.nodeValue = plan[i].map((c) => (p >= c.at || !c.ch.trim() ? c.ch : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
        });
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function decodeView(view, delay = 0) {
    let i = 0;
    view.querySelectorAll('.kicker, .title, .text, .action span, .hint, .item-row .t').forEach((el) => decode(el, 900, delay + i++ * 60));
  }

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest && e.target.closest('.action, .head-btn, .lang button, .item-row');
    if (!el || el.contains(e.relatedTarget)) return;
    decode(el.querySelector('span, .t') || el, 380);
  });

  /* ───────── Декор: линейки, скобки, прицел, кольца ───────── */

  const deco = $('deco');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (name, attrs, parent) => {
    const el = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    (parent || deco).appendChild(el);
    return el;
  };

  const cross = $('cross');
  let bars = [];

  function drawDeco() {
    deco.innerHTML = '';
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W < 761) return;
    deco.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const g = (cls) => svgEl('g', { class: cls, stroke: 'currentColor', fill: 'none', 'stroke-width': 1 });

    // Линейки по верхней и левой кромке
    const rulers = g('');
    for (let x = 0; x <= W; x += 20) {
      const big = x % 100 === 0;
      svgEl('line', { x1: x, y1: 0, x2: x, y2: big ? 12 : 6 }, rulers);
      if (big && x > 0) svgEl('text', { x: x + 4, y: 20 }, rulers).textContent = String(x).padStart(4, '0');
    }
    for (let y = 0; y <= H; y += 20) {
      const big = y % 100 === 0;
      svgEl('line', { x1: 0, y1: y, x2: big ? 12 : 6, y2: y }, rulers);
    }

    // Уголки-кропмарки вокруг всего экрана
    const marks = g('strong');
    const m = 26; const L = 18; const pad = 14;
    [[pad, pad, 1, 1], [W - pad, pad, -1, 1], [pad, H - pad, 1, -1], [W - pad, H - pad, -1, -1]].forEach(([x, y, sx, sy]) => {
      svgEl('path', { d: `M${x + sx * L} ${y}H${x}V${y + sy * L}` }, marks);
    });
    void m;

    // Столбики справа: живые значения
    const barsG = g('');
    bars = [];
    for (let i = 0; i < 24; i++) {
      const y = H * 0.3 + i * 10;
      bars.push(svgEl('line', { x1: W - 30, y1: y, x2: W - 30 - 10, y2: y, 'stroke-width': 3 }, barsG));
    }
    svgEl('text', { x: W - 30, y: H * 0.3 - 10, 'text-anchor': 'end' }, barsG).textContent = 'MEM · LOAD';

    // Штриховая полоса внизу по центру
    const hatch = g('');
    for (let x = W / 2 - 120; x < W / 2 + 120; x += 8) svgEl('line', { x1: x, y1: H - 52, x2: x + 5, y2: H - 60 }, hatch);
    svgEl('path', { d: `M${W / 2 - 130} ${H - 64}h260M${W / 2 - 130} ${H - 48}h260` }, hatch);
  }
  drawDeco();
  window.addEventListener('resize', drawDeco);

  // Живые значения: столбики, выноски, полоски внутри диалога
  const barsIn = $('bars');
  barsIn.innerHTML = Array.from({ length: 14 }, () => '<b></b>').join('');
  const hex = (n) => `0x${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
  function pulseData() {
    if (document.hidden) return;
    bars.forEach((b) => {
      const w = 4 + Math.random() * 60;
      b.setAttribute('x2', Number(b.getAttribute('x1')) - w);
      b.setAttribute('class', w > 50 ? 'accent' : '');
    });
    barsIn.querySelectorAll('b').forEach((b) => {
      const v = Math.random();
      b.style.transform = `scaleY(${(0.08 + v * 0.92).toFixed(2)})`;
      b.classList.toggle('hot', v > 0.8);
    });
    $('tagRev').textContent = hex();
    $('tagDelta').textContent = (Math.random() * 0.02).toFixed(3);
    $('tagLink').textContent = Math.random() > 0.85 ? 'RESYNC' : 'STABLE';
  }
  pulseData();
  setInterval(pulseData, 1800);

  /* ───────── Микротекст: фактура из служебных данных ───────── */

  function microText(lines) {
    const words = ['HYPER', 'URANION', 'FORM', 'IDEA', 'OBJ', 'STAGE', 'CLOUD', 'SYNC', 'PROJ', 'REV', 'IDX', 'MEM', 'NODE', 'LINK', 'SEED'];
    const out = [];
    for (let i = 0; i < lines; i++) {
      const w = words[Math.floor(Math.random() * words.length)];
      const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
      const pct = (Math.random() * 100).toFixed(2).padStart(6, ' ');
      out.push(`${pad2(i + 1)}  ${w.padEnd(8)}  0x${hex}  ${pct}%  ${Math.random() > 0.5 ? '▮' : '▯'}`);
    }
    return out.join('\n');
  }
  document.querySelectorAll('[data-micro]').forEach((el) => { el.textContent = microText(Number(el.dataset.micro)); });
  setInterval(() => {
    if (document.hidden) return;
    const el = document.querySelectorAll('[data-micro]');
    const pick = el[Math.floor(Math.random() * el.length)];
    if (pick) pick.textContent = microText(Number(pick.dataset.micro));
  }, 2600);

  /* ───────── Языки ───────── */

  const LANGS = window.LANGS || ['en'];
  const DEFAULT_LANG = window.DEFAULT_LANG || LANGS[0];
  const DICT = window.I18N || {};

  function pickLang() {
    const known = (code) => (code && LANGS.includes(code.toLowerCase().slice(0, 2)) ? code.toLowerCase().slice(0, 2) : '');
    let saved = '';
    try { saved = localStorage.getItem('lang'); } catch (_) { /* хранилище недоступно */ }
    const fromBrowser = (navigator.languages || [navigator.language]).map(known).find(Boolean);
    return known(new URLSearchParams(location.search).get('lang')) || known(saved) || fromBrowser || DEFAULT_LANG;
  }
  let lang = pickLang();
  let langTimer = 0;

  function t(key, vars) {
    const text = (DICT[lang] && DICT[lang][key]) ?? (DICT[DEFAULT_LANG] && DICT[DEFAULT_LANG][key]) ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : text;
  }
  const loc = (v) => (v && typeof v === 'object' ? (v[lang] ?? v[DEFAULT_LANG] ?? '') : (v ?? ''));

  const langEl = $('lang');
  LANGS.forEach((code) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.lang = code;
    b.lang = code;
    b.textContent = code.toUpperCase();
    b.addEventListener('click', () => setLang(code));
    langEl.appendChild(b);
  });

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.desc'));
    document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach((el) => { if (el._stopDecode) el._stopDecode(); });
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':');
        el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    langEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('projectsKicker').textContent = t('projects.kicker', { total: pad2(projects.length) });
    renderProjects();
  }

  function setLang(next) {
    if (next === lang || !LANGS.includes(next)) return;
    lang = next;
    try { localStorage.setItem('lang', lang); } catch (_) { /* хранилище недоступно */ }
    clearTimeout(langTimer);
    langTimer = setTimeout(() => {
      applyLang();
      decodeView(document.querySelector('.dialog.is-active'));
    }, 80);
    poke();
  }

  /* ───────── Проекты ───────── */

  const listEl = $('projectList');
  let openProject = -1;

  function renderProjects() {
    listEl.innerHTML = projects.map((p, i) => `
      <li class="item${i === openProject ? ' is-open' : ''}">
        <button type="button" class="item-row" data-item="${i}" aria-expanded="${i === openProject}">
          <span class="n">${pad2(i + 1)}</span>
          <span class="t">${esc(loc(p.title))}<small>${esc(loc(p.tagline))}</small></span>
          <span class="y">${esc(p.year || '')}</span>
        </button>
        <div class="item-detail"><div><div class="inner">
          <p class="desc">${esc(loc(p.desc))}</p>
          <dl class="facts">
            <div><dt>${esc(t('project.year'))}</dt><dd>${esc(p.year || '—')}</dd></div>
            <div><dt>${esc(t('project.role'))}</dt><dd>${esc(loc(p.role) || '—')}</dd></div>
          </dl>
          <ul class="chips">${(p.stack || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          ${p.url ? `<div><a class="action" href="${esc(p.url)}" target="_blank" rel="noopener"><i>${pad2(i + 1)}</i><span>${esc(t('project.open'))}</span></a></div>` : ''}
        </div></div></div>
      </li>`).join('');
  }

  listEl.addEventListener('click', (e) => {
    const row = e.target.closest('[data-item]');
    if (!row) return;
    const i = Number(row.dataset.item);
    openProject = openProject === i ? -1 : i;
    listEl.querySelectorAll('.item').forEach((li, k) => {
      li.classList.toggle('is-open', k === openProject);
      li.querySelector('.item-row').setAttribute('aria-expanded', String(k === openProject));
    });
    if (openProject >= 0) decode(row.querySelector('.t'), 500);
  });

  /* ───────── Смена диалогов ───────── */

  // Где каждое окно висит в пространстве: смещение в пикселях и разворот в градусах.
  // Главное — в начале координат, остальные раскиданы по высоте, сторонам и глубине.
  const HOME = {
    main:     { x: 0,    y: 0,    z: 0,    ry: 0,   rx: 0 },
    projects: { x: -840, y: -230, z: -540, ry: 28,  rx: -4 },
    about:    { x: 800,  y: 210,  z: -400, ry: -25, rx: 5 },
    contact:  { x: 380,  y: -450, z: -780, ry: -15, rx: 10 },
  };
  const ORDER = ['main', 'projects', 'about', 'contact'];
  const FAR_PX = 1100; // дальше этого расстояния окно почти гаснет
  const dialogs = ORDER.map((name) => document.querySelector(`.dialog[data-view="${name}"]`));
  let current = 'main';
  let arriving = 0;

  function place() {
    const cam = HOME[current];
    // на узких экранах разброс сжимается, чтобы соседние окна оставались в кадре
    const k = Math.min(1, Math.max(0.45, window.innerWidth / 1440));
    body.dataset.current = current; // не data-view: по нему ищутся сами окна
    $('tagStage').textContent = `${pad2(ORDER.indexOf(current) + 1)} / ${pad2(ORDER.length)}`;
    dialogs.forEach((d) => {
      const h = HOME[d.dataset.view];
      const active = d.dataset.view === current;
      const dx = (h.x - cam.x) * k;
      const dy = (h.y - cam.y) * k;
      const dz = (h.z - cam.z) * k;
      d.style.setProperty('--x', `${dx.toFixed(0)}px`);
      d.style.setProperty('--y', `${dy.toFixed(0)}px`);
      d.style.setProperty('--z', `${dz.toFixed(0)}px`);
      d.style.setProperty('--ry', `${h.ry - cam.ry}deg`);
      d.style.setProperty('--rx', `${h.rx - cam.rx}deg`);
      d.classList.toggle('is-active', active);
      d.classList.toggle('is-far', Math.hypot(dx, dy, dz) > FAR_PX * k);
      d.setAttribute('aria-hidden', String(!active));
      // содержимое фоновых окон недоступно ни мыши, ни клавиатуре
      [...d.children].forEach((child) => { child.inert = !active; });
    });
  }
  window.addEventListener('resize', place);

  // Линия сканирования идёт через transform, ей нужна высота окна в пикселях
  const setScanHeight = () => dialogs.forEach((d) => d.style.setProperty('--scan-h', `${d.offsetHeight}px`));
  window.addEventListener('resize', setScanHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setScanHeight);
  setScanHeight();

  function go(name) {
    if (name === current || !ORDER.includes(name)) return;
    current = name;
    place();
    const to = dialogs[ORDER.indexOf(name)];
    to.scrollTop = 0;
    clearTimeout(arriving);
    dialogs.forEach((d) => d.classList.remove('is-arriving'));
    // вспышка и расшифровка — когда окно уже подъезжает к центру
    arriving = setTimeout(() => {
      to.classList.add('is-arriving');
      decodeView(to);
    }, ARRIVE_DELAY_MS);
    poke();
  }

  // Клик по плите на фоне привозит её в центр
  dialogs.forEach((d) => d.addEventListener('click', () => { if (!d.classList.contains('is-active')) go(d.dataset.view); }));
  place();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    btn.classList.add('is-pressed');
    setTimeout(() => btn.classList.remove('is-pressed'), 160);
    go(btn.dataset.go);
  });

  // Цифры на клавиатуре — те же действия, что и кнопки текущего диалога
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === '0') { go('main'); return; }
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1) return;
    const view = document.querySelector('.dialog.is-active');
    const btn = view.querySelectorAll('.dialog-actions .action')[n - 1] || (view.dataset.view === 'projects' ? view.querySelectorAll('[data-item]')[n - 1] : null);
    if (btn) btn.click();
  });

  /* ───────── Наклон сцены и блик ───────── */

  const tilt = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const coords = $('coords');

  function aim(nx, ny) {
    if (calm) return;
    tilt.tx = ny * TILT_X;
    tilt.ty = nx * TILT_Y;
    if (!tilt.raf) tilt.raf = requestAnimationFrame(stepTilt);
  }
  function stepTilt() {
    tilt.x += (tilt.tx - tilt.x) * TILT_EASE;
    tilt.y += (tilt.ty - tilt.y) * TILT_EASE;
    rig.style.setProperty('--rx', `${(-tilt.x).toFixed(3)}deg`);
    rig.style.setProperty('--ry', `${tilt.y.toFixed(3)}deg`);
    const label = `RX ${(-tilt.x).toFixed(1)} · RY ${tilt.y.toFixed(1)}`;
    if (coords.textContent !== label) coords.textContent = label;
    cross.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    // блик — только на активном окне и без замера его размеров
    const active = dialogs[ORDER.indexOf(current)];
    active.style.setProperty('--gx', `${(pointer.x / window.innerWidth * 100).toFixed(0)}%`);
    active.style.setProperty('--gy', `${(pointer.y / window.innerHeight * 100).toFixed(0)}%`);
    const settled = Math.abs(tilt.tx - tilt.x) < 0.002 && Math.abs(tilt.ty - tilt.y) < 0.002;
    tilt.raf = settled ? 0 : requestAnimationFrame(stepTilt);
  }

  let lastX = -1;
  let lastY = -1;
  window.addEventListener('mousemove', (e) => {
    if (e.clientX === lastX && e.clientY === lastY) return;
    lastX = e.clientX;
    lastY = e.clientY;
    poke();
    // Здесь только запоминаем, куда смотрит курсор. Всё остальное — раз в кадр в stepTilt.
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    aim(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
  }, { passive: true });
  ['mousedown', 'keydown', 'wheel', 'touchstart', 'touchmove'].forEach((ev) => window.addEventListener(ev, poke, { passive: true }));
  document.addEventListener('visibilitychange', poke);

  /* ───────── Орбита: 5 секунд без движения ───────── */

  let orbit = false;
  let idleSince = performance.now();
  const blocked = () => body.classList.contains('boot') || document.hidden;

  function enterOrbit() {
    if (orbit) return;
    orbit = true;
    body.classList.add('orbit');
    idleEl.classList.remove('is-on');
    aim(0, 0);
  }
  function exitOrbit() {
    if (!orbit) return;
    orbit = false;
    body.classList.remove('orbit');
  }
  function poke() {
    idleSince = performance.now();
    if (orbit) exitOrbit();
  }
  // Проверка простоя 10 раз в секунду: цифре отсчёта больше не нужно, а покадровый цикл зря будил процессор
  setInterval(() => {
    if (orbit) return;
    const now = performance.now();
    if (blocked()) { idleSince = now; idleEl.classList.remove('is-on'); return; }
    const idle = now - idleSince;
    idleEl.classList.toggle('is-on', idle > IDLE_HINT_MS);
    const left = (Math.max(0, IDLE_MS - idle) / 1000).toFixed(1);
    if (idleTime.textContent !== left) idleTime.textContent = left;
    if (idle >= IDLE_MS) enterOrbit();
  }, 100);

  /* ───────── Часы ───────── */

  const clock = $('clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); };
  tick();
  setInterval(tick, 1000);

  applyLang();

  /* ───────── Развёртывание интерфейса при загрузке ─────────
     Интерфейс собирается по шагам: линия → каркас окна → стекло → содержимое → выноски →
     окна в глубине → приборы по краям. Каждый шаг добавляет на <body> класс bN;
     что именно он открывает, описано в styles.css. */

  const main = dialogs[ORDER.indexOf('main')];
  const bootLog = $('bootLog');
  const logLine = (key) => {
    bootLog.innerHTML += `${bootLog.innerHTML ? '\n' : ''}${esc(t(key, { total: pad2(projects.length) })).replace(/^&gt;/, '<b>&gt;</b>')}`;
  };

  // [момент от старта в мс, класс шага, что сделать дополнительно]
  const BOOT_STEPS = [
    [150,  'b1',  () => logLine('boot.1')],
    [750,  'b2',  null],
    [1400, 'b3',  () => decode(main.querySelector('.kicker'), 600)],
    [1850, 'b4',  () => { decode(main.querySelector('.title'), 1000); logLine('boot.2'); }],
    [2500, 'b5',  () => decode(main.querySelector('.text'), 800)],
    [2950, 'b6',  null],
    [3400, 'b7',  () => main.querySelectorAll('.action span').forEach((el, i) => decode(el, 500, i * 140))],
    [4100, 'b8',  () => logLine('boot.3')],
    [4700, 'b9',  null],
    [5400, 'b10', () => { logLine('boot.4'); document.querySelectorAll('.brand-sub, .hud-cell span[data-i18n]').forEach((el, i) => decode(el, 700, i * 100)); }],
  ];
  const BOOT_END_MS = 7000; // последние переходы доиграли — снимаем режим загрузки
  let bootTimers = [];

  function finishBoot() {
    if (!body.classList.contains('boot')) return;
    bootTimers.forEach(clearTimeout);
    body.classList.remove('boot', ...BOOT_STEPS.map((step) => step[1]));
    window.removeEventListener('pointerdown', finishBoot);
    window.removeEventListener('keydown', finishBoot);
    poke();
  }

  if (calm) {
    finishBoot();
  } else {
    bootTimers = BOOT_STEPS.map(([at, cls, run]) => setTimeout(() => { body.classList.add(cls); if (run) run(); }, at));
    bootTimers.push(setTimeout(finishBoot, BOOT_END_MS));
    // клик или клавиша пропускают развёртывание
    window.addEventListener('pointerdown', finishBoot);
    window.addEventListener('keydown', finishBoot);
  }

})();
