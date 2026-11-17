(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const RAD = Math.PI / 180;
const fmt = (n, d = 2) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const parseNum = (s) => {
  if (s == null) return NaN;
  s = String(s).trim().replace(/\s/g, '').replace(/m$/i, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const LETTERS = 'ABCDEFGH';
const RIGHT = ['¡Muy bien!', '¡Exacto!', '¡Lo lograste!', '¡Eso es!'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ------------------------------------------------------------ Estado guardado */
const KEY = 'mindoclass-trigonometria-territorio-v1';
let S = { done: {}, notes: {}, records: [], quiz: {}, self: {}, reto: {}, prefs: {} };
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) { /* sin almacenamiento: funciona igual */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* nada */ } };

const live = () => $('#live');
function announce(msg) { const l = live(); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 30); }

function feedback(host, kind, title, body) {
  const badge = kind === 'right' ? '✓' : kind === 'near' ? '!' : 'i';
  host.innerHTML = `<div class="feedback ${kind}" role="status"><div class="fb-head"><span class="fb-badge" aria-hidden="true">${badge}</span>${title}</div>${body ? `<div class="fb-body">${body}</div>` : ''}</div>`;
  announce(`${title}. ${strip(body)}`);
}

/* ------------------------------------------------------------ Progreso */
const tracked = new Map(); // id -> sección
function markDone(id, ok) {
  const prev = S.done[id];
  if (!prev) S.done[id] = { ok: !!ok };
  save();
  refreshProgress();
}
function sectionStats(sec) {
  let total = 0, done = 0;
  tracked.forEach((s, id) => { if (s === sec) { total++; if (S.done[id]) done++; } });
  return { total, done };
}
function refreshProgress() {
  let total = 0, done = 0;
  tracked.forEach((s, id) => { total++; if (S.done[id]) done++; });
  const pct = total ? Math.round(done / total * 100) : 0;
  const fg = $('#ringFg'); if (fg) fg.style.strokeDashoffset = String(100.5 * (1 - pct / 100));
  const rt = $('#ringTxt'); if (rt) rt.textContent = pct + ' %';
  $$('.section').forEach(sec => {
    const st = sectionStats(sec.id);
    const isDone = st.total > 0 && st.done === st.total;
    $$(`[data-nav="${sec.id}"]`).forEach(n => {
      n.classList.toggle('is-done', isDone);
      const bar = n.querySelector('.nav-bar i'); if (bar) bar.style.width = (st.total ? st.done / st.total * 100 : 0) + '%';
      const ico = n.querySelector('.nav-ico'); if (ico) ico.textContent = isDone ? '✓' : sec.dataset.icon;
    });
  });
  $$('[data-screen]').forEach(scr => {
    const ids = $$('[data-act]', scr).map(e => e.dataset.act).filter(id => tracked.has(id));
    scr.classList.toggle('is-done', ids.length > 0 && ids.every(id => S.done[id]));
  });
}

/* ------------------------------------------------------------ Tipos de interacción */
function verifyBar(label = 'Comprobar') { return `<div class="actions"><button class="btn btn-verify" type="button" disabled>${label}</button></div><div class="fb"></div>`; }

/* Interpretar / elegir (choice_interpretation) */
function renderChoice(el, cfg, done) {
  el.innerHTML = `${cfg.q ? `<p class="${cfg.qClass || 'lead'}">${cfg.q}</p>` : ''}${cfg.fig ? `<div class="figure">${cfg.fig}</div>` : ''}
    <div class="options ${cfg.grid ? 'grid2' : ''}" role="group" aria-label="Opciones">${cfg.opts.map((o, i) => `<button class="chip" type="button" aria-pressed="false" data-i="${i}">${o.art ? `<span class="chip-art">${ART.thumb(o.art)}</span>` : `<span class="chip-key">${LETTERS[i]}</span>`}<span class="chip-text">${o.t}</span><span class="chip-mark" aria-hidden="true"></span></button>`).join('')}</div>${verifyBar()}`;
  let sel = new Set(), tries = 0, locked = false;
  const chips = $$('.chip', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  const correct = cfg.opts.map((o, i) => o.ok ? i : -1).filter(i => i >= 0);
  const clearMarks = () => chips.forEach(x => { x.classList.remove('right', 'near', 'muted'); x.querySelector('.chip-mark').textContent = ''; });
  chips.forEach(c => c.addEventListener('click', () => {
    if (locked) return;
    const i = +c.dataset.i;
    if (cfg.multi) { sel.has(i) ? sel.delete(i) : sel.add(i); } else sel = new Set([i]);
    clearMarks();
    chips.forEach(x => x.setAttribute('aria-pressed', String(sel.has(+x.dataset.i))));
    verify.disabled = sel.size === 0;
  }));
  function reveal() {
    locked = true;
    chips.forEach(x => { const i = +x.dataset.i; x.disabled = true; x.setAttribute('aria-pressed', 'false'); if (cfg.opts[i].ok) { x.classList.add('right'); x.querySelector('.chip-mark').textContent = '✓'; } else if (sel.has(i)) { x.classList.add('near'); } else x.classList.add('muted'); });
    actions.innerHTML = '';
  }
  verify.addEventListener('click', () => {
    tries++;
    const ok = correct.length === sel.size && correct.every(i => sel.has(i));
    if (ok) {
      reveal();
      feedback(fb, 'right', cfg.rightTitle || pick(RIGHT), cfg.right || '');
      done(tries === 1);
      return;
    }
    chips.forEach(x => { const i = +x.dataset.i; if (sel.has(i)) { if (cfg.opts[i].ok) { x.classList.add('right'); } else { x.classList.add('near'); x.querySelector('.chip-mark').textContent = '!'; } } });
    const wrong = [...sel].find(i => !cfg.opts[i].ok);
    let msg = (wrong != null && cfg.opts[wrong].why) || cfg.near || 'Revisa otra vez la situación.';
    if (cfg.multi && wrong == null) msg = cfg.missing || 'Vas bien, pero te falta seleccionar alguna.';
    if (cfg.once) {
      reveal();
      feedback(fb, 'near', 'No era esa respuesta', `${msg}${cfg.right ? `<br><br><b>La respuesta:</b> ${cfg.right}` : ''}`);
      done(false);
      return;
    }
    feedback(fb, 'near', 'Casi', msg);
    verify.textContent = 'Comprobar de nuevo';
    verify.disabled = true;
    if (tries >= 2 && !$('.btn-show', actions)) {
      const b = document.createElement('button');
      b.className = 'btn btn-quiet btn-show'; b.type = 'button'; b.textContent = 'Ver la respuesta';
      b.addEventListener('click', () => { reveal(); feedback(fb, 'teach', 'Así se resuelve', cfg.right || ''); done(false); });
      actions.appendChild(b);
    }
  });
}

/* Respuesta numérica con escalera de pistas */
function renderNum(el, cfg, done) {
  const uidv = 'n' + Math.random().toString(36).slice(2, 8);
  el.innerHTML = `${cfg.q ? `<p class="${cfg.qClass || 'lead'}">${cfg.q}</p>` : ''}${cfg.fig ? `<div class="figure">${cfg.fig}</div>` : ''}
    <div class="num-row"><label for="${uidv}">${cfg.label || 'Tu respuesta'}</label><input id="${uidv}" class="num-input" inputmode="decimal" autocomplete="off" placeholder="0,00"><span class="unit">${cfg.unit || ''}</span></div>
    <div class="actions"><button class="btn btn-verify" type="button" disabled>Comprobar</button>${cfg.hints && !cfg.once ? '<button class="btn btn-quiet btn-hint" type="button">💡 Pedir una pista</button>' : ''}</div>
    <div class="hints"></div><div class="fb"></div>`;
  const inp = $('input', el), verify = $('.btn-verify', el), fb = $('.fb', el), hintsBox = $('.hints', el), actions = $('.actions', el), hintBtn = $('.btn-hint', el);
  let tries = 0, hintN = 0, locked = false;
  inp.addEventListener('input', () => { if (locked) return; inp.classList.remove('near'); verify.disabled = inp.value.trim() === ''; });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !verify.disabled) verify.click(); });
  if (hintBtn) hintBtn.addEventListener('click', () => {
    if (hintN >= cfg.hints.length) return;
    const h = document.createElement('div'); h.className = 'hint'; h.innerHTML = `<b>Pista ${hintN + 1}:</b> ${cfg.hints[hintN]}`; hintsBox.appendChild(h); announce(strip(h.innerHTML));
    hintN++;
    if (hintN >= cfg.hints.length) { hintBtn.disabled = true; hintBtn.textContent = 'No hay más pistas'; }
  });
  function finish(kind, title, body, ok) {
    locked = true; inp.disabled = true; actions.innerHTML = '';
    inp.classList.add(kind === 'right' ? 'right' : 'near');
    feedback(fb, kind, title, body); done(ok);
  }
  verify.addEventListener('click', () => {
    const v = parseNum(inp.value);
    if (!isFinite(v)) { feedback(fb, 'near', 'Escribe un número', 'Usa solo cifras y una coma o un punto para los decimales. Ejemplo: 8,40'); return; }
    tries++;
    if (Math.abs(v - cfg.ans) <= cfg.tol) { finish('right', cfg.rightTitle || pick(RIGHT), cfg.solution || '', tries === 1 && hintN === 0); return; }
    const trap = (cfg.traps || []).find(t => Math.abs(v - t.v) <= (t.tol != null ? t.tol : cfg.tol));
    const msg = trap ? trap.msg : (cfg.near || 'Revisa qué lado conoces, qué lado buscas y qué razón los une.');
    if (cfg.once) { finish('near', 'No era ese valor', `${msg}<br><br><b>Solución:</b> ${cfg.solution || ''}`, false); return; }
    inp.classList.add('near');
    feedback(fb, 'near', 'Casi', msg);
    verify.disabled = true;
    if (tries >= 3 && !$('.btn-show', actions)) {
      const b = document.createElement('button'); b.className = 'btn btn-quiet btn-show'; b.type = 'button'; b.textContent = 'Ver la solución';
      b.addEventListener('click', () => finish('teach', 'Así se resuelve', cfg.solution || '', false));
      actions.appendChild(b);
    }
  });
}

/* Relacionar parejas (pair_matching) */
function renderPairs(el, cfg, done) {
  const n = cfg.left.length, order = cfg.order || cfg.right.map((_, i) => i);
  el.innerHTML = `<p class="lead" style="font-size:14px;color:var(--muted)">Toca un elemento de la izquierda y luego su pareja de la derecha. Toca de nuevo para deshacer.</p>
    <div class="pairs"><div class="col">${cfg.left.map((t, i) => `<button class="chip" type="button" data-l="${i}" aria-pressed="false"><span class="pair-tag">${i + 1}</span><span class="chip-text">${t}</span></button>`).join('')}</div>
    <div class="col">${order.map(j => `<button class="chip" type="button" data-r="${j}"><span class="pair-tag">·</span><span class="chip-text">${cfg.right[j]}</span><span class="chip-mark" aria-hidden="true"></span></button>`).join('')}</div></div>${verifyBar()}`;
  const L = $$('[data-l]', el), R = $$('[data-r]', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  let active = null, map = {}, tries = 0, locked = false;
  const paint = () => {
    L.forEach(b => { const i = +b.dataset.l; b.setAttribute('aria-pressed', String(active === i)); b.querySelector('.pair-tag').classList.toggle('on', map[i] != null); b.classList.remove('right', 'near'); });
    R.forEach(b => { const j = +b.dataset.r; const owner = Object.keys(map).find(k => map[k] === j); const tag = b.querySelector('.pair-tag'); tag.textContent = owner != null ? (+owner + 1) : '·'; tag.classList.toggle('on', owner != null); b.classList.remove('right', 'near'); b.setAttribute('aria-label', `${strip(cfg.right[j])}${owner != null ? `, unido con ${+owner + 1}` : ''}`); });
    verify.disabled = Object.keys(map).length < n;
  };
  L.forEach(b => b.addEventListener('click', () => { if (locked) return; const i = +b.dataset.l; if (map[i] != null && active !== i) { delete map[i]; active = i; } else active = active === i ? null : i; fb.innerHTML = ''; paint(); }));
  R.forEach(b => b.addEventListener('click', () => {
    if (locked) return; const j = +b.dataset.r;
    const owner = Object.keys(map).find(k => map[k] === j);
    if (active == null) { if (owner != null) { delete map[owner]; paint(); } return; }
    if (owner != null) delete map[owner];
    map[active] = j; announce(`Unido ${active + 1} con ${strip(cfg.right[j])}`);
    active = null; fb.innerHTML = ''; paint();
  }));
  verify.addEventListener('click', () => {
    tries++;
    let good = 0;
    L.forEach(b => { const i = +b.dataset.l; const ok = map[i] === i; if (ok) good++; b.classList.add(ok ? 'right' : 'near'); });
    R.forEach(b => { const j = +b.dataset.r; const owner = Object.keys(map).find(k => map[k] === j); b.classList.add(+owner === j ? 'right' : 'near'); });
    if (good === n) { locked = true; actions.innerHTML = ''; L.concat(R).forEach(b => b.disabled = true); feedback(fb, 'right', pick(RIGHT), cfg.right_msg || ''); done(tries === 1); }
    else { feedback(fb, 'near', `Casi: ${good} de ${n} parejas bien`, cfg.near || 'Las que están en ámbar no van juntas. Tócalas para cambiarlas.'); verify.disabled = true; }
  });
  paint();
}

/* Ordenar secuencia (sequence_ordering) */
function renderSeq(el, cfg, done) {
  let cur = cfg.start.slice(), tries = 0, locked = false;
  el.innerHTML = `<p class="lead" style="font-size:14px;color:var(--muted)">Usa las flechas para subir o bajar cada paso.</p><ol class="seq"></ol>${verifyBar()}`;
  const list = $('.seq', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  verify.disabled = false;
  function draw(marks) {
    list.innerHTML = cur.map((k, pos) => `<li class="seq-item ${marks ? (marks[pos] ? 'right' : 'near') : ''}"><span class="seq-pos">${pos + 1}</span><span class="seq-text">${cfg.items[k]}</span>${locked ? '' : `<span class="seq-moves"><button class="seq-move" type="button" data-m="${pos}" data-d="-1" ${pos === 0 ? 'disabled' : ''} aria-label="Subir: ${strip(cfg.items[k])}">↑</button><button class="seq-move" type="button" data-m="${pos}" data-d="1" ${pos === cur.length - 1 ? 'disabled' : ''} aria-label="Bajar: ${strip(cfg.items[k])}">↓</button></span>`}</li>`).join('');
    $$('.seq-move', list).forEach(b => b.addEventListener('click', () => {
      const p = +b.dataset.m, d = +b.dataset.d, q = p + d; [cur[p], cur[q]] = [cur[q], cur[p]]; fb.innerHTML = ''; verify.disabled = false; draw();
      const nb = $(`.seq-move[data-m="${q}"][data-d="${d}"]`, list) || $(`.seq-move[data-m="${q}"]`, list); if (nb) nb.focus();
    }));
  }
  verify.addEventListener('click', () => {
    tries++;
    const marks = cur.map((k, i) => k === i), good = marks.filter(Boolean).length;
    if (good === cur.length) { locked = true; actions.innerHTML = ''; draw(marks); feedback(fb, 'right', pick(RIGHT), cfg.right || ''); done(tries === 1); }
    else { draw(marks); feedback(fb, 'near', `Casi: ${good} de ${cur.length} pasos en su lugar`, cfg.near || 'Los pasos en ámbar están fuera de lugar. Piensa qué necesitas tener antes de hacer cada uno.'); verify.disabled = true; }
  });
  draw();
}

/* Completar con fichas (cloze_completion / faded_example) */
function renderCloze(el, cfg, done) {
  const gapRe = /\{\{(\w+)\}\}/g;
  const gapKeys = [];
  const html = (s) => s.replace(gapRe, (_, k) => { gapKeys.push(k); return `<button type="button" class="gap" data-g="${k}"><span class="gn">${gapKeys.length}</span><span class="gv"></span></button>`; });
  let body = '';
  if (cfg.steps) {
    body = `<ol class="steps">${cfg.steps.map((st, i) => { const before = gapKeys.length; const act = html(st.act); const has = gapKeys.length > before; return `<li class="step"><span class="step-n">${i + 1}</span><div><div class="step-act cloze-line" style="margin:0">${act}</div><div class="step-why" ${has ? 'hidden data-why' : ''}>${st.why}</div></div></li>`; }).join('')}</ol>`;
  } else body = cfg.lines.map(l => `<p class="cloze-line">${html(l)}</p>`).join('');
  el.innerHTML = `${body}<div class="bank" role="group" aria-label="Fichas"><span class="bank-label">Fichas · toca un hueco y luego una ficha</span>${cfg.tiles.map(t => `<button type="button" class="tile" data-t="${t.k}">${t.t}</button>`).join('')}</div>${verifyBar()}`;
  const gaps = $$('.gap', el), tiles = $$('.tile', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  const tileText = Object.fromEntries(cfg.tiles.map(t => [t.k, t.t]));
  let ans = {}, active = gapKeys[0], tries = 0, locked = false;
  function paint() {
    gaps.forEach((g, i) => { const k = g.dataset.g; g.classList.toggle('active', !locked && active === k); g.classList.toggle('filled', !!ans[k]); $('.gv', g).innerHTML = ans[k] ? tileText[ans[k]] : '&nbsp;?&nbsp;'; g.setAttribute('aria-label', ans[k] ? `Hueco ${i + 1}: ${strip(tileText[ans[k]])}. Toca para vaciar.` : `Hueco ${i + 1}, vacío`); });
    const used = Object.values(ans);
    tiles.forEach(t => t.classList.toggle('used', !cfg.reuse && used.includes(t.dataset.t)));
    verify.disabled = gapKeys.some(k => !ans[k]);
  }
  gaps.forEach(g => g.addEventListener('click', () => { if (locked) return; const k = g.dataset.g; g.classList.remove('right', 'near'); if (ans[k]) delete ans[k]; active = k; fb.innerHTML = ''; paint(); }));
  tiles.forEach(t => t.addEventListener('click', () => {
    if (locked) return; const tk = t.dataset.t;
    if (!cfg.reuse) { const owner = gapKeys.find(k => ans[k] === tk); if (owner) { delete ans[owner]; active = owner; fb.innerHTML = ''; paint(); return; } }
    const target = active && !ans[active] ? active : gapKeys.find(k => !ans[k]);
    if (!target) return;
    ans[target] = tk; $(`.gap[data-g="${target}"]`, el).classList.remove('right', 'near');
    active = gapKeys.find(k => !ans[k]) || null; fb.innerHTML = ''; paint();
  }));
  verify.addEventListener('click', () => {
    tries++;
    let good = 0;
    gaps.forEach(g => { const k = g.dataset.g, ok = ans[k] === cfg.answer[k]; if (ok) good++; g.classList.add(ok ? 'right' : 'near'); });
    if (good === gapKeys.length) {
      locked = true; actions.innerHTML = ''; $('.bank', el).remove(); paint();
      $$('[data-why]', el).forEach(w => w.hidden = false);
      feedback(fb, 'right', pick(RIGHT), cfg.right || ''); done(tries === 1);
    } else { feedback(fb, 'near', `Casi: ${good} de ${gapKeys.length} huecos bien`, cfg.near || 'Toca los huecos en ámbar para cambiarlos.'); verify.disabled = true; }
  });
  paint();
}

/* Ejemplo resuelto (worked_example): se revela un paso a la vez */
function renderWorked(el, cfg, done) {
  el.innerHTML = `<ol class="steps">${cfg.steps.map((s, i) => `<li class="step" ${i ? 'hidden' : ''}><span class="step-n">${i + 1}</span><div><div class="step-act">${s.act}</div><div class="step-why"><b>¿Por qué?</b> ${s.why}</div></div></li>`).join('')}</ol>
    <div class="actions"><button class="btn btn-verify" type="button">Ver el siguiente paso</button></div><div class="fb"></div>`;
  const steps = $$('.step', el), btn = $('.btn-verify', el), fb = $('.fb', el);
  let shown = 1;
  btn.addEventListener('click', () => {
    if (shown < steps.length) { steps[shown].hidden = false; announce(strip(steps[shown].innerHTML)); shown++; }
    if (shown >= steps.length) { $('.actions', el).innerHTML = ''; feedback(fb, 'teach', 'Resultado', cfg.result); done(true); }
  });
}

/* Detectar el error (error_detection) */
function renderError(el, cfg, done) {
  el.innerHTML = `<div class="options">${cfg.steps.map((s, i) => `<button class="chip" type="button" data-i="${i}" aria-pressed="false"><span class="chip-key">${i + 1}</span><span class="chip-text">${s}</span><span class="chip-mark" aria-hidden="true"></span></button>`).join('')}</div>${verifyBar('Este es el paso equivocado')}<div class="fix"></div>`;
  const chips = $$('.chip', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  let sel = null, tries = 0, locked = false;
  chips.forEach(c => c.addEventListener('click', () => { if (locked) return; sel = +c.dataset.i; chips.forEach(x => { x.setAttribute('aria-pressed', String(+x.dataset.i === sel)); x.classList.remove('near'); }); verify.disabled = false; fb.innerHTML = ''; }));
  verify.addEventListener('click', () => {
    tries++;
    if (sel === cfg.wrong) {
      locked = true; actions.innerHTML = '';
      chips.forEach(x => { x.disabled = true; const i = +x.dataset.i; if (i === cfg.wrong) { x.classList.add('near'); x.querySelector('.chip-mark').textContent = '✗ aquí'; } else { x.classList.add('right'); x.querySelector('.chip-mark').textContent = '✓'; } });
      feedback(fb, 'right', '¡Lo encontraste!', cfg.found);
      const fix = $('.fix', el); fix.innerHTML = '<div></div>';
      renderChoice(fix.firstChild, cfg.fix, (ok) => done(tries === 1 && ok));
    } else {
      chips[sel].classList.add('near');
      feedback(fb, 'near', 'Ese paso está bien', cfg.okWhy[sel] || 'Revisa los otros pasos.'); verify.disabled = true;
    }
  });
}

/* Clasificar (category_sort) */
function renderSort(el, cfg, done) {
  el.innerHTML = `<div class="options">${cfg.items.map((it, i) => `<div class="sort-item" data-i="${i}"><div class="sort-q">${it.t}</div><div class="seg" role="group" aria-label="Elige la razón">${cfg.cats.map((c, j) => `<button type="button" data-c="${j}" aria-pressed="false">${c}</button>`).join('')}</div><div class="sort-why" hidden>${it.why}</div></div>`).join('')}</div>${verifyBar()}`;
  const rows = $$('.sort-item', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  const ans = {}; let tries = 0, locked = false;
  rows.forEach(r => $$('button', r).forEach(b => b.addEventListener('click', () => {
    if (locked) return; const i = +r.dataset.i; ans[i] = +b.dataset.c; r.classList.remove('right', 'near'); $('.sort-why', r).hidden = true;
    $$('button', r).forEach(x => x.setAttribute('aria-pressed', String(x === b))); fb.innerHTML = '';
    verify.disabled = Object.keys(ans).length < cfg.items.length;
  })));
  verify.addEventListener('click', () => {
    tries++; let good = 0;
    rows.forEach(r => { const i = +r.dataset.i, ok = ans[i] === cfg.items[i].c; if (ok) good++; r.classList.add(ok ? 'right' : 'near'); if (!ok) { const w = $('.sort-why', r); w.hidden = false; w.innerHTML = cfg.items[i].hint || 'Escribe O, A o H junto a cada dato y busca la razón que une los dos.'; } });
    if (good === cfg.items.length) { locked = true; actions.innerHTML = ''; rows.forEach(r => { const w = $('.sort-why', r); w.hidden = false; w.innerHTML = cfg.items[+r.dataset.i].why; $$('button', r).forEach(b => b.disabled = true); }); feedback(fb, 'right', pick(RIGHT), cfg.right || ''); done(tries === 1); }
    else { feedback(fb, 'near', `Casi: ${good} de ${cfg.items.length} bien`, 'Lee la pista debajo de las situaciones en ámbar y cambia tu elección.'); verify.disabled = true; }
  });
}

/* Arrastrar al lugar (drag_to_target, con toques) */
function renderLabel(el, cfg, done) {
  const zones = { AB: [170, 118], CB: [408, 150], AC: [200, 256] };
  const names = { hip: 'Hipotenusa', opu: 'Cateto opuesto', ady: 'Cateto adyacente' };
  const zoneSvg = Object.entries(zones).map(([k, [x, y]], i) => `<g class="zone" data-z="${k}" tabindex="0" role="button" aria-label="Recuadro ${i + 1}, vacío"><rect x="${x - 65}" y="${y - 17}" width="130" height="34" rx="10"/><text x="${x}" y="${y + 5}" text-anchor="middle">?</text></g>`).join('');
  el.innerHTML = `${cfg.q ? `<p class="lead"><b>${cfg.q}</b></p>` : ''}<div class="figure" style="padding:6px">${ART.labelTri(cfg.theta, zoneSvg)}</div>
    <div class="bank" role="group" aria-label="Fichas"><span class="bank-label">Fichas · toca una ficha y luego un recuadro</span>${Object.entries(names).map(([k, t]) => `<button type="button" class="tile" data-t="${k}" aria-pressed="false">${t}</button>`).join('')}</div>${verifyBar()}`;
  const Z = $$('.zone', el), T = $$('.tile', el), verify = $('.btn-verify', el), fb = $('.fb', el), actions = $('.actions', el);
  let ans = {}, activeTile = null, activeZone = null, tries = 0, locked = false;
  function paint() {
    Z.forEach((z, i) => { const k = z.dataset.z; z.classList.toggle('filled', !!ans[k]); z.classList.toggle('active', activeZone === k); $('text', z).textContent = ans[k] ? names[ans[k]] : '?'; z.setAttribute('aria-label', `Recuadro ${i + 1}, ${ans[k] ? names[ans[k]] : 'vacío'}`); });
    const used = Object.values(ans);
    T.forEach(t => { t.classList.toggle('used', used.includes(t.dataset.t)); t.setAttribute('aria-pressed', String(activeTile === t.dataset.t)); });
    verify.disabled = Object.keys(ans).length < 3;
  }
  function place(zk, tk) { Object.keys(ans).forEach(k => { if (ans[k] === tk) delete ans[k]; }); ans[zk] = tk; activeTile = null; activeZone = null; Z.forEach(z => z.classList.remove('right', 'near')); fb.innerHTML = ''; announce(`${names[tk]} colocado`); paint(); }
  T.forEach(t => t.addEventListener('click', () => { if (locked) return; const tk = t.dataset.t; if (activeZone) { place(activeZone, tk); return; } activeTile = activeTile === tk ? null : tk; paint(); }));
  const zoneAct = (z) => { if (locked) return; const zk = z.dataset.z; if (activeTile) { place(zk, activeTile); return; } if (ans[zk]) { delete ans[zk]; z.classList.remove('right', 'near'); } activeZone = activeZone === zk ? null : zk; paint(); };
  Z.forEach(z => { z.addEventListener('click', () => zoneAct(z)); z.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoneAct(z); } }); });
  verify.addEventListener('click', () => {
    tries++; let good = 0;
    Z.forEach(z => { const ok = ans[z.dataset.z] === cfg.answer[z.dataset.z]; if (ok) good++; z.classList.remove('active'); z.classList.add(ok ? 'right' : 'near'); });
    if (good === 3) { locked = true; actions.innerHTML = ''; $('.bank', el).remove(); feedback(fb, 'right', pick(RIGHT), cfg.right); done(tries === 1); }
    else { feedback(fb, 'near', `Casi: ${good} de 3 bien`, cfg.near); verify.disabled = true; }
  });
  paint();
}

/* Problema guiado: subpasos que se desbloquean en orden */
function renderGuided(el, cfg, done) {
  el.innerHTML = cfg.parts.map((p, i) => `<div class="quiz-item" data-p="${i}" ${i ? 'hidden' : ''}><div class="quiz-q"><span class="qtag">Paso ${i + 1} de ${cfg.parts.length}</span>${p.title}</div><div></div></div>`).join('') + '<div class="fb-final"></div>';
  const parts = $$('[data-p]', el); let allFirst = true;
  function run(i) {
    const host = parts[i].lastElementChild, p = cfg.parts[i];
    const next = (ok) => { allFirst = allFirst && ok; if (i + 1 < parts.length) { parts[i + 1].hidden = false; run(i + 1); parts[i + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } else { feedback($('.fb-final', el), 'teach', cfg.endTitle, cfg.end); done(allFirst); } };
    (p.type === 'num' ? renderNum : renderChoice)(host, p, next);
  }
  run(0);
}

/* Texto libre guardado en el dispositivo */
function renderText(el, cfg, done, id) {
  el.innerHTML = `<label class="sr-only" for="ta-${id}">${cfg.label || 'Tu respuesta'}</label><textarea class="reflect" id="ta-${id}" placeholder="${cfg.ph || 'Escribe aquí…'}"></textarea><div class="saved" aria-live="polite"></div>`;
  const ta = $('textarea', el), sv = $('.saved', el);
  ta.value = S.notes[id] || '';
  let t;
  ta.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      S.notes[id] = ta.value; save();
      const enough = ta.value.trim().length >= (cfg.min || 15);
      sv.textContent = enough ? '✓ Guardado en este dispositivo' : `Guardado. Escribe un poco más para completar (${ta.value.trim().length}/${cfg.min || 15}).`;
      if (enough) done(true);
    }, 400);
  });
}

/* Autoevaluación */
function renderSelf(el, cfg, done) {
  const levels = ['Todavía no', 'Con ayuda', 'Lo logro solo'];
  el.innerHTML = `<div class="self">${cfg.items.map((t, i) => `<div class="self-row"><p>${t}</p><div class="seg" role="group" aria-label="${strip(t)}">${levels.map((l, j) => `<button type="button" data-i="${i}" data-l="${j}" aria-pressed="${S.self[i] === j}">${l}</button>`).join('')}</div></div>`).join('')}</div><div class="fb"></div>`;
  const fb = $('.fb', el);
  const check = () => {
    if (cfg.items.every((_, i) => S.self[i] != null)) {
      const low = cfg.items.map((t, i) => S.self[i] === 0 ? cfg.review[i] : null).filter(Boolean);
      feedback(fb, 'teach', 'Gracias por tu honestidad', low.length ? `Te recomendamos repasar: ${low.join(' · ')}.` : 'Vas muy bien. Ahora pon a prueba lo aprendido en el reto final con tu grupo.');
      done(true);
    }
  };
  $$('button', el).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; S.self[i] = +b.dataset.l; save(); $$(`button[data-i="${i}"]`, el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); check(); }));
  if (cfg.items.every((_, i) => S.self[i] != null)) check();
}

/* ------------------------------------------------------------ Manipuladores */
function sliderCtl(id, label, min, max, step, val, unit) {
  return `<div class="control"><div class="control-head"><label for="${id}">${label}</label><output id="${id}-o"></output></div>
    <div class="control-row"><button type="button" class="stepbtn" data-for="${id}" data-d="-1" aria-label="Disminuir ${label}">−</button><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-valuetext="${val} ${unit}"><button type="button" class="stepbtn" data-for="${id}" data-d="1" aria-label="Aumentar ${label}">+</button></div></div>`;
}
function wireSteppers(root, onChange) {
  $$('.stepbtn', root).forEach(b => b.addEventListener('click', () => {
    const r = $('#' + b.dataset.for, root); const st = +r.step || 1;
    r.value = String(Math.min(+r.max, Math.max(+r.min, +r.value + st * +b.dataset.d))); onChange();
  }));
  $$('input[type="range"]', root).forEach(r => r.addEventListener('input', onChange));
}

/* El nombre depende de dónde miras */
function renderRole(el, cfg, done) {
  el.innerHTML = `<div class="manip"><div class="segbar" role="group" aria-label="Ángulo de referencia"><button type="button" data-th="A" aria-pressed="true">θ abajo, en el suelo</button><button type="button" data-th="B" aria-pressed="false">θ arriba, en el muro</button></div>
    <div class="stage" style="margin-top:12px" role="img" aria-live="polite"></div>
    <div class="legend"><span class="h">hipotenusa</span><span class="o">cateto opuesto</span><span class="a">cateto adyacente</span></div>
    <div class="calc-line" style="text-align:left;font-weight:600"></div></div><div class="sub" style="margin-top:14px"></div>`;
  const stage = $('.stage', el), line = $('.calc-line', el), seen = new Set();
  const txt = { A: 'Con θ en el suelo: el <b class="o">muro</b> está frente a θ, así que es el <b class="o">cateto opuesto</b>. El <b class="a">suelo</b> toca a θ: es el <b class="a">cateto adyacente</b>.', B: 'Con θ arriba, en el muro: ahora el <b class="o">suelo</b> está frente a θ y es el <b class="o">cateto opuesto</b>. El <b class="a">muro</b> toca a θ: es el <b class="a">cateto adyacente</b>. La <b class="h">escalera</b> sigue siendo la hipotenusa.' };
  function draw(th) { seen.add(th); stage.innerHTML = ART.roleTri(th); stage.setAttribute('aria-label', strip(txt[th])); line.innerHTML = txt[th]; $$('[data-th]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.th === th))); if (seen.size === 2 && !$('.sub', el).innerHTML) renderChoice($('.sub', el), cfg.check, done); }
  $$('[data-th]', el).forEach(b => b.addEventListener('click', () => draw(b.dataset.th)));
  draw('A');
}

/* Semejanza: el ángulo manda */
function renderSimilar(el, cfg, done) {
  el.innerHTML = `<div class="manip"><div class="stage" role="img"></div><div class="controls">${sliderCtl('simL', 'Tamaño (largo del rayo de sol)', 2, 10, .5, 5, 'm')}${sliderCtl('simA', 'Ángulo θ del sol', 10, 80, 1, 37, 'grados')}</div>
    <div class="readouts"></div></div><div class="sub" style="margin-top:14px"></div>`;
  const stage = $('.stage', el), ro = $('.readouts', el); let movedL = false, movedA = false, lastL = 5, lastA = 37;
  function upd() {
    const L = +$('#simL', el).value, a = +$('#simA', el).value;
    if (L !== lastL) movedL = true; if (a !== lastA) movedA = true; lastL = L; lastA = a;
    const o = L * Math.sin(a * RAD), ad = L * Math.cos(a * RAD);
    $('#simL-o', el).textContent = fmt(L, 1) + ' m'; $('#simA-o', el).textContent = a + '°';
    $('#simL', el).setAttribute('aria-valuetext', fmt(L, 1) + ' metros'); $('#simA', el).setAttribute('aria-valuetext', a + ' grados');
    stage.innerHTML = ART.similar(a, L);
    stage.setAttribute('aria-label', `Triángulo con ángulo de ${a} grados: guadua ${fmt(o)} m, sombra ${fmt(ad)} m, rayo ${fmt(L)} m.`);
    ro.innerHTML = `<div class="readout"><small class="o">Guadua (opuesto)</small><b>${fmt(o)} m</b></div><div class="readout"><small class="a">Sombra (adyacente)</small><b>${fmt(ad)} m</b></div><div class="readout"><small class="h">Rayo (hipotenusa)</small><b>${fmt(L)} m</b></div>
      <div class="readout hl"><small>opuesto ÷ hipotenusa</small><b>${fmt(o / L, 3)}</b></div><div class="readout hl"><small>adyacente ÷ hipotenusa</small><b>${fmt(ad / L, 3)}</b></div><div class="readout hl"><small>opuesto ÷ adyacente</small><b>${fmt(o / ad, 3)}</b></div>`;
    if (movedL && movedA && !$('.sub', el).innerHTML) renderChoice($('.sub', el), cfg.check, done);
  }
  wireSteppers(el, upd); upd();
  $('.sub', el).innerHTML = '';
  const hint = document.createElement('p'); hint.className = 'note'; hint.innerHTML = 'Mueve primero el <b>tamaño</b> y luego el <b>ángulo</b>. Después aparecerá una pregunta.'; $('.manip', el).appendChild(hint);
  const obs = () => { if ($('.sub', el).innerHTML) hint.remove(); };
  el.addEventListener('input', obs); el.addEventListener('click', obs);
}

/* Laboratorio de medición */
function renderLab(el, cfg, done) {
  const st = { obj: 'palm', ang: 35, d: 12, eye: 1.5, useEye: false };
  const objs = { palm: 'Palma de cera', guadua: 'Guadua', tower: 'Torre' };
  el.innerHTML = `<div class="manip"><div class="segbar" role="group" aria-label="Objeto">${Object.entries(objs).map(([k, t]) => `<button type="button" data-o="${k}" aria-pressed="${k === st.obj}">${t}</button>`).join('')}</div>
    <div class="stage" style="margin-top:12px" role="img"></div>
    <div class="controls">${sliderCtl('labA', 'Ángulo de elevación', 5, 85, 1, st.ang, 'grados')}${sliderCtl('labD', 'Distancia horizontal', 1, 100, .5, st.d, 'metros')}
      <div class="control"><label class="toggle"><input type="checkbox" id="labE"> Sumar la altura de mis ojos</label>
      <div class="control-row" id="labEyeRow" hidden><input type="range" id="labEye" min="1" max="1.9" step=".05" value="1.5" aria-label="Altura de los ojos"><output id="labEye-o" style="font-weight:900;min-width:70px;text-align:right"></output></div></div></div>
    <div class="readouts"></div><div class="calc-line"></div>
    <div class="actions"><button type="button" class="btn btn-quiet" id="labRec">📋 Registrar este intento</button></div>
    <div class="challenge" aria-live="polite"></div></div>`;
  const stage = $('.stage', el), ro = $('.readouts', el), cl = $('.calc-line', el), ch = $('.challenge', el);
  const H = () => st.d * Math.tan(st.ang * RAD), T = () => H() + (st.useEye ? st.eye : 0);
  function upd() {
    st.ang = +$('#labA', el).value; st.d = +$('#labD', el).value; st.useEye = $('#labE', el).checked; st.eye = +$('#labEye', el).value;
    $('#labEyeRow', el).hidden = !st.useEye;
    const t = Math.tan(st.ang * RAD), h = H(), tot = T();
    $('#labA-o', el).textContent = st.ang + '°'; $('#labD-o', el).textContent = fmt(st.d, 1) + ' m'; $('#labEye-o', el).textContent = fmt(st.eye, 2) + ' m';
    $('#labA', el).setAttribute('aria-valuetext', st.ang + ' grados'); $('#labD', el).setAttribute('aria-valuetext', fmt(st.d, 1) + ' metros');
    stage.innerHTML = ART.lab(Object.assign({}, st, { dTxt: fmt(st.d, 1), hTxt: fmt(h, 2) }));
    stage.setAttribute('aria-label', `${objs[st.obj]} a ${fmt(st.d, 1)} metros, ángulo de elevación ${st.ang} grados. Altura calculada ${fmt(tot, 2)} metros.`);
    ro.innerHTML = `<div class="readout"><small>tan(${st.ang}°)</small><b>${fmt(t, 4)}</b></div><div class="readout"><small>distancia × tan</small><b>${fmt(h, 2)} m</b></div><div class="readout hl"><small>Altura ${st.useEye ? 'total' : 'estimada'}</small><b>${fmt(tot, 2)} m</b></div>`;
    cl.innerHTML = `${fmt(st.d, 1)} × tan(${st.ang}°) = ${fmt(st.d, 1)} × ${fmt(t, 4)} ≈ <span class="o">${fmt(h, 2)} m</span>${st.useEye ? ` &nbsp;+ ${fmt(st.eye, 2)} m de los ojos = <b>${fmt(tot, 2)} m</b>` : ''}`;
  }
  const chall = [
    { p: 'Reto 1 · Deja la distancia en <b>12 m</b>, sin sumar los ojos. ¿Con qué ángulo la altura es <b>igual a la distancia</b> (12 m)?', ok: () => !st.useEye && st.d === 12 && st.ang === 45, win: '¡45°! Con ese ángulo, tan 45° = 1: el cateto opuesto y el adyacente miden lo mismo.', hint: () => !st.useEye && st.d === 12 ? (H() < 12 ? 'Todavía te falta altura: sube el ángulo.' : 'Te pasaste: baja el ángulo.') : 'Pon la distancia en 12 m y desactiva «Sumar la altura de mis ojos».' },
    { p: 'Reto 2 · Pon el ángulo en <b>40°</b>, sin sumar los ojos. ¿A qué distancia la altura llega a unos <b>21 m</b>?', ok: () => !st.useEye && st.ang === 40 && Math.abs(H() - 21) <= .5, win: '¡Bien! A unos 25 m: 25 × tan 40° ≈ 25 × 0,839 ≈ 20,98 m. Más distancia, más altura.', hint: () => st.ang !== 40 || st.useEye ? 'Deja el ángulo exactamente en 40° y los ojos sin sumar.' : (H() < 21 ? `Con ${fmt(st.d, 1)} m la altura es ${fmt(H(), 2)} m: aléjate más.` : `Con ${fmt(st.d, 1)} m la altura es ${fmt(H(), 2)} m: acércate un poco.`) },
    { p: 'Reto 3 · Una palma de cera mide <b>50 m</b>. Estás a <b>20 m</b> (sin sumar los ojos). ¿Con qué ángulo ves su copa?', ok: () => !st.useEye && st.d === 20 && Math.abs(H() - 50) <= 1.6, win: '¡Unos 68°! Para objetos muy altos y cercanos, el ángulo se acerca a 90°.', hint: () => st.d !== 20 || st.useEye ? 'Pon la distancia en 20 m y desactiva los ojos.' : (H() < 50 ? `Con ${st.ang}° la altura es ${fmt(H(), 2)} m: sube el ángulo.` : `Con ${st.ang}° la altura es ${fmt(H(), 2)} m: baja el ángulo.`) },
  ];
  let ci = 0, fails = 0;
  function drawCh(msg) {
    if (ci >= chall.length) { ch.innerHTML = `<div class="challenge-count">Retos completados</div><div class="challenge-prompt">¡Superaste los tres retos del laboratorio! 🌴</div><div class="challenge-fb">Sigue explorando y registra tus intentos para la pantalla 3.</div>`; return; }
    ch.innerHTML = `<div class="challenge-count">Reto ${ci + 1} de ${chall.length}</div><div class="challenge-prompt">${chall[ci].p}</div><button type="button" class="btn btn-quiet" id="chkCh">Comprobar reto</button><div class="challenge-fb">${msg || ''}</div>`;
    $('#chkCh', ch).addEventListener('click', () => {
      if (chall[ci].ok()) { const w = chall[ci].win; ci++; if (ci >= chall.length) { done(fails === 0); } drawCh(ci < chall.length ? '✓ ' + w : ''); if (ci >= chall.length) ch.insertAdjacentHTML('beforeend', `<div class="challenge-fb">✓ ${w}</div>`); }
      else { fails++; $('.challenge-fb', ch).innerHTML = '! ' + chall[ci].hint(); }
    });
  }
  $$('[data-o]', el).forEach(b => b.addEventListener('click', () => { st.obj = b.dataset.o; $$('[data-o]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); upd(); }));
  $('#labE', el).addEventListener('change', upd);
  $('#labRec', el).addEventListener('click', () => {
    S.records.push({ o: objs[st.obj], a: st.ang, d: st.d, t: Math.tan(st.ang * RAD), h: T(), e: st.useEye });
    if (S.records.length > 8) S.records.shift();
    save(); drawRecords(); announce('Intento registrado en la tabla de la pantalla 3.');
    const b = $('#labRec', el); b.textContent = '✓ Registrado · registrar otro'; setTimeout(() => { b.textContent = '📋 Registrar este intento'; }, 1600);
  });
  wireSteppers(el, upd); upd(); drawCh();
}
function drawRecords() {
  const tb = $('#recBody'); if (!tb) return;
  tb.innerHTML = S.records.length ? S.records.map((r, i) => `<tr><td>${i + 1}</td><td>${r.o}</td><td>${r.a}°</td><td>${fmt(r.d, 1)} m</td><td>${fmt(r.t, 4)}</td><td><b>${fmt(r.h, 2)} m</b>${r.e ? ' <small>(con ojos)</small>' : ''}</td></tr>`).join('') : '<tr><td colspan="6" style="color:var(--muted)">Todavía no has registrado intentos. Ve al laboratorio (pantalla 2) y pulsa «Registrar este intento».</td></tr>';
}

/* Calculadora trigonométrica */
function renderCalc(el, cfg, done) {
  el.innerHTML = `<div class="manip"><div class="segbar" role="tablist" aria-label="Modo de la calculadora"><button type="button" role="tab" data-m="1" aria-pressed="true" aria-selected="true">Valor de una razón</button><button type="button" role="tab" data-m="2" aria-pressed="false" aria-selected="false">Resolver un triángulo</button></div>
    <div data-pane="1" style="margin-top:12px">
      <p>Mueve el ángulo. La hipotenusa mide <b>1</b>, así que el cateto opuesto <b>es</b> el seno y el adyacente <b>es</b> el coseno.</p>
      <div class="stage" role="img"></div>
      <div class="controls">${sliderCtl('calA', 'Ángulo θ', 0, 90, 1, 30, 'grados')}</div>
      <div class="readouts"></div>
    </div>
    <div data-pane="2" hidden style="margin-top:12px">
      <p>Escribe un ángulo agudo y la medida de un lado. La calculadora encuentra los otros dos y te muestra cómo.</p>
      <div class="cards3" style="margin:0">
        <div class="control"><label for="c2a" style="font-weight:800">Ángulo θ (°)</label><input id="c2a" class="num-input" style="width:100%;margin-top:6px" inputmode="decimal" value="35"></div>
        <div class="control"><label for="c2k" style="font-weight:800">Lado que conozco</label><select id="c2k" class="num-input" style="width:100%;margin-top:6px;font-size:16px"><option value="a">Cateto adyacente</option><option value="o">Cateto opuesto</option><option value="h">Hipotenusa</option></select></div>
        <div class="control"><label for="c2v" style="font-weight:800">Mide (m)</label><input id="c2v" class="num-input" style="width:100%;margin-top:6px" inputmode="decimal" value="12"></div>
      </div>
      <div class="actions"><button type="button" class="btn btn-verify" id="c2go">Calcular</button></div>
      <div class="c2out"></div>
    </div></div>`;
  const stage = $('.stage', el), ro = $('[data-pane="1"] .readouts', el);
  function upd1() {
    const a = +$('#calA', el).value, s = Math.sin(a * RAD), c = Math.cos(a * RAD);
    $('#calA-o', el).textContent = a + '°'; $('#calA', el).setAttribute('aria-valuetext', a + ' grados');
    stage.innerHTML = ART.unit(a); stage.setAttribute('aria-label', `Ángulo ${a} grados: seno ${fmt(s, 4)}, coseno ${fmt(c, 4)}.`);
    ro.innerHTML = `<div class="readout"><small class="o">sen ${a}°</small><b>${fmt(s, 4)}</b></div><div class="readout"><small class="a">cos ${a}°</small><b>${fmt(c, 4)}</b></div><div class="readout hl"><small>tan ${a}°</small><b>${a === 90 ? 'no existe' : fmt(Math.tan(a * RAD), 4)}</b></div>`;
  }
  wireSteppers($('[data-pane="1"]', el), upd1); upd1();
  $$('[data-m]', el).forEach(b => b.addEventListener('click', () => { $$('[data-m]', el).forEach(x => { const on = x === b; x.setAttribute('aria-pressed', String(on)); x.setAttribute('aria-selected', String(on)); }); $$('[data-pane]', el).forEach(p => p.hidden = p.dataset.pane !== b.dataset.m); }));
  $('#c2go', el).addEventListener('click', () => {
    const a = parseNum($('#c2a', el).value), k = $('#c2k', el).value, v = parseNum($('#c2v', el).value), out = $('.c2out', el);
    if (!(a > 0 && a < 90)) { feedback(out, 'near', 'Revisa el ángulo', 'En un triángulo rectángulo, el ángulo θ debe estar entre 0° y 90° (sin incluirlos).'); return; }
    if (!(v > 0)) { feedback(out, 'near', 'Revisa la medida', 'La medida del lado debe ser un número mayor que cero.'); return; }
    const s = Math.sin(a * RAD), c = Math.cos(a * RAD), t = Math.tan(a * RAD);
    let o, ad, h, lines;
    const A = fmt(a, a % 1 ? 1 : 0);
    if (k === 'a') { ad = v; o = v * t; h = v / c; lines = [`Conozco el <b class="a">adyacente</b> = ${fmt(v)} m.`, `<b>TOA:</b> opuesto = adyacente × tan θ = ${fmt(v)} × tan(${A}°) = ${fmt(v)} × ${fmt(t, 4)} ≈ <b class="o">${fmt(o)} m</b>`, `<b>CAH:</b> hipotenusa = adyacente ÷ cos θ = ${fmt(v)} ÷ ${fmt(c, 4)} ≈ <b class="h">${fmt(h)} m</b>`]; }
    if (k === 'o') { o = v; ad = v / t; h = v / s; lines = [`Conozco el <b class="o">opuesto</b> = ${fmt(v)} m.`, `<b>TOA:</b> adyacente = opuesto ÷ tan θ = ${fmt(v)} ÷ ${fmt(t, 4)} ≈ <b class="a">${fmt(ad)} m</b>`, `<b>SOH:</b> hipotenusa = opuesto ÷ sen θ = ${fmt(v)} ÷ ${fmt(s, 4)} ≈ <b class="h">${fmt(h)} m</b>`]; }
    if (k === 'h') { h = v; o = v * s; ad = v * c; lines = [`Conozco la <b class="h">hipotenusa</b> = ${fmt(v)} m.`, `<b>SOH:</b> opuesto = hipotenusa × sen θ = ${fmt(v)} × ${fmt(s, 4)} ≈ <b class="o">${fmt(o)} m</b>`, `<b>CAH:</b> adyacente = hipotenusa × cos θ = ${fmt(v)} × ${fmt(c, 4)} ≈ <b class="a">${fmt(ad)} m</b>`]; }
    out.innerHTML = `<div class="figure">${ART.tri(o, ad, { o: fmt(o) + ' m', a: fmt(ad) + ' m', h: fmt(h) + ' m' })}<figcaption>Ángulo θ = ${A}°. El dibujo está a escala.</figcaption></div><ol class="steps">${lines.map((l, i) => `<li class="step"><span class="step-n">${i + 1}</span><div class="step-act" style="font-weight:600">${l}</div></li>`).join('')}</ol>`;
    announce(`Opuesto ${fmt(o)} metros, adyacente ${fmt(ad)} metros, hipotenusa ${fmt(h)} metros.`);
    done(true);
  });
}

/* Video. YouTube exige saber desde qué sitio web se incrusta (el «referente»).
   Un archivo abierto con doble clic (file://) no tiene sitio, así que el
   reproductor incrustado falla (error 153). En ese caso el botón abre el
   video en YouTube; publicado en un sitio web, se reproduce aquí mismo. */
function mountVideo(box, withLink) {
  if (!box) return;
  const YT = 'https://youtu.be/qEzqqdJhSCM';
  const local = !/^https?:$/.test(location.protocol);
  box.innerHTML = `<button type="button" class="video-poster" aria-label="${local ? 'Abrir en YouTube el video' : 'Reproducir el video'} Trigonometría en el entorno"><span class="play"><svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="#1769e8"/></svg></span>Trigonometría en el entorno<small style="font-weight:700;opacity:.8">${local ? 'Toca para verlo en YouTube · requiere internet' : 'Toca para reproducir · requiere internet'}</small></button>`;
  $('button', box).addEventListener('click', () => {
    if (local) { window.open(YT, '_blank', 'noopener'); return; }
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/qEzqqdJhSCM?autoplay=1&rel=0&cc_load_policy=1&hl=es" title="Video: Trigonometría en el entorno" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
  });
  if (withLink) {
    box.insertAdjacentHTML('afterend', `<p class="video-alt" style="margin:-4px 0 10px;font-size:14px"><a href="${YT}" target="_blank" rel="noopener">Ver en YouTube ↗</a>${local ? ' <span style="color:var(--muted)">· Como abriste el recurso desde un archivo, el video se abre en YouTube en una pestaña nueva.</span>' : ''}</p>`);
  }
}

/* Cuestionario de evaluación */
function renderQuiz(el, cfg, done) {
  const OBJ = cfg.objectives;
  function result() {
    const n = cfg.items.length, right = cfg.items.filter((_, i) => S.quiz[i]).length;
    const rows = Object.entries(OBJ).map(([k, o]) => {
      const idx = cfg.items.map((it, i) => it.obj === k ? i : -1).filter(i => i >= 0), g = idx.filter(i => S.quiz[i]).length, okAll = g === idx.length, okMost = g >= Math.ceil(idx.length * 2 / 3);
      return `<div class="objective"><div class="objective-head"><span>${o.t}</span><span class="objective-state ${okMost ? 'right' : 'near'}">${g} de ${idx.length}</span></div><p>${okAll ? 'Logrado. ¡Muy bien!' : okMost ? 'Casi logrado. ' + o.tip : 'Por reforzar. ' + o.tip}</p></div>`;
    }).join('');
    const msg = right >= n - 1 ? '¡Excelente! Dominas la trigonometría de tu territorio.' : right >= Math.ceil(n * .6) ? 'Buen trabajo. Repasa el objetivo que salió en ámbar.' : 'Vas en camino. Repasa los momentos que te sugerimos y vuelve a intentarlo.';
    return `<div class="result-hero" style="margin-top:18px"><div class="result-score">${right}<small> / ${n}</small></div><p style="margin:8px 0 0">${msg}</p></div><div class="objectives">${rows}</div><div class="actions"><button class="btn btn-quiet" type="button" id="quizRetry">↺ Volver a intentarlo</button></div>`;
  }
  function wireRetry() { const b = $('#quizRetry', el); if (b) b.addEventListener('click', () => { S.quiz = {}; save(); start(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
  function start() {
    el.innerHTML = cfg.items.map((it, i) => `<div class="quiz-item"><div class="quiz-q"><span class="qtag">${i + 1} de ${cfg.items.length}</span>${it.title}</div><div></div></div>`).join('') + '<div class="quiz-res"></div>';
    $$('.quiz-item', el).forEach((box, i) => {
      const it = Object.assign({ once: true }, cfg.items[i]);
      (it.type === 'num' ? renderNum : renderChoice)(box.lastElementChild, it, (ok) => {
        S.quiz[i] = ok; save();
        if (cfg.items.every((_, j) => S.quiz[j] != null)) { $('.quiz-res', el).innerHTML = result(); wireRetry(); done(true); $('.quiz-res', el).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }
  if (cfg.items.every((_, j) => S.quiz[j] != null)) { el.innerHTML = `<p class="note">Ya respondiste la comprobación. Este es tu resultado:</p>${result()}`; wireRetry(); }
  else { S.quiz = {}; start(); }
}

/* Tabla del reto final */
function renderReto(el, cfg, done) {
  const tb = $('#retoBody'); if (!tb) return;
  S.reto.rows = S.reto.rows || Array.from({ length: 4 }, () => ({ n: '', d: '', a: '', e: '1,5' }));
  const obj = $('#retoObj'); obj.value = S.reto.obj || ''; obj.addEventListener('input', () => { S.reto.obj = obj.value; save(); });
  tb.innerHTML = S.reto.rows.map((r, i) => `<tr data-r="${i}"><td><input aria-label="Integrante ${i + 1}" data-k="n" value="${esc(r.n)}" placeholder="Nombre"></td><td><input aria-label="Distancia de ${i + 1} en metros" data-k="d" inputmode="decimal" value="${esc(r.d)}" placeholder="0,0"></td><td><input aria-label="Ángulo de ${i + 1} en grados" data-k="a" inputmode="decimal" value="${esc(r.a)}" placeholder="0"></td><td><input aria-label="Altura de los ojos de ${i + 1} en metros" data-k="e" inputmode="decimal" value="${esc(r.e)}"></td><td><b class="hcell">—</b></td></tr>`).join('');
  function calc() {
    const hs = [];
    $$('tr', tb).forEach(tr => {
      const r = S.reto.rows[+tr.dataset.r], d = parseNum(r.d), a = parseNum(r.a), e = parseNum(r.e) || 0, cell = $('.hcell', tr);
      if (d > 0 && a > 0 && a < 90) { const h = d * Math.tan(a * RAD) + e; hs.push(h); cell.textContent = fmt(h) + ' m'; } else cell.textContent = '—';
    });
    $('#retoAvg').textContent = hs.length ? fmt(hs.reduce((x, y) => x + y, 0) / hs.length) + ' m' : '—';
    $('#retoRange').textContent = hs.length > 1 ? fmt(Math.max(...hs) - Math.min(...hs)) + ' m' : '—';
    if (hs.length >= 2) done(true);
  }
  $$('input', tb).forEach(inp => inp.addEventListener('input', () => { const tr = inp.closest('tr'); S.reto.rows[+tr.dataset.r][inp.dataset.k] = inp.value; save(); calc(); }));
  calc();
}

const RENDER = { choice: renderChoice, num: renderNum, pairs: renderPairs, seq: renderSeq, cloze: renderCloze, worked: renderWorked, error: renderError, sort: renderSort, label: renderLabel, guided: renderGuided, text: renderText, self: renderSelf, role: renderRole, similar: renderSimilar, lab: renderLab, calc: renderCalc, quiz: renderQuiz, reto: renderReto };

/* ------------------------------------------------------------ Navegación */
function buildNav() {
  const secs = $$('.section');
  $('#navlist').innerHTML = secs.map(s => `<li><a class="navlink" href="#${s.id}" data-nav="${s.id}"><span class="nav-ico">${s.dataset.icon}</span><span class="nav-txt"><b>${s.dataset.title}</b><small>${s.dataset.sub}</small>${s.id !== 'inicio' && s.id !== 'recursos' ? '<span class="nav-bar"><i></i></span>' : ''}</span></a></li>`).join('');
  $('#tabbar').innerHTML = secs.map(s => `<a class="tab" href="#${s.id}" data-nav="${s.id}">${s.dataset.short}</a>`).join('');
  const route = secs.filter(s => /^(explorar|comprender|experimentar|aplicar|evaluar)$/.test(s.id));
  const blurbs = { explorar: 'Reconocer el triángulo rectángulo y sus lados.', comprender: 'Entender seno, coseno y tangente.', experimentar: 'Laboratorio y calculadora.', aplicar: 'Resolver problemas del territorio.', evaluar: 'Comprobar y reflexionar.' };
  $('#routeCards').innerHTML = route.map((s, i) => `<a class="route-card" href="#${s.id}" data-nav="${s.id}"><span class="nav-ico">${s.dataset.icon}</span><b>${s.dataset.title}</b><small>${blurbs[s.id]}</small><small style="font-weight:800">Sesión ${[1, 2, 3, 4, 4][i]}</small></a>`).join('');
}
function show(id) {
  const target = document.getElementById(id);
  if (!target || !target.classList.contains('section')) id = 'inicio';
  $$('.section').forEach(s => s.classList.toggle('is-active', s.id === id));
  $$('[data-nav]').forEach(n => { if (n.classList.contains('route-card')) return; if (n.dataset.nav === id) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current'); });
  const tab = $(`.tab[data-nav="${id}"]`); if (tab) tab.scrollIntoView({ inline: 'center', block: 'nearest' });
  S.prefs.last = id; save();
  window.scrollTo(0, 0);
  const sec = document.getElementById(id); const h = $('h1', sec); document.title = `${sec.dataset.title} · Trigonometría de mi territorio · MindoClass`;
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
}

/* ------------------------------------------------------------ Preferencias */
function applyPrefs() {
  const root = document.documentElement;
  root.style.setProperty('--scale', String(S.prefs.scale || 1));
  if (S.prefs.theme) root.setAttribute('data-theme', S.prefs.theme); else root.removeAttribute('data-theme');
  root.classList.toggle('contrast', !!S.prefs.contrast);
  const dark = S.prefs.theme ? S.prefs.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.classList.toggle('logo-dark', dark);
  $('#themeBtn').textContent = dark ? '☀' : '☾';
  $('#contrastBtn').setAttribute('aria-pressed', String(!!S.prefs.contrast));
}

/* ------------------------------------------------------------ Arranque */
function init() {
  buildNav();
  $$('[data-art]').forEach(n => {
    const k = n.dataset.art;
    const map = {
      tri6810: () => ART.tri(6, 8, { o: '6 m', a: '8 m', h: '10 m' }),
      tri51213: () => ART.tri(5, 12, { o: '5 m', a: '12 m', h: '13 m' }),
      elevation: () => ART.prob({ ang: 35, decor: 'palm', eye: true, a: 'distancia horizontal', h: 'línea de la mirada', shirt: '#16b875', eyeTxt: 'ojos' }).replace('35°', '35° ← ángulo de elevación'),
      cathedral: () => ART.prob({ ang: 60, decor: 'tower', eye: true, a: '60 m', o: '?', unknown: 'o' }),
      'p-slope': () => ART.prob({ ang: 30, decor: 'slope', h: '50 m', o: '?', unknown: 'o' }),
      'p-ladder': () => ART.prob({ ang: 65, decor: 'wall', h: '4 m', a: '?', unknown: 'a' }),
      'p-palm': () => ART.prob({ ang: 70, decor: 'palm', eye: true, a: '20 m', o: '?', unknown: 'o' }),
      'p-kite': () => ART.prob({ ang: 50, decor: 'kite', eye: true, eyeTxt: '1 m', h: '30 m', o: '?', unknown: 'o' }),
    };
    n.innerHTML = map[k] ? map[k]() : (ART[k] ? ART[k]() : '');
  });
  $$('[data-act]').forEach(n => {
    const id = n.dataset.act, cfg = ACTS[id];
    if (!cfg) return;
    const sec = n.closest('.section').id;
    if (cfg.track !== false) tracked.set(id, sec);
    try { RENDER[cfg.type](n, cfg, (ok) => markDone(id, ok), id); } catch (e) { console.error(id, e); }
  });
  mountVideo($('#video1'), true); mountVideo($('#video2'), false);
  drawRecords();
  $('#recClear').addEventListener('click', () => { S.records = []; save(); drawRecords(); });
  const go = (id) => { show(id); try { history.pushState(null, '', '#' + id); } catch (e) { /* sin historial: igual navega */ } };
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  $$('a[data-nav]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); go(a.dataset.nav); }));
  $('.brand').addEventListener('click', (e) => { e.preventDefault(); go('inicio'); });
  $('#fontUp').addEventListener('click', () => { S.prefs.scale = Math.min(1.4, +((S.prefs.scale || 1) + .1).toFixed(2)); save(); applyPrefs(); });
  $('#fontDown').addEventListener('click', () => { S.prefs.scale = Math.max(.9, +((S.prefs.scale || 1) - .1).toFixed(2)); save(); applyPrefs(); });
  $('#contrastBtn').addEventListener('click', () => { S.prefs.contrast = !S.prefs.contrast; save(); applyPrefs(); });
  $('#themeBtn').addEventListener('click', () => { const dark = document.documentElement.classList.contains('logo-dark'); S.prefs.theme = dark ? 'light' : 'dark'; save(); applyPrefs(); });
  $('#resetAll').addEventListener('click', () => { if (confirm('¿Borrar todo tu avance, notas y registros de este dispositivo?')) { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } S = { done: {}, notes: {}, records: [], quiz: {}, self: {}, reto: {}, prefs: { last: 'inicio' } }; save(); location.reload(); } });
  applyPrefs();
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  window.addEventListener('popstate', () => show(location.hash.slice(1) || 'inicio'));
  show(location.hash.slice(1) || S.prefs.last || 'inicio');
  refreshProgress();
}

/* ------------------------------------------------------------ Contenido de las actividades */
const F = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const ACTS = {
  /* INICIO · diagnóstico */
  d1: { type: 'choice', q: '<b>1.</b> ¿Cuánto mide un ángulo recto, como la esquina de una puerta?', opts: [{ t: '45°', why: '45° es la mitad de un ángulo recto. Piensa en la esquina de un cuaderno: es «cuadrada».' }, { t: '90°', ok: true }, { t: '180°', why: '180° es una línea recta (media vuelta). La esquina de una puerta es la mitad de eso.' }], right: 'Un ángulo recto mide 90°. Se dibuja con un cuadrito en la esquina.' },
  d2: { type: 'choice', q: '<b>2.</b> En cualquier triángulo, los tres ángulos internos suman…', opts: [{ t: '90°', why: 'Recuerda: si recortas las tres esquinas de un triángulo de papel y las juntas, forman una línea recta.' }, { t: '180°', ok: true }, { t: '360°', why: '360° es una vuelta completa, la suma de los ángulos de un cuadrilátero. En un triángulo es la mitad.' }], right: 'Suman 180°. Por eso, en un triángulo rectángulo, los otros dos ángulos suman 90° y los dos son agudos (menores de 90°).' },
  d3: { type: 'choice', q: '<b>3.</b> ¿Cuánto es 6 ÷ 8 en número decimal?', opts: [{ t: '1,33', why: 'Ese es 8 ÷ 6. El orden importa: aquí 6 va arriba (el dividendo) y 8 abajo.' }, { t: '0,75', ok: true }, { t: '0,48', why: 'Revisa: 6 ÷ 8 es lo mismo que 3 ÷ 4, es decir, tres cuartos.' }], right: '6 ÷ 8 = 0,75 (tres cuartos). Dividir dos medidas para compararlas es justo lo que haremos con los lados del triángulo.' },

  /* 1 EXPLORAR */
  'ex-video': { type: 'text', ph: 'Ej.: la palma de cera del parque, porque no puedo subir hasta la copa…', min: 15, label: 'Objeto que te gustaría medir' },
  'ex-scenes': { type: 'choice', multi: true, grid: true, opts: [
    { t: 'Escalera de guadua apoyada en el muro de una casa de bahareque', art: 'ladder', ok: true },
    { t: 'Una palma de cera, su sombra en el suelo y el rayo de sol', art: 'shadow', ok: true },
    { t: 'El camino que sube por la ladera del cafetal', art: 'slope', ok: true },
    { t: 'La rueda de una chiva', art: 'wheel', why: 'La rueda es un círculo: no tiene lados rectos ni esquinas. Busca dónde una línea vertical se encuentra con el suelo horizontal.' }],
    missing: 'Vas bien, pero hay otra escena con una esquina de 90°. Busca dónde algo vertical se encuentra con el suelo horizontal.',
    right: 'En las tres primeras hay algo <b>vertical</b> (el muro, la palma, la altura de la loma) que forma 90° con el <b>suelo horizontal</b>, y una línea inclinada que los une (la escalera, el rayo de sol, el camino). Esa línea inclinada es la que nos interesa medir.' },
  'ex-parts': { type: 'worked', steps: [
    { act: 'Busca la esquina cuadrada: el <b>ángulo recto</b> (90°). Se marca con un cuadrito.', why: 'Todo empieza ahí: sin ángulo recto no hay triángulo rectángulo. Aquí está donde el muro toca el suelo.' },
    { act: 'El lado que está <b>frente</b> al ángulo recto se llama <b class="h">hipotenusa</b>. Es la escalera.', why: 'La hipotenusa es siempre el lado más largo del triángulo rectángulo. No importa cómo lo gires.' },
    { act: 'Los otros dos lados, los que forman la esquina de 90°, se llaman <b>catetos</b>: el muro y el suelo.', why: '«Cateto» viene del griego y significa «lo que cae vertical». Los catetos son los dos lados que se tocan en el ángulo recto.' },
    { act: 'Elige un ángulo agudo como referencia y llámalo <b>θ</b>. Aquí es el ángulo entre la escalera y el suelo.', why: 'Los nombres de los catetos dependen de este ángulo. Sin θ no podemos decir cuál es cuál.' },
    { act: 'El cateto que está <b>frente a θ</b>, sin tocarlo, es el <b class="o">cateto opuesto</b>: el muro.', why: '«Opuesto» significa «al frente». Si te paras en θ y miras al otro lado del triángulo, ves el muro.' },
    { act: 'El cateto que <b>toca a θ</b> es el <b class="a">cateto adyacente</b>: el suelo.', why: '«Adyacente» significa «que está al lado». El suelo y la escalera forman juntos el ángulo θ, pero la escalera ya tiene nombre: hipotenusa.' }],
    result: 'Hipotenusa = frente al ángulo recto (la más larga). Cateto opuesto = frente a θ. Cateto adyacente = toca a θ. ¡Con estos tres nombres ya puedes leer cualquier fórmula de trigonometría!' },
  'ex-role': { type: 'role', check: { type: 'choice', q: 'Ahora tú: si θ está arriba, en el muro, ¿cuál es el <b>cateto opuesto</b>?', opts: [{ t: 'El muro', why: 'El muro toca al ángulo θ cuando θ está arriba. Lo que toca a θ es adyacente.' }, { t: 'El suelo', ok: true }, { t: 'La escalera', why: 'La escalera está frente al ángulo recto: siempre es la hipotenusa.' }], right: 'Si θ está arriba, el suelo queda al frente y se vuelve el cateto opuesto. La hipotenusa nunca cambia: siempre es la escalera.' } },
  'ex-label1': { type: 'label', theta: 'A', q: 'Ronda 1 · El ángulo θ está en los ojos de Sara.', answer: { AB: 'hip', CB: 'opu', AC: 'ady' }, right: 'La línea de la mirada es la <b class="h">hipotenusa</b>, la palma está frente a θ (<b class="o">opuesto</b>) y el suelo toca a θ (<b class="a">adyacente</b>).', near: 'Párate mentalmente en θ: lo que está al frente es el opuesto; el cateto que te toca es el adyacente. La hipotenusa está frente a la esquina cuadrada.' },
  'ex-label2': { type: 'label', theta: 'B', q: 'Ronda 2 · Un barranquero se posa en la copa y mira a Sara: ahora θ está arriba.', answer: { AB: 'hip', CB: 'ady', AC: 'opu' }, right: 'Cambió el ángulo y cambiaron los catetos: ahora la palma toca a θ (<b class="a">adyacente</b>) y el suelo queda al frente (<b class="o">opuesto</b>). La <b class="h">hipotenusa</b> sigue igual.', near: 'Ahora θ está arriba, en la copa. ¿Qué lado toca la copa? ¿Qué lado queda lejos, al frente?' },
  'ex-reflect': { type: 'text', ph: 'Ej.: 1) La rampa de la entrada del colegio: el ángulo recto está donde la rampa termina y el muro sube. 2) …', min: 30, label: 'Situaciones de tu comunidad con triángulos rectángulos' },

  /* 2 COMPRENDER */
  'co-ratio': { type: 'choice', q: 'Otro camino sube <b>3 m</b> por cada <b>4 m</b> que avanza. Comparado con el de don Arturo (razón 0,75), ¿cómo es?', opts: [{ t: 'Más empinado, porque 3 es menos que 6', why: 'Compara las razones, no los números sueltos: 3 ÷ 4 = ?' }, { t: 'Igual de empinado: 3 ÷ 4 también es 0,75', ok: true }, { t: 'Menos empinado, porque avanza menos', why: 'Avanzar menos no dice nada solo. Lo que importa es cuánto sube por cada metro que avanza: 3 ÷ 4.' }], right: '3 ÷ 4 = 0,75, igual que 6 ÷ 8. Los dos caminos tienen la misma inclinación. Una razón no depende del tamaño, sino de la forma.' },
  'co-similar': { type: 'similar', check: { type: 'choice', q: 'Cuando cambiaste el <b>tamaño</b> sin tocar el ángulo, las tres divisiones de abajo…', opts: [{ t: 'Aumentaron, porque los lados crecieron', why: 'Mira otra vez los recuadros verdes al mover solo el tamaño. ¿Cambian?' }, { t: 'Se quedaron iguales; solo cambian cuando cambia el ángulo', ok: true }, { t: 'Disminuyeron', why: 'Mueve solo el tamaño y observa los recuadros verdes con atención.' }], right: 'Cuando el triángulo crece, sus lados crecen en la misma proporción y las divisiones no cambian. Solo el ángulo las cambia. Por eso cada ángulo tiene su seno, su coseno y su tangente.' } },
  'co-pairs': { type: 'pairs', left: ['Seno (SOH)', 'Coseno (CAH)', 'Tangente (TOA)', 'Hipotenusa'], right: [`${F('opuesto', 'hipotenusa')}`, `${F('adyacente', 'hipotenusa')}`, `${F('opuesto', 'adyacente')}`, 'El lado más largo, frente al ángulo recto'], order: [2, 3, 0, 1], right_msg: 'SOH: seno = opuesto ÷ hipotenusa. CAH: coseno = adyacente ÷ hipotenusa. TOA: tangente = opuesto ÷ adyacente.', near: 'Usa SOH-CAH-TOA: la primera letra es la razón; las otras dos, los lados de arriba y de abajo.' },
  'co-worked': { type: 'worked', steps: [
    { act: 'Nombra los lados respecto a θ: <b class="o">opuesto = 6</b> (el muro), <b class="a">adyacente = 8</b> (el suelo), <b class="h">hipotenusa = 10</b> (la guadua).', why: 'Siempre se empieza por nombrar. Si los nombres están mal, todo lo demás sale mal.' },
    { act: `<b>Seno</b> (SOH): sen θ = ${F('<span class="o">opuesto</span>', '<span class="h">hipotenusa</span>')} = ${F('6', '10')} = <b>0,6</b>`, why: 'SOH dice: Seno = Opuesto sobre Hipotenusa. 6 ÷ 10 = 0,6.' },
    { act: `<b>Coseno</b> (CAH): cos θ = ${F('<span class="a">adyacente</span>', '<span class="h">hipotenusa</span>')} = ${F('8', '10')} = <b>0,8</b>`, why: 'CAH dice: Coseno = Adyacente sobre Hipotenusa. 8 ÷ 10 = 0,8.' },
    { act: `<b>Tangente</b> (TOA): tan θ = ${F('<span class="o">opuesto</span>', '<span class="a">adyacente</span>')} = ${F('6', '8')} = <b>0,75</b>`, why: 'TOA dice: Tangente = Opuesto sobre Adyacente. ¡Es la misma razón del camino de don Arturo!' },
    { act: 'Revisa: el seno y el coseno dan menos de 1.', why: 'Como la hipotenusa es el lado más largo, al dividir un cateto entre ella siempre da menos de 1. Si te da más, te equivocaste de lado.' }],
    result: 'sen θ = 0,6 · cos θ = 0,8 · tan θ = 0,75. Si usas tu calculadora, encontrarás que θ ≈ 36,9°.' },
  'co-faded': { type: 'cloze', steps: [
    { act: 'Nombro los lados: opuesto = 5, adyacente = 12, hipotenusa = 13.', why: 'La rampa sube 5 (frente a θ), avanza 12 (toca a θ) y mide 13 (la inclinada).' },
    { act: `sen θ = ${F('{{g1}}', '{{g2}}')}`, why: 'SOH: opuesto (5) sobre hipotenusa (13).' },
    { act: `cos θ = ${F('{{g3}}', '13')} ≈ 0,92`, why: 'CAH: adyacente (12) sobre hipotenusa (13).' },
    { act: 'tan θ = {{g4}}', why: 'TOA: opuesto (5) sobre adyacente (12) ≈ 0,42.' }],
    tiles: [{ k: '5', t: '5' }, { k: '12', t: '12' }, { k: '13', t: '13' }, { k: 'f512', t: '5 ÷ 12' }, { k: 'f125', t: '12 ÷ 5' }],
    answer: { g1: '5', g2: '13', g3: '12', g4: 'f512' }, reuse: true,
    right: 'sen θ = 5/13 ≈ 0,38 · cos θ = 12/13 ≈ 0,92 · tan θ = 5/12 ≈ 0,42. ¡Completaste el procedimiento tú solo!',
    near: 'Recuerda SOH-CAH-TOA. Toca los huecos en ámbar para cambiarlos.' },
  'co-error': { type: 'error', steps: ['Paso 1. La hipotenusa es la guadua: 10 m.', 'Paso 2. El cateto adyacente a θ es el suelo: 8 m. El opuesto es el muro: 6 m.', `Paso 3. cos θ = ${F('opuesto', 'hipotenusa')} = ${F('6', '10')} = 0,6`], wrong: 2,
    okWhy: ['La guadua está frente al ángulo recto, así que sí es la hipotenusa. Este paso está bien.', 'El suelo toca a θ y el muro está al frente. Este paso está bien.'],
    found: 'Valentina usó el cateto <b>opuesto</b> en el coseno. Eso es el <b>seno</b>, no el coseno.',
    fix: { type: 'choice', q: '¿Cómo debió escribir el paso 3?', opts: [{ t: `cos θ = ${F('adyacente', 'hipotenusa')} = ${F('8', '10')} = 0,8`, ok: true }, { t: `cos θ = ${F('opuesto', 'adyacente')} = ${F('6', '8')} = 0,75`, why: 'Eso es la tangente (TOA).' }, { t: `cos θ = ${F('hipotenusa', 'adyacente')} = ${F('10', '8')} = 1,25`, why: 'Está al revés. Además, un coseno nunca puede ser mayor que 1.' }], right: 'CAH: Coseno = Adyacente sobre Hipotenusa = 8 ÷ 10 = 0,8.' } },
  'co-check': { type: 'choice', opts: [{ t: 'Seno', why: 'El seno usa la hipotenusa (SOH: opuesto ÷ hipotenusa). La pregunta pide los dos catetos.' }, { t: 'Coseno', why: 'El coseno usa la hipotenusa (CAH: adyacente ÷ hipotenusa). La pregunta pide los dos catetos.' }, { t: 'Tangente', ok: true }], right: 'La tangente relaciona el cateto opuesto con el cateto adyacente: tan θ = 6 ÷ 8 = 0,75. Es la única de las tres que no usa la hipotenusa.' },
  'co-seq': { type: 'seq', items: ['Revisar que la pantalla diga <b>DEG</b> (grados)', 'Presionar la tecla <b>tan</b>', 'Escribir <b>35</b>', 'Cerrar el paréntesis y presionar <b>=</b>', 'Leer el resultado: <b>0,7002…</b> y redondear a 0,70'], start: [2, 0, 4, 1, 3],
    right: 'tan(35°) ≈ 0,7002. Si te salió −0,4738, tu calculadora estaba en RAD: ¡revisa siempre el DEG primero!' },

  /* 3 EXPERIMENTAR */
  'xp-seq': { type: 'seq', items: ['Elegir un lugar plano frente al árbol', 'Medir con la cinta la distancia horizontal hasta la base del árbol', 'Mirar la copa por el pitillo y leer el ángulo que marca el hilo', 'Calcular el ángulo de elevación: 90° menos lo que marca el hilo', 'Calcular distancia × tan(ángulo) y sumar la altura de los ojos'], start: [1, 4, 0, 3, 2],
    right: 'Primero el lugar, luego las medidas, después el ángulo y al final el cálculo. Si cambias de lugar, tienes que volver a medir la distancia.' },
  'xp-lab': { type: 'lab' },
  'xp-c1': { type: 'choice', q: '<b>1.</b> Si dejas la <b>distancia fija</b> y <b>aumentas el ángulo</b>, la altura calculada…', opts: [{ t: 'Aumenta', ok: true }, { t: 'Disminuye', why: 'Prueba en el laboratorio: deja 12 m y sube el ángulo de 20° a 60°. ¿Qué pasa con la altura?' }, { t: 'No cambia', why: 'La tangente cambia con el ángulo. Pruébalo en el laboratorio.' }], right: 'Cuanto mayor es el ángulo, mayor es su tangente y más alto es el objeto. Un objeto alto se ve con un ángulo mayor.' },
  'xp-c2': { type: 'choice', q: '<b>2.</b> Con el <b>mismo ángulo</b>, si <b>duplicas la distancia</b> (por ejemplo, de 12 m a 24 m), la altura…', opts: [{ t: 'Se duplica', ok: true }, { t: 'Aumenta un poco', why: 'Haz la cuenta: altura = distancia × tan. Si la distancia es el doble y la tangente es la misma…' }, { t: 'Se reduce a la mitad', why: 'Prueba en el laboratorio: 35° con 12 m y luego con 24 m.' }], right: 'Altura = distancia × tan θ. Si la tangente no cambia y la distancia se duplica, la altura también se duplica. Es una relación proporcional.' },
  'xp-c3': { type: 'choice', q: '<b>3.</b> ¿Qué le pasa a tan θ cuando el ángulo se acerca a 90°?', opts: [{ t: 'Se acerca a 1', why: 'tan 45° = 1. Sube el ángulo en el laboratorio hasta 80° o 85° y mira el valor de la tangente.' }, { t: 'Crece muchísimo', ok: true }, { t: 'Se vuelve cero', why: 'La tangente vale 0 en 0°, no en 90°. Prueba con 85° en el laboratorio.' }], right: 'tan 80° ≈ 5,67 y tan 85° ≈ 11,43. Cerca de 90°, un error pequeño en el ángulo cambia muchísimo la altura. Por eso conviene medir desde lejos, con ángulos entre 30° y 60°.' },
  'xp-calc': { type: 'calc' },
  'xp-sen30': { type: 'choice', q: 'La calculadora dice que <b>sen 30° = 0,5</b>. ¿Qué significa eso en un triángulo rectángulo con un ángulo de 30°?', opts: [{ t: 'El cateto opuesto mide la mitad de la hipotenusa', ok: true }, { t: 'El ángulo mide la mitad de 60°', why: 'Eso es cierto, pero no es lo que dice el seno. El seno compara dos lados: opuesto ÷ hipotenusa.' }, { t: 'La hipotenusa mide 0,5 m', why: 'El seno no es una medida en metros: es una división entre dos lados. Puede ser un triángulo de cualquier tamaño.' }], right: 'Seno = opuesto ÷ hipotenusa = 0,5 = 1/2. Si una escalera de 4 m forma 30° con el suelo, llega a 2 m de altura.' },

  /* 4 APLICAR */
  'ap-sort': { type: 'sort', cats: ['Seno', 'Coseno', 'Tangente'], items: [
    { t: 'Conoces la distancia al árbol y el ángulo de elevación. Buscas la altura del árbol.', c: 2, why: 'Distancia = adyacente, altura = opuesto → O y A → <b>tangente</b>.', hint: 'La distancia al árbol toca el ángulo; la altura está al frente. ¿Qué razón une O y A?' },
    { t: 'Conoces cuánto mide el camino inclinado y su ángulo. Buscas cuánto subes.', c: 0, why: 'Camino = hipotenusa, lo que subes = opuesto → O y H → <b>seno</b>.', hint: 'El camino inclinado es la hipotenusa y lo que subes está frente al ángulo.' },
    { t: 'Conoces lo largo de la escalera y su ángulo con el suelo. Buscas a qué distancia del muro está el pie.', c: 1, why: 'Escalera = hipotenusa, distancia al muro = adyacente → A y H → <b>coseno</b>.', hint: 'La escalera es la hipotenusa; la distancia en el suelo toca el ángulo.' },
    { t: 'Conoces lo largo del hilo de la cometa y su ángulo. Buscas la altura de la cometa.', c: 0, why: 'Hilo = hipotenusa, altura = opuesto → O y H → <b>seno</b>.', hint: 'El hilo es inclinado (hipotenusa) y la altura está frente al ángulo.' },
    { t: 'Conoces el cable de una tarabita y su inclinación. Buscas la distancia horizontal que cruza el cañón.', c: 1, why: 'Cable = hipotenusa, distancia horizontal = adyacente → A y H → <b>coseno</b>.', hint: 'El cable es la hipotenusa; la distancia horizontal toca el ángulo.' }],
    right: 'Truco: si el problema habla de algo <b>inclinado</b> (camino, escalera, hilo, cable) es la hipotenusa → seno o coseno. Si solo hay distancia y altura → tangente.' },
  'ap-guided': { type: 'guided', endTitle: 'La torre mide unos 105 m', end: 'Tu cálculo: 60 × tan 60° + 1,5 ≈ 105,4 m. Según Radio Nacional de Colombia, la torre central de la Catedral Basílica de Manizales mide unos 106 m (otras fuentes dan hasta 115 m si se cuenta la escultura de la punta). ¡Con un transportador y una cinta métrica llegaste a menos de un metro de ese valor!<small class="src">Fuente: <a href="https://www.radionacional.co/noticias/actualidad/manizales-catedral-nuestra-se%C3%B1ora-rosario" target="_blank" rel="noopener">Radio Nacional de Colombia</a>. Nota: la torre resultó dañada en el sismo del 10 de agosto de 2026.</small>', parts: [
    { title: 'Nombra los lados. Respecto al ángulo de 60°, ¿qué conoces y qué buscas?', type: 'choice', opts: [{ t: 'Conozco el cateto adyacente (60 m) y busco el cateto opuesto (la altura)', ok: true }, { t: 'Conozco la hipotenusa (60 m) y busco el cateto opuesto', why: 'Los 60 m se miden en el suelo, horizontal, desde tus pies hasta la base. Eso toca el ángulo: no es la hipotenusa. La hipotenusa es tu línea de mirada.' }, { t: 'Conozco el cateto opuesto (60 m) y busco el adyacente', why: 'El opuesto es lo que está frente al ángulo: la torre. Los 60 m están en el suelo, junto a ti.' }], right: 'Los 60 m van por el suelo y tocan el ángulo: adyacente. La altura de la torre (desde tus ojos) está al frente: opuesto.' },
    { title: 'Elige la razón que une el opuesto y el adyacente.', type: 'choice', opts: [{ t: 'Seno', why: 'El seno usa la hipotenusa, que no conocemos ni buscamos.' }, { t: 'Coseno', why: 'El coseno usa la hipotenusa, que no conocemos ni buscamos.' }, { t: 'Tangente', ok: true }], right: `TOA: tan 60° = ${F('opuesto', '60')}. Despejando: opuesto = 60 × tan 60°.` },
    { title: 'Calcula 60 × tan(60°). Usa tan 60° ≈ 1,7321.', type: 'num', label: 'Altura desde tus ojos', unit: 'm', ans: 103.92, tol: .35, hints: ['Multiplica: 60 × 1,7321.', 'Revisa la calculadora: tan 60° debe dar 1,7321 en modo DEG.'], traps: [{ v: 34.64, tol: .5, msg: 'Dividiste 60 ÷ 1,7321. La razón es opuesto = 60 × tan 60°: hay que multiplicar.' }, { v: 51.96, tol: .5, msg: 'Usaste el seno (60 × sen 60°). Aquí conoces el adyacente, no la hipotenusa: usa la tangente.' }, { v: 30, tol: .5, msg: 'Usaste el coseno. Con opuesto y adyacente, la razón es la tangente.' }], solution: '60 × 1,7321 ≈ <b>103,92 m</b>. Esa es la altura desde tus ojos hasta la punta.' },
    { title: 'Suma la altura de tus ojos (1,5 m). ¿Cuál es la altura total de la torre?', type: 'num', label: 'Altura total', unit: 'm', ans: 105.42, tol: .35, hints: ['El triángulo empieza en tus ojos, no en el suelo.', '103,92 + 1,5 = ?'], traps: [{ v: 102.42, tol: .3, msg: 'Restaste la altura de los ojos. Tus ojos están por encima del suelo: hay que sumar.' }, { v: 103.92, tol: .3, msg: 'Falta sumar la altura de tus ojos (1,5 m).' }], solution: '103,92 + 1,5 = <b>105,42 m</b>.' }] },
  'ap-p1': { type: 'num', label: 'Altura que gana', unit: 'm', ans: 25, tol: .2, hints: ['El camino es la hipotenusa (50 m). La altura está frente al ángulo de 30°: es el cateto opuesto.', `Con O y H se usa el seno: sen 30° = ${F('opuesto', '50')}, así que opuesto = 50 × sen 30°.`, 'sen 30° = 0,5. Multiplica 50 × 0,5.'], traps: [{ v: 43.3, tol: .3, msg: 'Usaste el coseno: así obtienes lo que avanza en horizontal, no lo que sube. Lo que sube está frente al ángulo.' }, { v: 28.87, tol: .3, msg: 'Usaste la tangente. Aquí conoces la hipotenusa (el camino), así que la razón es el seno.' }, { v: 100, tol: .5, msg: 'Dividiste en lugar de multiplicar. Opuesto = hipotenusa × sen θ.' }], solution: `sen 30° = ${F('opuesto', '50')} → opuesto = 50 × sen 30° = 50 × 0,5 = <b>25 m</b>. Don Arturo gana 25 m de altura.` },
  'ap-p2': { type: 'num', label: 'Distancia del pie al muro', unit: 'm', ans: 1.69, tol: .03, hints: ['La escalera es la hipotenusa (4 m). La distancia en el suelo toca el ángulo de 65°: es el adyacente.', `Con A y H se usa el coseno: cos 65° = ${F('adyacente', '4')}, así que adyacente = 4 × cos 65°.`, 'cos 65° ≈ 0,4226. Multiplica 4 × 0,4226.'], traps: [{ v: 3.63, tol: .05, msg: 'Usaste el seno: así obtienes la altura a la que llega la escalera en el muro, no la distancia en el suelo.' }, { v: 8.58, tol: .1, msg: 'Usaste la tangente. Aquí la escalera es la hipotenusa: usa el coseno.' }], solution: `cos 65° = ${F('adyacente', '4')} → adyacente = 4 × cos 65° ≈ 4 × 0,4226 ≈ <b>1,69 m</b>. Revisa: es menor que 4 m, tiene sentido.` },
  'ap-p3': { type: 'num', label: 'Altura total de la palma', unit: 'm', ans: 56.45, tol: .3, hints: ['Distancia = adyacente (20 m). La altura desde tus ojos es el opuesto.', 'Con O y A se usa la tangente: opuesto = 20 × tan 70°.', 'tan 70° ≈ 2,7475. Luego suma 1,5 m de los ojos.'], traps: [{ v: 54.95, tol: .3, msg: 'Ese es el resultado desde tus ojos. Te falta sumar 1,5 m.' }, { v: 18.79, tol: .3, msg: 'Usaste el seno. Con distancia y altura se usa la tangente.' }, { v: 7.28, tol: .3, msg: 'Revisa: dividiste 20 ÷ tan 70°. Para encontrar el opuesto hay que multiplicar.' }], solution: '20 × tan 70° ≈ 20 × 2,7475 ≈ 54,95 m; más 1,5 m = <b>56,45 m</b>. Tu resultado es realista: la palma de cera del Quindío es la palma más alta del mundo y la más alta medida llegó a 59,2 m.<small class="src">Fuente: <a href="https://www.guinnessworldrecords.com/world-records/633650-tallest-living-palm-tree" target="_blank" rel="noopener">Guinness World Records, «Tallest living palm tree», medición de 2017</a>.</small>' },
  'ap-decide': { type: 'choice', opts: [{ t: 'Anotar el resultado así: el clinómetro marcó 88°', why: 'tan 88° ≈ 28,6, pero tan 87° ≈ 19,1. ¡Un solo grado de error cambia la altura casi a la mitad! Ese resultado no es confiable.' }, { t: 'Acercarse todavía más al yarumo', why: 'Más cerca, el ángulo se acerca aún más a 90° y el error crece. Es justo al revés.' }, { t: 'Alejarse hasta que el ángulo esté entre 30° y 60°', ok: true }], right: 'Entre 30° y 60°, un error de 1° cambia poco el resultado. Por eso los topógrafos se alejan para medir objetos altos. Revisa la pregunta 3 del laboratorio si quieres verlo con números.' },
  'ap-p4': { type: 'num', label: 'Altura de la cometa', unit: 'm', ans: 23.98, tol: .2, hints: ['El hilo es la hipotenusa (30 m) y la altura está frente al ángulo.', 'Opuesto = 30 × sen 50°. Luego no olvides la mano.', 'sen 50° ≈ 0,7660 → 30 × 0,7660 ≈ 22,98. ¿Y el metro de la mano?'], traps: [{ v: 22.98, tol: .2, msg: 'Ese valor se mide desde la mano, y la mano está a 1 m del suelo.' }, { v: 19.28, tol: .3, msg: 'Usaste el coseno: así obtienes la distancia horizontal hasta la cometa, no su altura.' }, { v: 35.75, tol: .4, msg: 'Usaste la tangente. Aquí conoces la hipotenusa (el hilo): usa el seno.' }], solution: '30 × sen 50° ≈ 30 × 0,7660 ≈ 22,98 m desde la mano; más 1 m = <b>23,98 m</b> sobre el suelo.' },

  /* 5 EVALUAR */
  'ev-quiz': { type: 'quiz',
    objectives: { O1: { t: 'Identifico los lados del triángulo rectángulo', tip: 'Repasa las pantallas 3 a 5 de Explorar.' }, O2: { t: 'Comprendo y calculo seno, coseno y tangente', tip: 'Repasa las pantallas 3 a 7 de Comprender.' }, O3: { t: 'Aplico la trigonometría en mi territorio', tip: 'Repasa el laboratorio y los problemas de Aplicar.' } },
    items: [
      { obj: 'O1', title: 'El lado más largo de un triángulo rectángulo, frente al ángulo de 90°, se llama:', opts: [{ t: 'Cateto opuesto' }, { t: 'Hipotenusa', ok: true }, { t: 'Cateto adyacente' }], right: 'La hipotenusa es el lado más largo y está frente al ángulo recto.' },
      { obj: 'O1', title: 'En este triángulo, θ está arriba. ¿Cuál lado es el cateto adyacente a θ?', fig: ART.quizTri(), opts: [{ t: 'a (abajo)' }, { t: 'b (vertical)', ok: true }, { t: 'c (inclinado)' }], right: 'b toca a θ y no es la hipotenusa, así que es el adyacente. a está al frente (opuesto) y c es la hipotenusa.' },
      { obj: 'O2', title: 'Un triángulo tiene cateto opuesto 6 m, cateto adyacente 8 m e hipotenusa 10 m. ¿Qué razón relaciona directamente los dos catetos?', opts: [{ t: 'Seno' }, { t: 'Coseno' }, { t: 'Tangente', ok: true }], right: 'Tangente = opuesto ÷ adyacente = 6 ÷ 8 = 0,75.' },
      { obj: 'O2', type: 'num', title: 'En un triángulo rectángulo el cateto opuesto a θ mide 9 cm, el adyacente 12 cm y la hipotenusa 15 cm. ¿Cuánto vale sen θ?', label: 'sen θ =', unit: '', ans: .6, tol: .005, traps: [{ v: .8, tol: .005, msg: 'Ese es el coseno (12 ÷ 15).' }, { v: .75, tol: .005, msg: 'Esa es la tangente (9 ÷ 12).' }], solution: 'sen θ = opuesto ÷ hipotenusa = 9 ÷ 15 = <b>0,6</b>.' },
      { obj: 'O2', title: 'Si sen 30° = 0,5, eso significa que en un triángulo rectángulo con un ángulo de 30°…', opts: [{ t: 'la hipotenusa mide 0,5' }, { t: 'el cateto opuesto mide la mitad de la hipotenusa', ok: true }, { t: 'los dos catetos miden lo mismo' }], right: 'opuesto ÷ hipotenusa = 0,5: el opuesto es la mitad de la hipotenusa, sea cual sea el tamaño del triángulo.' },
      { obj: 'O3', title: 'Conoces la distancia horizontal d hasta un árbol y el ángulo de elevación θ. ¿Qué fórmula da la altura (sin contar los ojos)?', opts: [{ t: 'altura = d × sen θ' }, { t: 'altura = d × tan θ', ok: true }, { t: 'altura = d ÷ tan θ' }], right: 'tan θ = altura ÷ d, entonces altura = d × tan θ.' },
      { obj: 'O3', type: 'num', title: 'Estás a 15 m de un guadual y ves su punta con un ángulo de elevación de 40°. ¿Qué altura tiene, sin contar tus ojos?', label: 'Altura', unit: 'm', ans: 12.59, tol: .15, traps: [{ v: 9.64, tol: .15, msg: 'Usaste el seno. Con distancia y altura se usa la tangente.' }, { v: 17.88, tol: .2, msg: 'Dividiste 15 ÷ tan 40°. Hay que multiplicar.' }], solution: '15 × tan 40° ≈ 15 × 0,8391 ≈ <b>12,59 m</b>.' },
      { obj: 'O3', type: 'num', title: 'En agosto, el hilo de una cometa mide 30 m y forma 50° con el suelo. ¿A qué altura está la cometa respecto a la mano?', label: 'Altura', unit: 'm', ans: 22.98, tol: .15, traps: [{ v: 19.28, tol: .2, msg: 'Usaste el coseno: eso es la distancia horizontal.' }, { v: 35.75, tol: .4, msg: 'Usaste la tangente; el hilo es la hipotenusa, así que se usa el seno.' }], solution: '30 × sen 50° ≈ 30 × 0,7660 ≈ <b>22,98 m</b>.' },
      { obj: 'O3', title: 'Mides la misma palma desde la misma distancia, pero esta vez el ángulo te da mayor. ¿Qué pasa con la altura calculada?', opts: [{ t: 'Aumenta', ok: true }, { t: 'Disminuye' }, { t: 'No cambia' }], right: 'Con la misma distancia, un ángulo mayor tiene una tangente mayor, así que la altura calculada aumenta.' },
    ] },
  'ev-self': { type: 'self', items: ['Reconozco triángulos rectángulos en mi entorno.', 'Nombro la hipotenusa, el cateto opuesto y el adyacente según el ángulo θ.', 'Calculo seno, coseno y tangente y sé cuál usar.', 'Uso la tangente para estimar alturas de mi territorio.'], review: ['Explorar, pantalla 2', 'Explorar, pantallas 3 a 5', 'Comprender y Aplicar, pantalla 1', 'Experimentar, laboratorio'] },
  'ev-reflect': { type: 'text', ph: 'Lo más difícil fue… Lo superé cuando… La trigonometría me sirve en mi territorio para…', min: 40, label: 'Tu reflexión' },
  'rt-table': { type: 'reto' },
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
