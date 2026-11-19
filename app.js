/* LÓGICA - El último verano de la paz
   Usa las constantes CFG (datos.js) y VIDEO_URL (config.js). */

const stage  = document.getElementById('stage');
const foot   = document.getElementById('foot');
const slides = [...document.querySelectorAll('.s')];

/* Línea del tiempo: centro de cada año (en px del escenario 1440x810) y a qué diapositiva lleva cada año */
const CX    = [215.5, 384.5, 588, 797, 988, 1198];
const YEARS = [1914, 1915, 1916, 1917, 1918, 1919];
const FIRST = {1914: 4, 1915: 13, 1916: 14, 1917: 16, 1918: 19, 1919: 23};

let cur = 1;                       // diapositiva actual
let vidBox = null;                 // contenedor del video (se crea al llegar a la diapositiva 30)

/* ---------- 1. Escalar el escenario a la ventana (siempre 16:9) ---------- */
function fit() {
  const k = Math.min(innerWidth / 1440, innerHeight / 810);
  stage.style.transform = 'scale(' + k + ')';
  stage.style.left = (innerWidth  - 1440 * k) / 2 + 'px';
  stage.style.top  = (innerHeight -  810 * k) / 2 + 'px';
}
addEventListener('resize', fit);
fit();

/* ---------- 2. Ir a una diapositiva ---------- */
function go(n) {
  if (n >= 1 && n <= slides.length) show(n);
}

function show(n) {
  cur = n;
  // video: solo visible en su diapositiva; al salir se detiene
  if (n === CFG.video.page) {
    if (!vidBox) buildVideo();
    vidBox.style.display = 'block';
  } else if (vidBox) {
    stopVideo();
    vidBox.style.display = 'none';
  }
  slides.forEach(s => s.classList.toggle('on', +s.dataset.p === n));
  drawFoot(n);
}

/* ---------- 3. Zonas clicables, botones extra y cuestionario ---------- */
function box(cls, x, y, w, h) {
  const d = document.createElement('div');
  d.className = cls;
  d.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  return d;
}

slides.forEach(s => {
  const n = +s.dataset.p;

  // zonas invisibles sobre los botones del diseño
  (CFG.hs[n] || []).forEach(([x, y, w, h, destino]) => {
    const a = box('hs', x, y, w, h);
    a.onclick = () => go(destino);
    s.appendChild(a);
  });

  // botones añadidos (Continuar / Regresar donde el diseño no los trae)
  (CFG.pills[n] || []).forEach(([texto, x, y, w, h, destino]) => {
    const a = box('pill', x, y, w, h);
    a.textContent = texto;
    a.onclick = () => go(destino);
    s.appendChild(a);
  });

  // cuestionario: al elegir una opción se marca verde (correcta) o roja (incorrecta)
  (CFG.quiz[n] || []).forEach(q => {
    let respondida = false;
    const fb = document.createElement('div');            // texto ¡Correcto! / Incorrecto
    fb.className = 'fb';
    fb.style.cssText = `left:${q.fb.x}px;top:${q.fb.y}px;font-size:${q.fb.size}px`;
    s.appendChild(fb);

    const anillos = q.opts.map(o => {                    // círculo que se pinta sobre cada opción
      const d = box('rg', o.cx - o.d / 2, o.cy - o.d / 2, o.d, o.d);
      s.appendChild(d);
      return d;
    });
    const pintar = (d, color) => {
      d.style.display = 'block';
      d.style.borderColor = color;
      d.style.background = color;
    };

    q.opts.forEach((o, i) => {
      const z = box('zone', 172, o.y, 1100, o.h);
      z.onclick = () => {
        if (respondida) return;
        respondida = true;
        const ok = (i === q.ok);
        pintar(anillos[i], ok ? '#7fd67f' : '#e86a6a');
        if (!ok) pintar(anillos[q.ok], '#7fd67f');       // muestra cuál era la correcta
        fb.textContent = ok ? '¡Correcto!' : 'Incorrecto';
        fb.style.color = ok ? '#9be29b' : '#ff9a9a';
      };
      s.appendChild(z);
    });
  });
});

/* ---------- 4. Video (se coloca exactamente sobre el recuadro rojo) ---------- */
function buildVideo() {
  const s = slides.find(x => +x.dataset.p === CFG.video.page);
  const [x, y, w, h] = CFG.video.rect;
  vidBox = box('vid', x, y, w, h);

  const u = VIDEO_URL.trim();
  let html;
  if (!u) {
    html = '<div class="vidmsg"><div>Aquí va el videopodcast' +
           '<small>Abre js/config.js y escribe el enlace en VIDEO_URL</small></div></div>';
  } else if (/youtu\.be|youtube\.com/.test(u)) {
    const m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    html = `<iframe src="https://www.youtube.com/embed/${m ? m[1] : ''}" ` +
           `allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>`;
  } else if (/drive\.google\.com/.test(u)) {
    html = `<iframe src="${u.replace(/\/view.*$/, '/preview')}" allow="autoplay;fullscreen" allowfullscreen></iframe>`;
  } else {
    html = `<video controls preload="metadata" src="${u}"></video>`;   // archivo propio (.mp4)
  }
  vidBox.innerHTML = html;
  s.appendChild(vidBox);
}

function stopVideo() {
  if (!vidBox) return;
  const v = vidBox.querySelector('video');
  if (v) v.pause();
  const f = vidBox.querySelector('iframe');
  if (f) f.src = f.src;            // reinicia el iframe para detener el sonido
}

/* ---------- 5. Línea del tiempo con el año actual resaltado ---------- */
function drawFoot(n) {
  if (!CFG.foot.includes(n)) { foot.style.display = 'none'; return; }
  const idx = YEARS.indexOf(CFG.year[n]);

  const anios = YEARS.map((y, i) => {
    const estado = i === idx ? 'sel' : (i < idx ? 'pas' : '');     // actual / ya pasado / futuro
    return `<button class="y ${estado}" data-y="${y}" style="left:${CX[i]}px">${y}</button>`;
  }).join('');

  foot.innerHTML =
    '<div class="ln"></div>' +
    '<div class="ah" style="left:56px;border-right-color:#fff"></div>' +
    '<div class="ah" style="left:1367px;border-left-color:#fff"></div>' +
    '<div class="fill" style="width:' + (CX[idx] - 61) + 'px"></div>' +   // línea roja de progreso
    anios +
    '<div class="e">' + (CFG.etq[n] || '') + '</div>';                    // fecha debajo de la línea

  foot.querySelectorAll('.y').forEach(b => b.onclick = () => go(FIRST[b.dataset.y]));
  foot.style.display = 'block';
}

/* ---------- 6. Teclado: flechas ← → ---------- */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' && CFG.next[cur]) go(CFG.next[cur]);
  if (e.key === 'ArrowLeft'  && CFG.prev[cur]) go(CFG.prev[cur]);
});

show(1);
