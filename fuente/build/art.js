/* Ilustraciones del Eje Cafetero en SVG: sin imágenes externas, funcionan sin internet.
   Las escenas tienen su propio cielo (son «láminas» claras en cualquier tema);
   los diagramas usan las clases ln- y tx- para seguir el tema claro u oscuro. */
const ART = (() => {
  const RAD = Math.PI / 180;
  const C = { hip:'#0a2e6d', opu:'#08794d', ady:'#1769e8', ink:'#10213a', amber:'#b45309', sun:'#f4a51c' };
  const f1 = (n) => Math.round(n * 10) / 10;
  let uid = 0;

  function sky(w, h, id) {
    return `<defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8ff"/><stop offset="1" stop-color="#f3faff"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#sky${id})"/>`;
  }
  function sun(x, y, r = 26) {
    let rays = '';
    for (let i = 0; i < 12; i++) { const a = i * 30 * RAD; rays += `<line x1="${f1(x + Math.cos(a) * (r + 6))}" y1="${f1(y + Math.sin(a) * (r + 6))}" x2="${f1(x + Math.cos(a) * (r + 15))}" y2="${f1(y + Math.sin(a) * (r + 15))}" stroke="#f4a51c" stroke-width="3" stroke-linecap="round" opacity=".7"/>`; }
    return `<g>${rays}<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd166"/></g>`;
  }
  function ranges(w, gy, opts = {}) {
    const nev = opts.nevado !== false;
    let s = `<path d="M0 ${gy - 120} L${w * .12} ${gy - 170} L${w * .25} ${gy - 140} L${w * .4} ${gy - 205} L${w * .55} ${gy - 150} L${w * .7} ${gy - 190} L${w * .85} ${gy - 150} L${w} ${gy - 175} L${w} ${gy} L0 ${gy} Z" fill="#a9cdb7"/>`;
    if (nev) s += `<path d="M${w * .36} ${gy - 187} L${w * .4} ${gy - 205} L${w * .44} ${gy - 188} L${w * .42} ${gy - 192} L${w * .4} ${gy - 184} L${w * .38} ${gy - 191} Z" fill="#ffffff"/>`;
    s += `<path d="M0 ${gy - 80} Q${w * .15} ${gy - 140} ${w * .3} ${gy - 95} T${w * .62} ${gy - 100} T${w} ${gy - 90} L${w} ${gy} L0 ${gy} Z" fill="#6fb37d"/>`;
    s += `<path d="M0 ${gy - 40} Q${w * .25} ${gy - 80} ${w * .5} ${gy - 45} T${w} ${gy - 50} L${w} ${gy} L0 ${gy} Z" fill="#4f9d5f"/>`;
    return s;
  }
  function coffeeRow(x0, x1, y, step = 34) {
    let s = '';
    for (let x = x0; x <= x1; x += step) {
      s += `<ellipse cx="${x}" cy="${y}" rx="15" ry="11" fill="#2e7d3a"/><circle cx="${x - 5}" cy="${y + 2}" r="2.4" fill="#d6334a"/><circle cx="${x + 4}" cy="${y - 1}" r="2.4" fill="#d6334a"/><circle cx="${x + 1}" cy="${y + 5}" r="2.2" fill="#b0213a"/>`;
    }
    return s;
  }
  function house(x, gy, w = 150) {
    const h = w * .62, r = w * .28;
    return `<g>
      <rect x="${x}" y="${gy - h}" width="${w}" height="${h}" fill="#fff8ec" stroke="#d9c9ad"/>
      <rect x="${x}" y="${gy - h * .22}" width="${w}" height="${h * .22}" fill="#1769e8"/>
      <rect x="${x + w * .12}" y="${gy - h * .62}" width="${w * .2}" height="${h * .62}" fill="#16b875"/>
      <rect x="${x + w * .45}" y="${gy - h * .8}" width="${w * .18}" height="${h * .26}" fill="#f4a51c"/>
      <rect x="${x + w * .72}" y="${gy - h * .8}" width="${w * .18}" height="${h * .26}" fill="#c72e40"/>
      <rect x="${x + w * .4}" y="${gy - h * .5}" width="${w * .56}" height="5" fill="#8b5a2b"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${x + w * .42 + i * w * .085}" y1="${gy - h * .5}" x2="${x + w * .42 + i * w * .085}" y2="${gy - h * .38}" stroke="#8b5a2b" stroke-width="3"/>`).join('')}
      <path d="M${x - 14} ${gy - h} L${x + w / 2} ${gy - h - r} L${x + w + 14} ${gy - h} Z" fill="#b5532f"/>
      <path d="M${x - 14} ${gy - h} L${x + w + 14} ${gy - h}" stroke="#7d3720" stroke-width="4"/>
    </g>`;
  }
  function palm(x, gy, top) {
    const H = gy - top, w = Math.max(1.6, H * .03), k = Math.max(5, H * .13);
    const fr = [[-1.7, .7], [-1.3, -.3], [-.6, -1], [0, -1.2], [.6, -1], [1.3, -.3], [1.7, .7], [-1, .9], [1, .9]];
    const fronds = fr.map(([dx, dy]) => `<path d="M${x} ${top} Q${f1(x + dx * k * .5)} ${f1(top + (dy - .7) * k)} ${f1(x + dx * k)} ${f1(top + dy * k)}" stroke="#3f9b4a" stroke-width="${f1(Math.max(1.4, k * .16))}" fill="none" stroke-linecap="round"/>`).join('');
    return `<g><path d="M${x} ${gy} C${f1(x + w)} ${f1(gy - H * .4)} ${f1(x - w)} ${f1(gy - H * .7)} ${x} ${top}" stroke="#d9d3c3" stroke-width="${f1(w)}" fill="none" stroke-linecap="round"/><path d="M${x} ${gy} C${f1(x + w)} ${f1(gy - H * .4)} ${f1(x - w)} ${f1(gy - H * .7)} ${x} ${top}" stroke="#b4aa92" stroke-width="${f1(Math.max(.6, w * .25))}" fill="none" stroke-dasharray="2 ${f1(Math.max(3, w * 1.5))}"/>${fronds}</g>`;
  }
  function guadua(x, gy, top) {
    const H = gy - top, n = 8;
    let s = '';
    [-1, 0, 1].forEach((o, j) => {
      const xo = x + o * Math.max(2, H * .03), lean = o * H * .08, tt = top + j * H * .05;
      const sw = Math.max(1.4, H * .018);
      s += `<path d="M${xo} ${gy} Q${f1(xo + lean * .2)} ${f1((gy + tt) / 2)} ${f1(xo + lean)} ${f1(tt)}" stroke="#6bab3a" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n, yy = gy - (gy - tt) * t, xx = xo + lean * t * t;
        s += `<line x1="${f1(xx - sw * .7)}" y1="${f1(yy)}" x2="${f1(xx + sw * .7)}" y2="${f1(yy)}" stroke="#e9f2c8" stroke-width="${f1(Math.max(.6, sw * .25))}"/>`;
      }
      s += `<ellipse cx="${f1(xo + lean)}" cy="${f1(tt + 4)}" rx="${f1(Math.max(4, H * .06))}" ry="${f1(Math.max(2, H * .025))}" fill="#7cc04a" opacity=".9"/>`;
    });
    return `<g>${s}</g>`;
  }
  function tower(x, gy, top, wf = .5) {
    const H = gy - top, bw = H * wf, bh = H * .3, tw = H * .14;
    return `<g>
      <rect x="${f1(x - bw / 2)}" y="${f1(gy - bh)}" width="${f1(bw)}" height="${f1(bh)}" fill="#9aa1ab"/>
      <rect x="${f1(x - bw / 2 - bw * .18)}" y="${f1(gy - bh * .75)}" width="${f1(bw * .18)}" height="${f1(bh * .75)}" fill="#8a919b"/>
      <rect x="${f1(x + bw / 2)}" y="${f1(gy - bh * .75)}" width="${f1(bw * .18)}" height="${f1(bh * .75)}" fill="#8a919b"/>
      <rect x="${f1(x - tw / 2)}" y="${f1(top + H * .2)}" width="${f1(tw)}" height="${f1(H * .8 - bh + 1)}" fill="#8a919b"/>
      <path d="M${f1(x - tw / 2)} ${f1(top + H * .2)} L${x} ${top} L${f1(x + tw / 2)} ${f1(top + H * .2)} Z" fill="#6f7782"/>
      <path d="M${f1(x - tw * .22)} ${f1(top + H * .32)} v${f1(H * .12)} h${f1(tw * .44)} v-${f1(H * .12)} a${f1(tw * .22)} ${f1(tw * .22)} 0 0 0 -${f1(tw * .44)} 0Z" fill="#4b5563"/>
      <circle cx="${x}" cy="${f1(gy - bh * .62)}" r="${f1(bw * .12)}" fill="#4b5563"/>
      <path d="M${f1(x - bw * .1)} ${gy} v-${f1(bh * .32)} a${f1(bw * .1)} ${f1(bw * .1)} 0 0 1 ${f1(bw * .2)} 0 v${f1(bh * .32)}Z" fill="#4b5563"/>
    </g>`;
  }
  function tree(x, gy, top, color = '#3f9b4a') {
    const H = gy - top, r = H * .32;
    return `<g><rect x="${f1(x - H * .035)}" y="${f1(top + r)}" width="${f1(H * .07)}" height="${f1(H - r)}" fill="#7a5230"/><circle cx="${x}" cy="${f1(top + r)}" r="${f1(r)}" fill="${color}"/><circle cx="${f1(x - r * .55)}" cy="${f1(top + r * 1.3)}" r="${f1(r * .7)}" fill="${color}"/><circle cx="${f1(x + r * .55)}" cy="${f1(top + r * 1.25)}" r="${f1(r * .72)}" fill="${color}"/><circle cx="${f1(x + r * .2)}" cy="${f1(top + r * .55)}" r="${f1(r * .55)}" fill="#5fb86a" opacity=".6"/></g>`;
  }
  function person(x, gy, eyeY, shirt = '#1769e8', hat = true) {
    const h = (gy - eyeY) / .92, r = h * .075, hy = gy - h + r;
    if (h < 3) return `<circle cx="${x}" cy="${f1(gy - 1)}" r="1.4" fill="${C.ink}"/>`;
    return `<g stroke-linecap="round">
      <line x1="${f1(x - h * .07)}" y1="${gy}" x2="${x}" y2="${f1(gy - h * .45)}" stroke="#1f2a44" stroke-width="${f1(h * .07)}"/>
      <line x1="${f1(x + h * .07)}" y1="${gy}" x2="${x}" y2="${f1(gy - h * .45)}" stroke="#1f2a44" stroke-width="${f1(h * .07)}"/>
      <line x1="${x}" y1="${f1(gy - h * .45)}" x2="${x}" y2="${f1(hy + r)}" stroke="${shirt}" stroke-width="${f1(h * .14)}"/>
      <line x1="${x}" y1="${f1(gy - h * .75)}" x2="${f1(x + h * .2)}" y2="${f1(gy - h * .84)}" stroke="${shirt}" stroke-width="${f1(h * .06)}"/>
      <circle cx="${x}" cy="${f1(hy)}" r="${f1(r)}" fill="#c68b59"/>
      ${hat ? `<ellipse cx="${x}" cy="${f1(hy - r * .55)}" rx="${f1(r * 1.9)}" ry="${f1(r * .35)}" fill="#f7f1e1"/><rect x="${f1(x - r * .9)}" y="${f1(hy - r * 1.6)}" width="${f1(r * 1.8)}" height="${f1(r * 1.05)}" rx="${f1(r * .4)}" fill="#f7f1e1"/><rect x="${f1(x - r * .9)}" y="${f1(hy - r * .85)}" width="${f1(r * 1.8)}" height="${f1(r * .3)}" fill="#1f2a44"/>` : ''}
    </g>`;
  }
  function rightMark(x, y, s, dirX = -1, dirY = -1, cls = 'ln-ink', color) {
    const st = color ? `stroke="${color}"` : `class="${cls}"`;
    return `<path d="M${x + dirX * s} ${y} L${x + dirX * s} ${y + dirY * s} L${x} ${y + dirY * s}" fill="none" ${st} stroke-width="2"/>`;
  }
  function arc(cx, cy, r, a0, a1, color, cls) {
    // ángulos en grados matemáticos (antihorario, y hacia arriba)
    const p0 = [cx + r * Math.cos(a0 * RAD), cy - r * Math.sin(a0 * RAD)];
    const p1 = [cx + r * Math.cos(a1 * RAD), cy - r * Math.sin(a1 * RAD)];
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 0 : 1;
    const st = color ? `stroke="${color}"` : `class="${cls || 'ln-ink'}"`;
    return `<path d="M${f1(p0[0])} ${f1(p0[1])} A${r} ${r} 0 ${large} ${sweep} ${f1(p1[0])} ${f1(p1[1])}" fill="none" ${st} stroke-width="2.5"/>`;
  }
  const wrap = (vb, body, extra = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;
  const label = (x, y, t, color, anchor = 'middle', size = 15, extra = '') => `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="Nunito Sans, Arial, sans-serif" font-weight="800" font-size="${size}" fill="${color}" paint-order="stroke" stroke="#ffffff" stroke-width="4" stroke-linejoin="round" ${extra}>${t}</text>`;

  /* ---------------------------------------------------------------- Escenas */
  function landscape() {
    const id = ++uid, w = 800, h = 300, gy = 262;
    const ex = 380, ey = 222, px = 640, top = 52;
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${sun(110, 70)}${ranges(w, gy)}
      <rect y="${gy}" width="${w}" height="${h - gy}" fill="#7cc46f"/>
      ${coffeeRow(30, 260, 250)}${coffeeRow(50, 240, 272)}${house(150, 262, 130)}
      ${palm(px, gy, top)}${palm(730, gy, 120)}${guadua(540, gy, 150)}
      ${person(ex, gy, ey, '#c72e40')}
      <line x1="${ex + 6}" y1="${ey}" x2="${px}" y2="${top}" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="${ex + 6}" y1="${ey}" x2="${px}" y2="${ey}" stroke="${C.ady}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="${px}" y1="${ey}" x2="${px}" y2="${top}" stroke="${C.opu}" stroke-width="3" stroke-dasharray="8 6"/>
      ${rightMark(px, ey, 12, -1, -1, '', C.ink)}${arc(ex + 6, ey, 34, 0, 34.5, C.amber)}
      ${label(ex + 52, ey - 8, 'θ', C.amber, 'start', 17)}`, 'preserveAspectRatio="xMidYMid slice"');
  }
  function landscape2() {
    const id = ++uid, w = 800, h = 260, gy = 228;
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${sun(700, 60, 22)}${ranges(w, gy)}
      <rect y="${gy}" width="${w}" height="${h - gy}" fill="#7cc46f"/>
      ${tree(560, gy, 40, '#e0a326')}${coffeeRow(640, 790, 240)}
      ${person(250, gy, 192, '#16b875')}${person(300, gy, 190, '#c72e40')}${person(200, gy, 194, '#1769e8')}
      <line x1="250" y1="${gy - 3}" x2="560" y2="${gy - 3}" stroke="#f4a51c" stroke-width="4" stroke-dasharray="10 5"/>
      ${label(405, gy - 10, 'cinta métrica', '#7a4a00')}
      <line x1="306" y1="190" x2="560" y2="52" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>`, 'preserveAspectRatio="xMidYMid slice"');
  }
  function ladder() {
    const id = ++uid, w = 800, h = 260, gy = 232, wx = 560, ax = 380, by = 92;
    let rungs = '';
    for (let i = 1; i < 9; i++) { const t = i / 9; rungs += `<line x1="${f1(ax + (wx - ax) * t - 6)}" y1="${f1(gy - (gy - by) * t + 4)}" x2="${f1(ax + (wx - ax) * t + 6)}" y2="${f1(gy - (gy - by) * t - 4)}" stroke="#9bc25a" stroke-width="5"/>`; }
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${ranges(w, gy)}
      <rect y="${gy}" width="${w}" height="${h - gy}" fill="#7cc46f"/>${coffeeRow(30, 300, 245)}
      ${house(wx, gy, 210)}
      <line x1="${ax}" y1="${gy}" x2="${wx}" y2="${by}" stroke="#6bab3a" stroke-width="7" stroke-linecap="round"/>${rungs}
      <line x1="${ax}" y1="${gy - 1}" x2="${wx}" y2="${gy - 1}" stroke="${C.ady}" stroke-width="4"/>
      <line x1="${wx}" y1="${gy}" x2="${wx}" y2="${by}" stroke="${C.opu}" stroke-width="4"/>
      ${rightMark(wx, gy, 14, -1, -1, '', C.ink)}${arc(ax, gy, 40, 0, 37.9, C.amber)}${label(ax + 50, gy - 8, 'θ', C.amber, 'start', 17)}`, 'preserveAspectRatio="xMidYMid slice"');
  }
  function road() {
    const id = ++uid, w = 800, h = 260, gy = 240;
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${sun(90, 60, 22)}${ranges(w, gy, { nevado: false })}
      <path d="M140 ${gy} L620 ${gy - 160} L800 ${gy - 160} L800 ${gy} Z" fill="#5aa866"/>
      ${coffeeRow(300, 600, gy - 30, 40)}${coffeeRow(460, 760, gy - 95, 40)}
      <line x1="140" y1="${gy}" x2="620" y2="${gy - 160}" stroke="#c8a46a" stroke-width="12" stroke-linecap="round"/>
      <line x1="140" y1="${gy}" x2="620" y2="${gy - 160}" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="140" y1="${gy}" x2="620" y2="${gy}" stroke="${C.ady}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="620" y1="${gy}" x2="620" y2="${gy - 160}" stroke="${C.opu}" stroke-width="3" stroke-dasharray="8 6"/>
      ${rightMark(620, gy, 14, -1, -1, '', C.ink)}${person(330, gy - 64, gy - 100, '#f4a51c')}
      ${label(380, gy - 8, 'avanza 8 m', C.ady)}${label(632, gy - 80, 'sube 6 m', C.opu, 'start')}`, 'preserveAspectRatio="xMidYMid slice"');
  }
  function clino() {
    const id = ++uid, w = 800, h = 260, gy = 236, ex = 260, ey = 196, tx = 600, top = 40;
    const cx = 120, cy = 120, R = 70;
    let ticks = '';
    for (let a = 0; a <= 180; a += 10) { const r0 = a % 30 === 0 ? R - 12 : R - 7; ticks += `<line x1="${f1(cx + Math.cos(a * RAD) * r0)}" y1="${f1(cy + Math.sin(a * RAD) * r0)}" x2="${f1(cx + Math.cos(a * RAD) * R)}" y2="${f1(cy + Math.sin(a * RAD) * R)}" stroke="#10213a" stroke-width="1.5"/>`; }
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${ranges(w, gy)}
      <rect y="${gy}" width="${w}" height="${h - gy}" fill="#7cc46f"/>
      ${tree(tx, gy, top)}${person(ex, gy, ey, '#16b875')}
      <line x1="${ex + 6}" y1="${ey}" x2="${tx}" y2="${top + 8}" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="${ex + 6}" y1="${ey}" x2="${tx}" y2="${ey}" stroke="${C.ady}" stroke-width="3" stroke-dasharray="8 6"/>
      ${arc(ex + 6, ey, 40, 0, 27, C.amber)}
      <g>
        <rect x="${cx - R - 16}" y="${cy - 26}" width="${2 * R + 32}" height="${R + 62}" rx="16" fill="#ffffff" opacity=".93"/>
        <path d="M${cx - R} ${cy} A${R} ${R} 0 0 0 ${cx + R} ${cy} Z" fill="#fff6d6" stroke="#b9a35a" stroke-width="2"/>
        ${ticks}
        <rect x="${cx - R - 6}" y="${cy - 9}" width="${2 * R + 12}" height="8" rx="4" fill="#f4a51c"/>
        <line x1="${cx}" y1="${cy}" x2="${cx + 18}" y2="${cy + 60}" stroke="#10213a" stroke-width="1.5"/>
        <circle cx="${cx + 18}" cy="${cy + 64}" r="5" fill="#66758b"/>
        ${label(cx, cy - 12, 'pitillo', '#7a4a00', 'middle', 13)}${label(cx + 34, cy + 64, 'tuerca', '#10213a', 'start', 12)}
      </g>`, 'preserveAspectRatio="xMidYMid slice"');
  }
  function city() {
    const id = ++uid, w = 800, h = 260, gy = 236, ex = 230, ey = 204, tx = 560, top = 26;
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${ranges(w, gy)}
      <rect y="${gy}" width="${w}" height="${h - gy}" fill="#9fb9a3"/>
      ${tower(tx, gy, top)}${tree(120, gy, 150)}${person(ex, gy, ey, '#c72e40')}
      <line x1="${ex + 6}" y1="${ey}" x2="${tx}" y2="${top}" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="${ex + 6}" y1="${ey}" x2="${tx}" y2="${ey}" stroke="${C.ady}" stroke-width="3" stroke-dasharray="8 6"/>
      ${arc(ex + 6, ey, 40, 0, 31, C.amber)}`, 'preserveAspectRatio="xMidYMid slice"');
  }
  function mountains() {
    const id = ++uid, w = 800, h = 220, gy = 220;
    return wrap(`0 0 ${w} ${h}`, `${sky(w, h, id)}${sun(680, 60, 24)}${ranges(w, gy)}${coffeeRow(20, 780, 205, 38)}`, 'preserveAspectRatio="xMidYMid slice"');
  }

  /* ---------------------------------------------------------------- Diagramas */
  function parts() {
    const A = [60, 230], Cc = [380, 230], B = [380, 50];
    return wrap('0 0 470 280', `<g class="dg">
      <polygon points="${A} ${Cc} ${B}" class="fl-soft" opacity=".55"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="ln-hip" stroke-width="5" stroke-linecap="round"/>
      <line x1="${Cc[0]}" y1="${Cc[1]}" x2="${B[0]}" y2="${B[1]}" class="ln-opu" stroke-width="5" stroke-linecap="round"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${Cc[0]}" y2="${Cc[1]}" class="ln-ady" stroke-width="5" stroke-linecap="round"/>
      ${rightMark(Cc[0], Cc[1], 18)}${arc(A[0], A[1], 46, 0, 29.4, null, 'ln-ink')}
      <text x="${A[0] + 56}" y="${A[1] - 10}" class="tx-ink">θ</text>
      <text x="${Cc[0] - 50}" y="${Cc[1] - 26}" class="tx-ink sm">90°</text>
      <text x="200" y="125" class="tx-hip" text-anchor="middle" transform="rotate(-29.4 200 125)">hipotenusa (la escalera)</text>
      <text x="392" y="140" class="tx-opu">cateto</text><text x="392" y="158" class="tx-opu">opuesto</text><text x="392" y="176" class="tx-opu sm">(el muro)</text>
      <text x="220" y="256" class="tx-ady" text-anchor="middle">cateto adyacente (el suelo)</text>
    </g>`);
  }
  /* Triángulo genérico con medidas: o = vertical, a = horizontal, theta abajo a la izquierda */
  function tri(o, a, labels = {}) {
    const W = 460, H = 270, maxW = 300, maxH = 180, s = Math.min(maxW / a, maxH / o);
    const A = [70, 225], Cc = [70 + a * s, 225], B = [70 + a * s, 225 - o * s];
    const ang = Math.atan2(o, a) / RAD, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    return wrap(`0 0 ${W} ${H}`, `<g class="dg">
      <polygon points="${A} ${Cc} ${B}" class="fl-soft" opacity=".55"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="ln-hip" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="${Cc[0]}" y1="${Cc[1]}" x2="${B[0]}" y2="${B[1]}" class="ln-opu" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${Cc[0]}" y2="${Cc[1]}" class="ln-ady" stroke-width="4.5" stroke-linecap="round"/>
      ${rightMark(Cc[0], Cc[1], 15)}${arc(A[0], A[1], 40, 0, ang, null, 'ln-ink')}
      <text x="${A[0] + 48}" y="${A[1] - 8}" class="tx-ink">θ</text>
      <text x="${f1(mx - 14)}" y="${f1(my - 12)}" class="tx-hip" text-anchor="end">${labels.h || ''}</text>
      <text x="${f1(Cc[0] + 12)}" y="${f1((Cc[1] + B[1]) / 2 + 5)}" class="tx-opu">${labels.o || ''}</text>
      <text x="${f1((A[0] + Cc[0]) / 2)}" y="${A[1] + 28}" class="tx-ady" text-anchor="middle">${labels.a || ''}</text>
    </g>`);
  }
  /* Figura de problema con decoración del territorio */
  function prob(cfg) {
    const id = ++uid, W = 560, H = 300, th = cfg.ang;
    const eyePx = cfg.eye ? 34 : 0, gy = 270;
    const ay = gy - eyePx, ax = 80;
    const L = Math.min((W - 190) / Math.cos(th * RAD), (ay - 52) / Math.sin(th * RAD));
    const cx = ax + L * Math.cos(th * RAD), by = ay - L * Math.sin(th * RAD);
    let decor = '';
    if (cfg.decor === 'palm') decor = palm(cx, gy, by);
    if (cfg.decor === 'tower') decor = tower(cx, gy, by, .26);
    if (cfg.decor === 'wall') decor = `<rect x="${cx}" y="${by - 30}" width="120" height="${gy - by + 30}" fill="#fff8ec" stroke="#d9c9ad"/><rect x="${cx}" y="${gy - 30}" width="120" height="30" fill="#1769e8"/><path d="M${cx - 18} ${by - 30} L${cx + 140} ${by - 30} L${cx + 140} ${by - 50} L${cx} ${by - 50} Z" fill="#b5532f"/>`;
    if (cfg.decor === 'slope') decor = `<path d="M${ax} ${ay} L${cx} ${by} L${W} ${by} L${W} ${gy + 30} L${ax} ${gy + 30} Z" fill="#5aa866"/>${coffeeRow(ax + 120, cx - 20, ay - 18, 46)}<line x1="${ax}" y1="${ay}" x2="${cx}" y2="${by}" stroke="#c8a46a" stroke-width="12" stroke-linecap="round"/>`;
    if (cfg.decor === 'kite') decor = `<path d="M${cx} ${by - 22} L${cx + 16} ${by} L${cx} ${by + 26} L${cx - 16} ${by} Z" fill="#c72e40"/><path d="M${cx} ${by - 22} L${cx} ${by + 26} M${cx - 16} ${by} L${cx + 16} ${by}" stroke="#7a1d29" stroke-width="1.5"/><path d="M${cx} ${by + 26} q8 14 -4 24 q-10 10 4 22" stroke="#f4a51c" stroke-width="3" fill="none"/>`;
    const ladderLine = cfg.decor === 'wall' ? `<line x1="${ax}" y1="${ay}" x2="${cx}" y2="${by}" stroke="#6bab3a" stroke-width="7" stroke-linecap="round"/>` : '';
    const who = cfg.decor === 'kite' ? person(ax - 12, gy, ay - 26, '#16b875') : cfg.eye ? person(ax - 4, gy, ay, cfg.shirt || '#c72e40') : (cfg.decor === 'slope' ? person(ax + (cx - ax) * .35, ay - (ay - by) * .35, ay - (ay - by) * .35 - 34, '#f4a51c') : '');
    const hip = cfg.decor === 'kite' || cfg.decor === 'slope' || cfg.decor === 'wall';
    const mx = (ax + cx) / 2, my = (ay + by) / 2;
    const q = (k) => cfg.unknown === k;
    const col = { h: C.hip, o: C.opu, a: C.ady };
    return wrap(`0 0 ${W} ${H}`, `${sky(W, H, id)}
      <rect y="${gy}" width="${W}" height="${H - gy}" fill="#7cc46f"/>${decor}
      ${hip ? '' : `<line x1="${ax}" y1="${ay}" x2="${cx}" y2="${by}" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>`}
      ${cfg.decor === 'kite' ? `<line x1="${ax}" y1="${ay}" x2="${cx}" y2="${by + 26}" stroke="#10213a" stroke-width="2"/>` : ''}${ladderLine}
      <line x1="${ax}" y1="${ay}" x2="${cx}" y2="${ay}" stroke="${C.ady}" stroke-width="3" stroke-dasharray="${q('a') ? '3 5' : '8 6'}"/>
      <line x1="${cx}" y1="${ay}" x2="${cx}" y2="${by}" stroke="${C.opu}" stroke-width="3" stroke-dasharray="${q('o') ? '3 5' : '8 6'}"/>
      ${rightMark(cx, ay, 13, -1, -1, '', C.ink)}${arc(ax, ay, 44, 0, th, C.amber)}${who}
      ${label(ax + 54 + 6, ay - 10 - th / 6, cfg.ang + '°', C.amber, 'start', 16)}
      ${cfg.h ? label(mx - 10, my - 14, cfg.h, col.h, 'end', 16) : ''}
      ${cfg.o ? label(cx + 12, (ay + by) / 2, cfg.o, col.o, 'start', 16) : ''}
      ${cfg.a ? label(ax + (cx - ax) * .45, ay + 22, cfg.a, col.a, 'middle', 16) : ''}
      ${cfg.eye ? label(ax - 30, gy - eyePx / 2 + 5, cfg.eyeTxt || '1,5 m', C.ink, 'end', 13) + `<line x1="${ax - 24}" y1="${ay}" x2="${ax - 24}" y2="${gy}" stroke="${C.ink}" stroke-width="1.5"/>` : ''}
      `);
  }
  /* Triángulo con θ arriba para el cuestionario */
  function quizTri() {
    const A = [50, 210], Cc = [330, 210], B = [330, 40];
    const ang = Math.atan2(170, 280) / RAD;
    return wrap('0 0 420 250', `<g class="dg">
      <polygon points="${A} ${Cc} ${B}" class="fl-soft" opacity=".55"/>
      <polyline points="${A} ${Cc} ${B} ${A}" fill="none" class="ln-ink" stroke-width="3.5" stroke-linejoin="round"/>
      ${rightMark(Cc[0], Cc[1], 15)}${arc(B[0], B[1], 34, 270, 180 + ang, null, 'ln-ink')}
      <text x="${B[0] - 30}" y="${B[1] + 50}" class="tx-ink">θ</text>
      <text x="190" y="236" class="tx-ink" text-anchor="middle">a</text>
      <text x="344" y="132" class="tx-ink">b</text>
      <text x="176" y="112" class="tx-ink">c</text>
    </g>`);
  }

  /* ---------------------------------------------------------------- Miniaturas */
  function thumb(kind) {
    const id = ++uid, base = (b) => wrap('0 0 88 64', `${sky(88, 64, id)}<rect y="54" width="88" height="10" fill="#7cc46f"/>${b}`, 'preserveAspectRatio="xMidYMid slice"');
    if (kind === 'ladder') return base(`<rect x="58" y="14" width="30" height="40" fill="#fff8ec" stroke="#d9c9ad"/><rect x="58" y="46" width="30" height="8" fill="#1769e8"/><line x1="24" y1="54" x2="58" y2="16" stroke="#6bab3a" stroke-width="3"/>`);
    if (kind === 'shadow') return base(`${palm(52, 54, 10)}${sun(12, 12, 6)}<line x1="12" y1="54" x2="52" y2="54" stroke="#1f2a44" stroke-width="4" opacity=".5"/><line x1="14" y1="16" x2="52" y2="11" stroke="#f4a51c" stroke-width="1.5" stroke-dasharray="3 2"/>`);
    if (kind === 'slope') return base(`<path d="M8 54 L80 18 L88 18 L88 64 L8 64Z" fill="#5aa866"/><line x1="8" y1="54" x2="80" y2="18" stroke="#c8a46a" stroke-width="4"/>${coffeeRow(40, 70, 44, 26)}`);
    if (kind === 'wheel') { let sp = ''; for (let i = 0; i < 8; i++) { const a = i * 45 * RAD; sp += `<line x1="44" y1="34" x2="${f1(44 + Math.cos(a) * 18)}" y2="${f1(34 + Math.sin(a) * 18)}" stroke="#7a4a00" stroke-width="2"/>`; } return base(`<circle cx="44" cy="34" r="20" fill="none" stroke="#c72e40" stroke-width="5"/>${sp}<circle cx="44" cy="34" r="4" fill="#f4a51c"/>`); }
    return '';
  }

  /* ---------------------------------------------------------------- Laboratorio */
  function lab(st) {
    const W = 640, H = 360, gy = 326, ox = 60;
    const t = Math.tan(st.ang * RAD), hOpp = st.d * t, eye = st.useEye ? st.eye : 0, total = hOpp + eye;
    const s = Math.min(480 / st.d, 250 / Math.max(total, .1));
    const tx = ox + st.d * s, ey = gy - eye * s, top = gy - total * s;
    let obj = '';
    if (st.obj === 'palm') obj = palm(tx, gy, top);
    else if (st.obj === 'guadua') obj = guadua(tx, gy, top);
    else obj = tower(tx, gy, top);
    const id = ++uid;
    // marcas de escala cada cierto número de metros
    const stepM = [1, 2, 5, 10, 20, 50, 100, 200][[1, 2, 5, 10, 20, 50, 100, 200].findIndex(v => v * s >= 38)] || 500;
    let ticks = '';
    for (let m = stepM; m < st.d; m += stepM) ticks += `<line x1="${f1(ox + m * s)}" y1="${gy}" x2="${f1(ox + m * s)}" y2="${gy + 7}" stroke="#10213a" stroke-width="1.5"/>`;
    return wrap(`0 0 ${W} ${H}`, `${sky(W, H, id)}${ranges(W, gy, { nevado: true })}
      <rect y="${gy}" width="${W}" height="${H - gy}" fill="#7cc46f"/>${ticks}
      ${obj}${person(ox - 2, gy, ey, '#c72e40')}
      <line x1="${ox}" y1="${f1(ey)}" x2="${f1(tx)}" y2="${f1(top)}" stroke="${C.hip}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="${ox}" y1="${f1(ey)}" x2="${f1(tx)}" y2="${f1(ey)}" stroke="${C.ady}" stroke-width="3" stroke-dasharray="8 6"/>
      <line x1="${f1(tx)}" y1="${f1(ey)}" x2="${f1(tx)}" y2="${f1(top)}" stroke="${C.opu}" stroke-width="3.5"/>
      ${eye ? `<line x1="${f1(tx)}" y1="${gy}" x2="${f1(tx)}" y2="${f1(ey)}" stroke="#66758b" stroke-width="3.5"/>` : ''}
      ${eye ? '' : label(ox, gy + 26, 'tú', C.ink, 'middle', 19)}${rightMark(tx, ey, 11, -1, -1, '', C.ink)}${arc(ox, ey, 40, 0, st.ang, C.amber)}
      ${label(ox + 46, ey - 8 - st.ang / 5, st.ang + '°', C.amber, 'start', 21)}
      ${label((ox + tx) / 2, gy + 26, st.dTxt + ' m', C.ady, 'middle', 20)}
      ${label(Math.min(tx + 10, W - 4), (ey + top) / 2, st.hTxt + ' m', C.opu, tx + 10 > W - 110 ? 'end' : 'start', 20)}`);
  }
  /* Triángulos semejantes: sombra de guadua */
  function similar(ang, L) {
    const s = 21, A = [34, 230];
    const a = L * Math.cos(ang * RAD) * s, o = L * Math.sin(ang * RAD) * s;
    const Cc = [A[0] + a, A[1]], B = [A[0] + a, A[1] - o];
    return wrap('0 0 360 250', `<g class="dg">
      <rect x="0" y="230" width="360" height="20" class="fl-soft"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="#f4a51c" stroke-width="4" stroke-dasharray="7 5"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${f1(Cc[0])}" y2="${Cc[1]}" class="ln-ady" stroke-width="7" stroke-linecap="round" opacity=".85"/>
      <line x1="${f1(Cc[0])}" y1="${Cc[1]}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="#6bab3a" stroke-width="7" stroke-linecap="round"/>
      ${Array.from({ length: 7 }, (_, i) => `<line x1="${f1(Cc[0] - 5)}" y1="${f1(Cc[1] - (i + 1) * o / 8)}" x2="${f1(Cc[0] + 5)}" y2="${f1(Cc[1] - (i + 1) * o / 8)}" stroke="#e9f2c8" stroke-width="2"/>`).join('')}
      ${rightMark(Cc[0], Cc[1], 12)}${arc(A[0], A[1], 34, 0, ang, null, 'ln-ink')}
      <text x="${A[0] + 40}" y="${A[1] - 8}" class="tx-ink" style="font-size:19px">θ</text>
      <text x="${f1(Math.min(Cc[0] + 10, 290))}" y="${f1((Cc[1] + B[1]) / 2)}" class="tx-opu sm">guadua</text>
      <text x="${f1((A[0] + Cc[0]) / 2)}" y="246" class="tx-ady sm" text-anchor="middle">sombra</text>
    </g>`);
  }
  /* Triángulo de hipotenusa 1 para la calculadora */
  function unit(ang) {
    const R = 230, A = [40, 250];
    const c = Math.cos(ang * RAD), sN = Math.sin(ang * RAD);
    const B = [A[0] + R * c, A[1] - R * sN], Cc = [B[0], A[1]];
    const fmt = (n) => n.toFixed(4).replace('.', ',');
    return wrap('0 0 360 280', `<g class="dg">
      <path d="M${A[0] + R} ${A[1]} A${R} ${R} 0 0 0 ${A[0]} ${A[1] - R}" fill="none" class="ln-line" stroke-width="2" stroke-dasharray="4 5"/>
      <polygon points="${A} ${f1(Cc[0])},${Cc[1]} ${f1(B[0])},${f1(B[1])}" class="fl-soft" opacity=".6"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${f1(B[0])}" y2="${f1(B[1])}" class="ln-hip" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="${f1(Cc[0])}" y1="${Cc[1]}" x2="${f1(B[0])}" y2="${f1(B[1])}" class="ln-opu" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${f1(Cc[0])}" y2="${Cc[1]}" class="ln-ady" stroke-width="4.5" stroke-linecap="round"/>
      ${ang > 3 && ang < 87 ? rightMark(Cc[0], Cc[1], 11) : ''}${ang > 0 ? arc(A[0], A[1], 30, 0, ang, null, 'ln-ink') : ''}
      <text x="${A[0] + 36}" y="${A[1] - 6}" class="tx-ink sm">θ</text>
      <text x="${f1((A[0] + B[0]) / 2 - 10)}" y="${f1((A[1] + B[1]) / 2 - 8)}" class="tx-hip" text-anchor="end">1</text>
      ${sN > .08 ? `<text x="${f1(Math.min(Cc[0] + 8, 300))}" y="${f1((Cc[1] + B[1]) / 2 + 5)}" class="tx-opu sm" ${Cc[0] + 8 > 260 ? 'text-anchor="end"' : ''}>sen θ = ${fmt(sN)}</text>` : ''}
      ${c > .15 ? `<text x="${f1((A[0] + Cc[0]) / 2)}" y="272" class="tx-ady sm" text-anchor="middle">cos θ = ${fmt(c)}</text>` : ''}
    </g>`);
  }
  /* Triángulo de la escalera para el manipulador de roles */
  function roleTri(theta) {
    const A = [60, 230], Cc = [330, 230], B = [330, 50];
    const atA = theta === 'A';
    const aAng = Math.atan2(180, 270) / RAD;
    const opp = atA ? 'CB' : 'AC';
    const sideCls = (k) => k === 'AB' ? 'hip' : (k === opp ? 'opu' : 'ady');
    const names = { hip: 'hipotenusa', opu: 'cateto opuesto', ady: 'cateto adyacente' };
    return wrap('0 0 440 270', `<g class="dg">
      <rect x="330" y="30" width="90" height="200" fill="#fff8ec" stroke="#d9c9ad"/><rect x="330" y="205" width="90" height="25" fill="#1769e8" opacity=".85"/>
      <polygon points="${A} ${Cc} ${B}" class="fl-soft" opacity=".5"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="ln-${sideCls('AB')}" stroke-width="6" stroke-linecap="round"/>
      <line x1="${Cc[0]}" y1="${Cc[1]}" x2="${B[0]}" y2="${B[1]}" class="ln-${sideCls('CB')}" stroke-width="6" stroke-linecap="round"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${Cc[0]}" y2="${Cc[1]}" class="ln-${sideCls('AC')}" stroke-width="6" stroke-linecap="round"/>
      ${rightMark(Cc[0], Cc[1], 16)}
      ${atA ? arc(A[0], A[1], 46, 0, aAng, null, 'ln-ink') + `<text x="${A[0] + 54}" y="${A[1] - 8}" class="tx-ink">θ</text>` : arc(B[0], B[1], 40, 270, 180 + aAng, null, 'ln-ink') + `<text x="${B[0] - 30}" y="${B[1] + 58}" class="tx-ink">θ</text>`}
      <text x="180" y="122" class="tx-${sideCls('AB')}" text-anchor="middle" transform="rotate(-33.7 180 122)">${names[sideCls('AB')]}</text>
      <text x="342" y="${atA ? 128 : 128}" class="tx-${sideCls('CB')}" ><tspan x="342" dy="0">${names[sideCls('CB')].split(' ')[0]}</tspan><tspan x="342" dy="18">${names[sideCls('CB')].split(' ')[1] || ''}</tspan></text>
      <text x="195" y="256" class="tx-${sideCls('AC')}" text-anchor="middle">${names[sideCls('AC')]}</text>
    </g>`);
  }
  /* Palma con zonas para rotular */
  function labelTri(theta, zoneHtml) {
    const id = ++uid, A = [70, 236], Cc = [330, 236], B = [330, 52];
    const aAng = Math.atan2(184, 260) / RAD;
    return wrap('0 0 480 290', `${sky(480, 290, id)}<rect y="268" width="480" height="22" fill="#7cc46f"/>
      ${palm(Cc[0], 268, B[1])}${person(A[0] - 4, 268, 236, '#c72e40')}
      ${theta === 'B' ? `<g transform="translate(${B[0] - 2} ${B[1] - 6})"><ellipse cx="0" cy="0" rx="10" ry="6" fill="#2f7fb8"/><circle cx="-8" cy="-4" r="4.5" fill="#3aa35b"/><path d="M8 0 L26 6" stroke="#2f7fb8" stroke-width="3"/><circle cx="-9" cy="-5" r="1.2" fill="#000"/></g>` : ''}
      <line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${C.ink}" stroke-width="3.5" stroke-dasharray="9 6"/>
      <line x1="${A[0]}" y1="${A[1]}" x2="${Cc[0]}" y2="${Cc[1]}" stroke="${C.ink}" stroke-width="3.5"/>
      <line x1="${Cc[0]}" y1="${Cc[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${C.ink}" stroke-width="3.5"/>
      ${rightMark(Cc[0], Cc[1], 14, -1, -1, '', C.ink)}
      ${theta === 'A' ? arc(A[0], A[1], 44, 0, aAng, C.amber) + label(A[0] + 52, A[1] - 8, 'θ', C.amber, 'start', 18) : arc(B[0], B[1], 40, 270, 180 + aAng, C.amber) + label(B[0] - 26, B[1] + 58, 'θ', C.amber, 'middle', 18)}
      ${zoneHtml}`).replace('aria-hidden="true" focusable="false"', 'role="group" aria-label="Triángulo de la palma con tres recuadros para rotular"');
  }

  return { landscape, landscape2, ladder, road, clino, city, mountains, parts, tri, prob, quizTri, thumb, lab, similar, unit, roleTri, labelTri };
})();
