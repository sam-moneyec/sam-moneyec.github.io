// ACTIVAR COLOREADO DE CÓDIGO
document.addEventListener('DOMContentLoaded', (event) => {
    hljs.highlightAll();
});

// --- DICCIONARIO DE COLORES NEÓN VIBRANTES ---
const sectionColors = {
    'inicio': '#FFD700',          // Dorado (Original)
    'prod-cartesiano': '#00FF00', // Verde Matrix
    'funciones': '#ff001e',       // <--- CAMBIO AQUÍ: ROJO NEÓN
    'ejercicios': '#00FFFF',      // Turquesa Neón
    'clasificacion': '#BC13FE',   // Púrpura Eléctrico
    'inversa': '#006aff',         // Rojo Neón Intenso
    'compuesta': '#FF00FF',       // Magenta Láser
    'discreta': '#7bff00',        // Naranja Fuego
    'video': '#ff8400',           // Azul Eléctrico
    'resenas': '#00FF9C'          // Menta Tóxico
};

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Ocultar contenidos
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Resetear botones
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        tablinks[i].style.borderColor = "transparent"; 
        tablinks[i].style.color = "#e0e0e0"; 
    }

    // Mostrar pestaña actual
    var currentTab = document.getElementById(tabName);
    if (currentTab) {
        currentTab.style.display = "block";
        
        // --- CAMBIO DE COLOR DINÁMICO ---
        var newColor = sectionColors[tabName] || '#FFD700';
        document.documentElement.style.setProperty('--gold-primary', newColor);
    }

    // Activar botón
    if (evt) {
        evt.currentTarget.className += " active";
        evt.currentTarget.style.borderColor = newColor;
        evt.currentTarget.style.color = newColor;
    }
}

// --- CALCULADORAS ---
function calcCartesian() {
    const rawA = document.getElementById('setA').value;
    const rawB = document.getElementById('setB').value;
    const resDiv = document.getElementById('resCartesiano');
    
    if (!rawA || !rawB) { 
        resDiv.innerHTML = "⚠️ DATOS FALTANTES"; 
        resDiv.style.color = "red";
        return; 
    }

    const A = rawA.split(',').map(s => s.trim());
    const B = rawB.split(',').map(s => s.trim());
    let pairs = [];

    A.forEach(a => {
        B.forEach(b => {
            pairs.push(`(${a},${b})`);
        });
    });

    resDiv.style.color = "var(--gold-primary)";
    resDiv.innerHTML = `<strong>PARES GENERADOS:</strong><br>{ ${pairs.join(', ')} }`;
}

/* =========================
   UTILIDADES (PARSING)
========================= */
function parseCSV(raw) {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Acepta pares tipo:
 *  1->a, 2->b
 *  1:a, 2:b
 *  1=a, 2=b
 *  (1,a), (2,b)
 */
function parseMapping(raw) {
    const out = { map: {}, pairs: [], errors: [] };
    if (!raw) {
        out.errors.push("⚠️ Ingresa el mapeo.");
        return out;
    }

    // Normalizar: quitar llaves y espacios extras
    let cleaned = raw.replace(/[{}]/g, '').trim();

    // Soportar formato (x,y)
    cleaned = cleaned.replace(/\(/g, '').replace(/\)/g, '');

    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);

    // Intentar reconstruir pares si el usuario puso (x,y) sin separador claro:
    // Ej: "1,a,2,b" -> lo convertimos en ["1,a","2,b"]
    let chunks = parts;
    const hasArrow = cleaned.includes("->") || cleaned.includes(":") || cleaned.includes("=");
    if (!hasArrow && parts.length % 2 === 0) {
        chunks = [];
        for (let i = 0; i < parts.length; i += 2) {
            chunks.push(parts[i] + "," + parts[i + 1]);
        }
    }

    const separators = ["->", ":", "="];
    chunks.forEach(p => {
        let x = null, y = null;

        for (const sep of separators) {
            if (p.includes(sep)) {
                const [lx, ry] = p.split(sep);
                x = (lx ?? "").trim();
                y = (ry ?? "").trim();
                break;
            }
        }

        // Formato "x,y"
        if (x === null || y === null) {
            if (p.includes(",")) {
                const [lx, ry] = p.split(",");
                x = (lx ?? "").trim();
                y = (ry ?? "").trim();
            }
        }

        if (!x || !y) {
            out.errors.push(`⚠️ Par inválido: "${p}"`);
            return;
        }

        // detectar duplicado con salida distinta
        if (out.map.hasOwnProperty(x) && out.map[x] !== y) {
            out.errors.push(`❌ No es función: "${x}" tiene dos salidas (${out.map[x]} y ${y}).`);
            return;
        }

        out.map[x] = y;
        out.pairs.push([x, y]);
    });

    if (out.pairs.length === 0 && out.errors.length === 0) out.errors.push("⚠️ No se detectaron pares.");
    return out;
}

function setResult(el, msg, ok = true) {
    if (!el) return;
    el.style.color = ok ? "var(--gold-primary)" : "red";
    el.innerHTML = msg;
}

function stars(n) {
    const k = Math.max(0, Math.min(5, Number(n) || 0));
    return "★".repeat(k) + "☆".repeat(5 - k);
}

/* =========================
   CLASIFICACIÓN
========================= */
function analyzeMapping(domain, codomain, mapping) {
    // mapping: objeto x->y
    const report = {
        isFunction: true,
        missingDomain: [],
        image: [],
        notInCodomain: [],
        injective: false,
        surjective: false,
        bijective: false
    };

    const image = [];
    const imageSet = new Set();
    const seenY = new Set();

    domain.forEach(x => {
        if (!mapping.hasOwnProperty(x)) report.missingDomain.push(x);
        else {
            const y = mapping[x];
            image.push(y);
            imageSet.add(y);
            if (codomain.length > 0 && !codomain.includes(y)) report.notInCodomain.push(`${x}->${y}`);
            if (seenY.has(y)) { /* repetido */ }
            seenY.add(y);
        }
    });

    report.isFunction = report.missingDomain.length === 0; // asumiendo que mapping ya no tiene conflictos
    report.image = Array.from(imageSet);

    // Injectiva: no repite y (considerando solo x del dominio)
    report.injective = report.isFunction && (image.length === report.image.length);

    // Sobreyectiva: imagen cubre codominio (si codominio fue dado)
    if (codomain.length === 0) {
        report.surjective = false;
    } else {
        report.surjective = report.isFunction && codomain.every(y => imageSet.has(y));
    }

    report.bijective = report.injective && report.surjective;

    return report;
}

function classifyFunction() {
    const dom = parseCSV(document.getElementById("classDomain")?.value);
    const cod = parseCSV(document.getElementById("classCodomain")?.value);
    const mappingRaw = document.getElementById("classMap")?.value;

    const resEl = document.getElementById("classResult");
    const codeEl = document.getElementById("classMatlab");

    if (dom.length === 0 || cod.length === 0 || !mappingRaw) {
        setResult(resEl, "⚠️ Completa dominio, codominio y mapeo.", false);
        return;
    }

    const parsed = parseMapping(mappingRaw);
    if (parsed.errors.length > 0) {
        setResult(resEl, parsed.errors.join("<br>"), false);
        return;
    }

    const rep = analyzeMapping(dom, cod, parsed.map);

    if (rep.notInCodomain.length > 0) {
        setResult(resEl, `⚠️ Hay salidas fuera del codominio: ${rep.notInCodomain.join(", ")}`, false);
        return;
    }

    if (!rep.isFunction) {
        setResult(resEl, `❌ No es función: faltan asignaciones para ${rep.missingDomain.join(", ")}`, false);
        return;
    }

    const lines = [];
    lines.push(`✅ ES FUNCIÓN (cada x tiene una única salida)`);
    lines.push(`Imagen: { ${rep.image.join(", ")} }`);
    lines.push(rep.injective ? `✅ Injectiva` : `❌ No injectiva (se repite alguna salida)`);
    lines.push(rep.surjective ? `✅ Sobreyectiva` : `❌ No sobreyectiva (no cubre todo B)`);
    lines.push(rep.bijective ? `🏆 Biyectiva (tiene inversa)` : `—`);

    setResult(resEl, lines.join("<br>"), true);

    // MATLAB generator
    const A = dom.map(x => `'${x}'`).join(", ");
    const B = cod.map(y => `'${y}'`).join(", ");
    const fPairs = parsed.pairs.map(([x, y]) => `'%s','%s'`).join("; "); // not used
    const keys = parsed.pairs.map(([x,_]) => `'${x}'`).join(", ");
    const vals = parsed.pairs.map(([_,y]) => `'${y}'`).join(", ");

    const matlab = [
`% Dominio y Codominio`,
`A = {${A}};`,
`B = {${B}};`,
`% Mapeo f (x -> y) como tabla`,
`X = {${keys}};`,
`Y = {${vals}};`,
`T = table(X(:), Y(:), 'VariableNames', {'x','fx'});`,
`disp(T);`,
``,
`% Verificar que sea función sobre A (cada x aparece una vez)`,
`isFunction = (height(unique(T(:,1))) == numel(A)) && all(ismember(A, T.x));`,
``,
`% Imagen`,
`Im = unique(T.fx);`,
``,
`% Injectiva: no repite salida`,
`injectiva = isFunction && (numel(Im) == height(T));`,
``,
`% Sobreyectiva: cubre B`,
`sobreyectiva = isFunction && all(ismember(B, Im));`,
``,
`biyectiva = injectiva && sobreyectiva;`,
`fprintf('Funcion=%d | Injectiva=%d | Sobreyectiva=%d | Biyectiva=%d\\n', isFunction, injectiva, sobreyectiva, biyectiva);`
    ].join("\n");

    if (codeEl) {
        codeEl.textContent = matlab;
        if (window.hljs) hljs.highlightElement(codeEl);
    }
}

/* =========================
   INVERSA
========================= */
function invertFunction() {
    const dom = parseCSV(document.getElementById("invDomain")?.value);
    const cod = parseCSV(document.getElementById("invCodomain")?.value);
    const mappingRaw = document.getElementById("invMap")?.value;
    const query = (document.getElementById("invQuery")?.value || "").trim();

    const resEl = document.getElementById("invResult");
    const codeEl = document.getElementById("invMatlab");

    if (dom.length === 0 || cod.length === 0 || !mappingRaw) {
        setResult(resEl, "⚠️ Completa dominio, codominio y mapeo.", false);
        return;
    }

    const parsed = parseMapping(mappingRaw);
    if (parsed.errors.length > 0) {
        setResult(resEl, parsed.errors.join("<br>"), false);
        return;
    }

    const rep = analyzeMapping(dom, cod, parsed.map);

    if (rep.notInCodomain.length > 0) {
        setResult(resEl, `⚠️ Hay salidas fuera del codominio: ${rep.notInCodomain.join(", ")}`, false);
        return;
    }

    if (!rep.bijective) {
        const why = [];
        if (!rep.isFunction) why.push(`faltan asignaciones en el dominio (${rep.missingDomain.join(", ")})`);
        if (rep.isFunction && !rep.injective) why.push("no es injectiva (se repite alguna salida)");
        if (rep.isFunction && !rep.surjective) why.push("no es sobreyectiva (no cubre todo B)");
        setResult(resEl, `❌ No tiene inversa porque ${why.join(" y ")}.`, false);
        return;
    }

    // construir inversa
    const inv = {};
    Object.keys(parsed.map).forEach(x => {
        inv[parsed.map[x]] = x;
    });

    const invPairs = Object.keys(inv).map(y => `${y}->${inv[y]}`);
    const lines = [];
    lines.push(`✅ Inversa encontrada:`);
    lines.push(`f⁻¹ = { ${invPairs.join(", ")} }`);

    if (query) {
        if (inv.hasOwnProperty(query)) lines.push(`<br><strong>f⁻¹(${query}) = ${inv[query]}</strong>`);
        else lines.push(`<br>⚠️ "${query}" no está en el codominio B.`);
    }

    setResult(resEl, lines.join("<br>"), true);

    // MATLAB generator
    const A = dom.map(x => `'${x}'`).join(", ");
    const B = cod.map(y => `'${y}'`).join(", ");
    const keys = parsed.pairs.map(([x,_]) => `'${x}'`).join(", ");
    const vals = parsed.pairs.map(([_,y]) => `'${y}'`).join(", ");

    const matlab = [
`% Dominio y Codominio`,
`A = {${A}};`,
`B = {${B}};`,
`X = {${keys}};`,
`Y = {${vals}};`,
`T = table(X(:), Y(:), 'VariableNames', {'x','fx'});`,
``,
`% Biyectiva => inversa`,
`isFunction = (height(unique(T(:,1))) == numel(A)) && all(ismember(A, T.x));`,
`Im = unique(T.fx);`,
`injectiva = isFunction && (numel(Im) == height(T));`,
`sobreyectiva = isFunction && all(ismember(B, Im));`,
`biyectiva = injectiva && sobreyectiva;`,
``,
`if ~biyectiva`,
`    error('No hay inversa: la funcion no es biyectiva');`,
`end`,
``,
`% Inversa como tabla (y -> x)`,
`Tinv = table(T.fx, T.x, 'VariableNames', {'y','finv_y'});`,
`disp(Tinv);`,
``,
`% Consulta ejemplo`,
`yq = '${query || (cod[0] || "")}';`,
`idx = strcmp(Tinv.y, yq);`,
`if any(idx)`,
`    fprintf('f^{-1}(%s) = %s\\n', yq, Tinv.finv_y{idx});`,
`else`,
`    fprintf('y=%s no encontrado\\n', yq);`,
`end`
    ].join("\n");

    if (codeEl) {
        codeEl.textContent = matlab;
        if (window.hljs) hljs.highlightElement(codeEl);
    }
}

/* =========================
   COMPOSICIÓN
========================= */
function composeFunctions() {
    const A = parseCSV(document.getElementById("compDomain")?.value);
    const B = parseCSV(document.getElementById("compMid")?.value);
    const C = parseCSV(document.getElementById("compCodomain")?.value);
    const rawF = document.getElementById("compMapF")?.value;
    const rawG = document.getElementById("compMapG")?.value;

    const resEl = document.getElementById("compResult");
    const codeEl = document.getElementById("compMatlab");

    if (A.length === 0 || B.length === 0 || C.length === 0 || !rawF || !rawG) {
        setResult(resEl, "⚠️ Completa A, B, C, f y g.", false);
        return;
    }

    const fParsed = parseMapping(rawF);
    const gParsed = parseMapping(rawG);

    if (fParsed.errors.length > 0) { setResult(resEl, fParsed.errors.join("<br>"), false); return; }
    if (gParsed.errors.length > 0) { setResult(resEl, gParsed.errors.join("<br>"), false); return; }

    const fRep = analyzeMapping(A, B, fParsed.map);
    const gRep = analyzeMapping(B, C, gParsed.map);

    if (!fRep.isFunction) { setResult(resEl, `❌ f no es función: faltan ${fRep.missingDomain.join(", ")}`, false); return; }
    if (!gRep.isFunction) { setResult(resEl, `❌ g no es función: faltan ${gRep.missingDomain.join(", ")}`, false); return; }

    // composición
    const comp = {};
    const missingInG = [];
    A.forEach(x => {
        const y = fParsed.map[x];
        if (!gParsed.map.hasOwnProperty(y)) missingInG.push(`${x}: g(${y}) no definido`);
        else comp[x] = gParsed.map[y];
    });

    const pairs = Object.keys(comp).map(x => `${x}->${comp[x]}`);

    const lines = [];
    lines.push(`✅ (g ∘ f)(x) calculada`);
    lines.push(`(g ∘ f) = { ${pairs.join(", ")} }`);
    if (missingInG.length > 0) lines.push(`<br>⚠️ Faltó g(y) para: ${missingInG.join(" | ")}`);

    setResult(resEl, lines.join("<br>"), true);

    // MATLAB generator
    const matA = A.map(v => `'${v}'`).join(", ");
    const matB = B.map(v => `'${v}'`).join(", ");
    const matC = C.map(v => `'${v}'`).join(", ");
    const fX = fParsed.pairs.map(([x,_]) => `'${x}'`).join(", ");
    const fY = fParsed.pairs.map(([_,y]) => `'${y}'`).join(", ");
    const gX = gParsed.pairs.map(([x,_]) => `'${x}'`).join(", ");
    const gY = gParsed.pairs.map(([_,y]) => `'${y}'`).join(", ");

    const matlab = [
`% Conjuntos`,
`A = {${matA}}; B = {${matB}}; C = {${matC}};`,
``,
`% f: A->B`,
`Tf = table({${fX}}', {${fY}}', 'VariableNames', {'x','fx'});`,
`% g: B->C`,
`Tg = table({${gX}}', {${gY}}', 'VariableNames', {'y','gy'});`,
``,
`% Composición (g o f)`,
`Tcomp = table('Size',[0 2],'VariableTypes',{'string','string'},'VariableNames',{'x','gofx'});`,
`for i = 1:height(Tf)`,
`    x = string(Tf.x{i});`,
`    y = string(Tf.fx{i});`,
`    j = find(strcmp(Tg.y, y), 1);`,
`    if ~isempty(j)`,
`        Tcomp = [Tcomp; {x, string(Tg.gy{j})}]; %#ok<AGROW>`,
`    end`,
`end`,
`disp(Tcomp);`
    ].join("\n");

    if (codeEl) {
        codeEl.textContent = matlab;
        if (window.hljs) hljs.highlightElement(codeEl);
    }
}

/* =========================
   FUNCIÓN DISCRETA (PLOT)
========================= */
function plotDiscrete() {
    const xRaw = document.getElementById("discX")?.value;
    const yRaw = document.getElementById("discY")?.value;
    const resEl = document.getElementById("discResult");
    const codeEl = document.getElementById("discMatlab");
    const canvas = document.getElementById("discCanvas");

    const xs = parseCSV(xRaw).map(Number);
    const ys = parseCSV(yRaw).map(Number);

    if (xs.length === 0 || ys.length === 0) {
        setResult(resEl, "⚠️ Ingresa x y f(x).", false);
        return;
    }
    if (xs.some(n => Number.isNaN(n)) || ys.some(n => Number.isNaN(n))) {
        setResult(resEl, "❌ Usa solo números (ej: 0,1,2).", false);
        return;
    }
    if (xs.length !== ys.length) {
        setResult(resEl, "❌ x y f(x) deben tener la misma cantidad de valores.", false);
        return;
    }

    // tabla
    let tableHtml = `<strong>Tabla:</strong><br>`;
    tableHtml += xs.map((x, i) => `x=${x} → f(x)=${ys[i]}`).join("<br>");
    setResult(resEl, tableHtml, true);

    // dibujar
    if (canvas && canvas.getContext) {
        drawDiscretePlot(canvas, xs, ys);
    }

    // MATLAB
    const matlab = [
`x = [${xs.join(" ")}];`,
`y = [${ys.join(" ")}];`,
`stem(x, y, 'filled');`,
`grid on;`,
`xlabel('x'); ylabel('f(x)');`,
`title('Función discreta');`
    ].join("\n");

    if (codeEl) {
        codeEl.textContent = matlab;
        if (window.hljs) hljs.highlightElement(codeEl);
    }
}

function drawDiscretePlot(canvas, xs, ys) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;

    ctx.clearRect(0,0,w,h);

    // Margen
    const m = 45;
    const plotW = w - 2*m;
    const plotH = h - 2*m;

    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    // evitar división por cero
    const dx = (maxX - minX) || 1;
    const dy = (maxY - minY) || 1;

    const xToPx = x => m + ((x - minX) / dx) * plotW;
    const yToPx = y => (h - m) - ((y - minY) / dy) * plotH;

    // fondo grid
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    const gridN = 10;
    for (let i=0;i<=gridN;i++){
        const gx = m + (i/gridN)*plotW;
        const gy = m + (i/gridN)*plotH;
        ctx.beginPath(); ctx.moveTo(gx, m); ctx.lineTo(gx, h-m); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(m, gy); ctx.lineTo(w-m, gy); ctx.stroke();
    }

    // ejes
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m, h-m); ctx.lineTo(w-m, h-m); ctx.stroke(); // x
    ctx.beginPath(); ctx.moveTo(m, m); ctx.lineTo(m, h-m); ctx.stroke(); // y

    // puntos y stems
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;

    for (let i=0;i<xs.length;i++){
        const px = xToPx(xs[i]);
        const py = yToPx(ys[i]);
        const baseY = h - m;

        // stem
        ctx.beginPath();
        ctx.moveTo(px, baseY);
        ctx.lineTo(px, py);
        ctx.stroke();

        // punto
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI*2);
        ctx.fill();
    }

    // etiquetas min/max
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "14px monospace";
    ctx.fillText(`x: ${minX} … ${maxX}`, m, 20);
    ctx.fillText(`y: ${minY} … ${maxY}`, m, 38);
}

/* =========================
   RESEÑAS (LOCALSTORAGE)
========================= */
const REV_KEY = "mathbot_reviews_v1";

function loadReviews() {
    try {
        const raw = localStorage.getItem(REV_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr;
    } catch {
        return [];
    }
}

function saveReviews(arr) {
    localStorage.setItem(REV_KEY, JSON.stringify(arr));
}

function renderReviews() {
    const listEl = document.getElementById("reviewsList");
    if (!listEl) return;

    const reviews = loadReviews();

    if (reviews.length === 0) {
        listEl.innerHTML = `<div class="review-card"><div class="review-text">Aún no hay reseñas. Sé el primero.</div></div>`;
        return;
    }

    listEl.innerHTML = reviews
        .slice()
        .reverse()
        .map(r => {
            const safeName = (r.name || "Anónimo").replace(/</g,"&lt;").replace(/>/g,"&gt;");
            const safeText = (r.text || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
            const safeDate = (r.date || "");
            const rating = Number(r.rating) || 0;

            return `
            <div class="review-card">
                <div class="review-top">
                    <div>
                        <div class="review-name">${safeName}</div>
                        <div class="review-date">${safeDate}</div>
                    </div>
                    <div class="review-stars">${stars(rating)}</div>
                </div>
                <div class="review-text">${safeText}</div>
            </div>`;
        })
        .join("");
}

function addReview() {
    const name = (document.getElementById("revName")?.value || "").trim();
    const rating = Number(document.getElementById("revRating")?.value || "");
    const text = (document.getElementById("revText")?.value || "").trim();
    const msgEl = document.getElementById("revMsg");

    if (!text) {
        setResult(msgEl, "⚠️ Escribe un comentario.", false);
        return;
    }
    if (!(rating >= 1 && rating <= 5)) {
        setResult(msgEl, "⚠️ La calificación debe ser de 1 a 5.", false);
        return;
    }

    const now = new Date();
    const date = now.toLocaleString();

    const reviews = loadReviews();
    reviews.push({ name: name || "Anónimo", rating, text, date });
    saveReviews(reviews);

    // limpiar
    const nEl = document.getElementById("revName"); if (nEl) nEl.value = "";
    const rEl = document.getElementById("revRating"); if (rEl) rEl.value = "";
    const tEl = document.getElementById("revText"); if (tEl) tEl.value = "";

    setResult(msgEl, "✅ Reseña guardada en este navegador.", true);
    renderReviews();
}

function clearReviews() {
    localStorage.removeItem(REV_KEY);
    renderReviews();
    const msgEl = document.getElementById("revMsg");
    setResult(msgEl, "✅ Reseñas borradas.", true);
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    renderReviews();
    const canvas = document.getElementById("discCanvas");
    if (canvas && canvas.getContext) {
        // plot vacío de referencia
        drawDiscretePlot(canvas, [0,1], [0,1]);
    }
});
