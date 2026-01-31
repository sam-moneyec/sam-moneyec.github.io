
function validateLastTab(){
  try{
    const last = localStorage.getItem("mc_last_tab");
    if (!last) return;
    if (!document.getElementById(last)){
      localStorage.removeItem("mc_last_tab");
    }
  }catch(e){}
}



function bindTabLinksHard(){
  const links = Array.from(document.querySelectorAll(".sidebar a.tab-link"));
  links.forEach(a=>{
    // Extract tabName from onclick="openTab(event, 'x')"
    let tab = a.getAttribute("data-tab");
    if (!tab){
      const oc = a.getAttribute("onclick") || "";
      const m = oc.match(/openTab\(\s*event\s*,\s*'([^']+)'\s*\)/);
      if (m) tab = m[1];
    }
    if (tab) a.setAttribute("data-tab", tab);

    // Always bind a real click handler (more reliable than inline)
    a.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const t = a.getAttribute("data-tab");
      if (typeof window.openTab === "function" && t){
        window.openTab(e, t);
      }else{
        // ultra-fallback: show the tab by id
        document.querySelectorAll(".tab-content").forEach(x=>{ x.style.display="none"; x.classList.remove("active"); });
        const el = document.getElementById(t);
        if (el){ el.style.display="block"; el.classList.add("active"); }
      }
      // On drawer mode, close sidebar after selection
      try{ document.body.classList.remove("sidebar-open"); }catch(_){}
    }, {capture:true});
  });
}




function getNavItems(){
  const links = Array.from(document.querySelectorAll(".sidebar .tab-link"));
  return links.map(a=>{
    const label = (a.dataset.label || a.textContent || "").trim();
    const tab = a.getAttribute("data-tab") || "";
    const icon = (a.querySelector("i")||{}).className || "fas fa-circle";
    return {a,label,tab,icon};
  });
}

function highlightCurrentSection(){
  // add a brief highlight to the first visible heading inside active tab
  const active = document.querySelector(".tab-content.active") || document.querySelector(".tab-content[style*='display: block']");
  if (!active) return;
  const target = active.querySelector("h1,h2,.topic-header,.urban-title,.section-title");
  if (target){
    target.classList.add("flash-highlight");
    setTimeout(()=>target.classList.remove("flash-highlight"), 1300);
  }
}

function updateProfilePanel(){
  const level = Number(localStorage.getItem("mc_level")||1);
  const xp = Number(localStorage.getItem("mc_xp")||0);
  const st = loadStreak();
  const done = JSON.parse(localStorage.getItem("mc_done")||"{}");
  const doneCount = Object.values(done).filter(Boolean).length;

  const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=String(val); };
  set("profLevel", level);
  set("profXp", xp);
  set("profStreak", st.count||1);
  set("profDone", doneCount);
}

// =========================
// Modal helpers (robusto)
// =========================
function openModal(id){
  const m = document.getElementById(id);
  if (!m) return;
  // Support both legacy `.show` and current `.open`
  m.classList.add("open","show");
  m.setAttribute("aria-hidden","false");
  // focus first focusable element
  try{
    const focusable = m.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable && focusable.focus && focusable.focus();
  }catch(e){}
}
function closeModal(id){
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove("open","show");
  m.setAttribute("aria-hidden","true");
}
// Cierre universal: cualquier elemento con [data-close] cierra su modal.
// Soporta data-close="profileModal" o data-close="true" (cierra el modal contenedor).
function initGlobalModalClose(){
  if (window.__mcModalCloseBound) return;
  window.__mcModalCloseBound = true;

  document.addEventListener("click", (e)=>{
    const el = e.target.closest("[data-close]");
    if (!el) return;
    const target = (el.getAttribute("data-close") || "").trim();
    // Evitar que el click dispare otras cosas
    e.preventDefault();
    e.stopPropagation();

    if (target && target !== "true"){
      closeModal(target);
    }else{
      // data-close="true" -> cerrar modal padre
      const parentModal = el.closest(".modal");
      if (parentModal && parentModal.id){
        closeModal(parentModal.id);
      }else if (parentModal){
        parentModal.classList.remove("show");
        parentModal.setAttribute("aria-hidden","true");
      }
    }
  }, true);

  // Click fuera (backdrop) ya está cubierto si tiene data-close.
  // ESC: cierra el modal visible más reciente.
  document.addEventListener("keydown", (e)=>{
    if (e.key !== "Escape") return;
    const shown = Array.from(document.querySelectorAll(".modal.open, .modal.show"));
    if (shown.length){
      const last = shown[shown.length - 1];
      if (last && last.id) closeModal(last.id);
    }
  }, true);
}

function openProfile(){
  updateProfilePanel();
  openModal("profileModal");
}


function initQuickSearch(){
  const modal = document.getElementById("quickSearchModal");
  const input = document.getElementById("qsInput");
  const results = document.getElementById("qsResults");
  if (!modal || !input || !results) return;

  const items = getNavItems();

  const render = (q)=>{
    const norm = (s)=> (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const nq = norm(q);
    const list = items.filter(it=> !nq || norm(it.label).includes(nq)).slice(0, 10);
    results.innerHTML = list.map(it=>`
      <div class="qs-row" data-tab="${it.tab}">
        <i class="${it.icon}"></i>
        <span>${it.label}</span>
        <small>${it.tab}</small>
      </div>
    `).join("") || `<div class="qs-row" style="opacity:.75; cursor:default;"><span>No hay resultados</span></div>`;
    results.querySelectorAll(".qs-row[data-tab]").forEach(row=>{
      row.addEventListener("click", ()=>{
        const tab = row.getAttribute("data-tab");
        const a = document.querySelector(`.sidebar .tab-link[data-tab="${tab}"]`);
        if (a) a.click();
        closeModal("quickSearchModal");
        setTimeout(highlightCurrentSection, 80);
      });
    });
  };

  input.addEventListener("input", ()=>render(input.value));
  input.addEventListener("keydown",(e)=>{
    if (e.key==="Escape"){ closeModal("quickSearchModal"); }
    if (e.key==="Enter"){
      const first = results.querySelector(".qs-row[data-tab]");
      first?.click();
    }
  });

  // Ctrl+K opens quick search
  document.addEventListener("keydown",(e)=>{
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){
      e.preventDefault();
      openModal("quickSearchModal");
      setTimeout(()=>{ input.focus(); input.select(); render(input.value); }, 20);
    }
  });
}

function initXpBadge(){
  document.getElementById("xpBadge")?.addEventListener("click", openProfile);
  document.getElementById("resetProgressBtn")?.addEventListener("click", ()=>{
    if (!confirm("¿Reiniciar progreso? Se borrará XP, nivel, racha y completados.")) return;
    ["mc_xp","mc_level","mc_done","mc_streak","mc_ach","mc_xp_keys","mc_practice","mc_practice_history","mc_sound","mc_theme"].forEach(k=>localStorage.removeItem(k));
    showToast("Progreso reiniciado.", "info");
    // refresh HUD
    saveXp(loadXp());
    updateStreak();
    updateProfilePanel();
  });
}

// tiny beep using WebAudio when sound is on
function uiBeep(){
  const v = localStorage.getItem("mc_sound") || "off";
  if (v !== "on") return;
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 660;
    g.gain.value = 0.04;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, 110);
  }catch(e){}
}



// ===== Mission numbering (sidebar) =====
function renumberMissionBadges(){
  const links = Array.from(document.querySelectorAll(".sidebar a.tab-link"));
  let n = 0;
  links.forEach(a=>{
    // data-tab could be set by bindTabLinksHard; fallback to onclick
    let tab = a.getAttribute("data-tab") || "";
    if (!tab){
      const oc = a.getAttribute("onclick") || "";
      const m = oc.match(/openTab\(\s*event\s*,\s*'([^']+)'\s*\)/);
      if (m) tab = m[1];
    }
    const badge = a.querySelector(".mission-badge");
    if (!badge) return;
    if (["inicio","video","resenas"].includes(tab)) return;
    n += 1;
    badge.textContent = "MISION " + n;
  });
}

// ===== Player panel (mission panel) close/open =====
function initPlayerPanelClose(){
  const panel = document.getElementById("missionPanel");
  const closeBtn = document.getElementById("missionClose");
  const openBtn = document.getElementById("panelBtn");
  const xp = document.getElementById("xpBadge");

  if (!panel) return;

  const setHidden = (hidden)=>{
    panel.classList.toggle("is-hidden", !!hidden);
    try{ localStorage.setItem("mc_panel_hidden", hidden ? "1" : "0"); }catch(e){}
  };

  // restore
  try{
    setHidden(localStorage.getItem("mc_panel_hidden")==="1");
  }catch(e){}

  closeBtn && closeBtn.addEventListener("click", ()=> setHidden(true));
  openBtn && openBtn.addEventListener("click", ()=> setHidden(false));

  // Optional: click XP badge toggles panel
  xp && xp.addEventListener("click", ()=>{
    const hidden = panel.classList.contains("is-hidden");
    setHidden(!hidden);
  });
}

// ===== Practice Mode Engine =====

let PRACTICE_STATE = null;
let PRACTICE_HISTORY = loadPracticeHistory();

function loadPracticeHistory(){
  try{ return JSON.parse(localStorage.getItem("mc_practice_history")||"[]") || []; }catch(e){ return []; }
}
function savePracticeHistory(arr){
  try{ localStorage.setItem("mc_practice_history", JSON.stringify(arr||[])); }catch(e){}
}
function pushPracticeHistory(entry){
  let arr = loadPracticeHistory();
  arr.unshift(entry);
  arr = arr.slice(0, 50); // límite
  savePracticeHistory(arr);
  PRACTICE_HISTORY = arr;
  renderPracticeHistory();
}
function renderPracticeHistory(){
  const box = document.getElementById("practiceHistory");
  if (!box) return;
  const arr = loadPracticeHistory();
  if (!arr.length){
    box.innerHTML = `<div class="muted">Sin historial todavía. Genera un reto y evalúa tu respuesta.</div>`;
    return;
  }
  box.innerHTML = arr.map((r, idx)=>{
    const ok = r.ok ? "ok" : "bad";
    const t = (r.topicLabel || r.topic || "").replace(/</g,"&lt;");
    const when = r.when || "";
    const xp = r.xp ? `+${r.xp} XP` : "";
    return `<div class="ph-row ${ok}">
      <div class="ph-left">
        <div class="ph-title">${t} · Nivel ${r.level}</div>
        <div class="ph-sub">${when} · ${r.ok ? "Correcto" : "Incorrecto"} ${xp}</div>
      </div>
      <button class="btn mini ph-open" data-ph-index="${idx}" title="Cargar este reto"><i class="fas fa-folder-open"></i></button>
    </div>`;
  }).join("");
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function parseCSV(s){ return (s||"").split(",").map(x=>x.trim()).filter(Boolean); }

function parsePairsFromAnswer(s){
  const t = (s||"").replace(/[{}]/g,"");
  const pairs = [];
  const re = /\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g;
  let m;
  while((m=re.exec(t))){
    pairs.push([m[1].trim(), m[2].trim()]);
  }
  return pairs;
}
function normStr(s){
  return (s||"").toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function sameSetNorm(a,b){
  const sa = new Set(a.map(normStr));
  const sb = new Set(b.map(normStr));
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}
function samePairs(pa, pb){
  const a = pa.map(p=>`${normStr(p[0])}→${normStr(p[1])}`);
  const b = pb.map(p=>`${normStr(p[0])}→${normStr(p[1])}`);
  return sameSetNorm(a,b);
}

function makePractice(topic, level){
  if (topic==="prod-cartesiano") return makeCartesian(level);
  if (topic==="clasificacion") return makeClassification(level);
  if (topic==="inversa") return makeInverse(level);
  if (topic==="compuesta") return makeComposite(level);
  if (topic==="discreta") return makeDiscrete(level);
  return makeCartesian(level);
}

function makeCartesian(level){
  const sizeA = level===1?2:level===2?3:4;
  const sizeB = level===1?2:level===2?3:4;
  const poolA = ["1","2","3","4","5","6","7","8","9"];
  const poolB = ["a","b","c","d","e","f"];
  const A = Array.from(new Set(Array.from({length:sizeA},()=>pick(poolA)))).slice(0,sizeA);
  const B = Array.from(new Set(Array.from({length:sizeB},()=>pick(poolB)))).slice(0,sizeB);
  const pairs = [];
  A.forEach(x=>B.forEach(y=>pairs.push([x,y])));

  const prompt = `Dados A = {${A.join(",")}} y B = {${B.join(",")}}, escribe A×B como pares ordenados.\nEjemplo: (1,a),(1,b)...`;
  const matlab =
`A = {${A.map(x=>`'${x}'`).join(", ")}};\nB = {${B.map(x=>`'${x}'`).join(", ")}};\nP = {};\nfor i=1:numel(A)\n  for j=1:numel(B)\n    P{end+1} = sprintf('(%s,%s)', A{i}, B{j});\n  end\nend\ndisp(['A×B = { ' strjoin(P, ', ') ' }']);\n`;

  return {topic:"prod-cartesiano", level, prompt, matlab, type:"pairs", expected:pairs, payload:{A,B}};
}

function makeClassification(level){
  const n = level===1?3:level===2?4:5;
  const domain = Array.from({length:n},(_,i)=>String(i+1));
  const cod = ["a","b","c","d","e","f"].slice(0,n);

  const makeFunc = Math.random() > (level===1?0.25:0.45);
  let pairs = [];
  if (makeFunc){
    const perm = cod.slice().sort(()=>Math.random()-0.5);
    pairs = domain.map((x,i)=>[x, perm[i]]);
  }else{
    pairs = domain.map((x)=>[x, pick(cod)]);
    const xdup = pick(domain);
    pairs.push([xdup, pick(cod.filter(c=>c!==pairs.find(p=>p[0]===xdup)?.[1])) || pick(cod)]);
  }
  const prompt = `Relación R = { ${pairs.map(p=>`(${p[0]},${p[1]})`).join(", ")} }.\n¿R es una función? Responde: si / no.`;
  const matlab =
`R = {${pairs.map(p=>`'(${p[0]},${p[1]})'`).join(", ")}};\n% Verificar si es función: cada x aparece una sola vez\nxs = cellfun(@(s) extractBetween(s,'(',','), R);\nxs = string(xs);\nif numel(unique(xs)) == numel(xs)\n  disp('SI es función');\nelse\n  disp('NO es función');\nend\n`;
  return {topic:"clasificacion", level, prompt, matlab, type:"yn", expected: makeFunc ? "si" : "no", payload:{domain, cod, pairs}};
}

function makeInverse(level){
  const n = level===1?3:level===2?4:5;
  const xs = Array.from({length:n},(_,i)=>String(i+1));
  const ys = ["a","b","c","d","e","f","g","h"].slice(0,n);
  const perm = ys.slice().sort(()=>Math.random()-0.5);
  const pairs = xs.map((x,i)=>[x, perm[i]]);
  const q = pick(perm);
  const xsol = pairs.find(p=>p[1]===q)[0];

  const prompt = `Sea f = { ${pairs.map(p=>`(${p[0]},${p[1]})`).join(", ")} }.\nCalcula f^{-1}(${q}). Responde SOLO el valor.`;
  const matlab =
`pairs = {${pairs.map(p=>`'${p[0]}->${p[1]}'`).join(", ")}};\nq = '${q}';\n% Invertir buscando el par cuyo valor sea q\nfor k=1:numel(pairs)\n  parts = split(string(pairs{k}), '->');\n  if parts(2)==q\n    disp(['f^{-1}(' q ') = ' char(parts(1))]);\n  end\nend\n`;
  return {topic:"inversa", level, prompt, matlab, type:"scalar", expected:xsol, payload:{pairs,q}};
}

function makeComposite(level){
  const n = level===1?3:level===2?4:5;
  const A = Array.from({length:n},(_,i)=>String(i+1));
  const B = ["a","b","c","d","e","f","g"].slice(0,n);
  const C = ["α","β","γ","δ","ε","ζ","η"].slice(0,n);

  const fperm = B.slice().sort(()=>Math.random()-0.5);
  const gperm = C.slice().sort(()=>Math.random()-0.5);
  const f = A.map((x,i)=>[x,fperm[i]]);
  const g = B.map((b,i)=>[b,gperm[i]]);
  const x0 = pick(A);
  const fx = f.find(p=>p[0]===x0)[1];
  const gfx = g.find(p=>p[0]===fx)[1];

  const prompt = `Dados f y g:\n f = { ${f.map(p=>`(${p[0]},${p[1]})`).join(", ")} }\n g = { ${g.map(p=>`(${p[0]},${p[1]})`).join(", ")} }\nCalcula (g∘f)(${x0}). Responde SOLO el valor.`;
  const matlab =
`% Mapas como listas de pares\nf = {${f.map(p=>`'${p[0]}->${p[1]}'`).join(", ")}};\ng = {${g.map(p=>`'${p[0]}->${p[1]}'`).join(", ")}};\nx0='${x0}';\n% calcular f(x0)\nfx='';\nfor k=1:numel(f)\n  parts=split(string(f{k}),'->');\n  if parts(1)==x0\n    fx=char(parts(2));\n  end\nend\n% calcular g(fx)\nres='';\nfor k=1:numel(g)\n  parts=split(string(g{k}),'->');\n  if parts(1)==string(fx)\n    res=char(parts(2));\n  end\nend\ndisp(['(g∘f)(' x0 ') = ' res]);\n`;
  return {topic:"compuesta", level, prompt, matlab, type:"scalar", expected:gfx, payload:{A,B,C,f,g,x0}};
}

function makeDiscrete(level){
  const n = level===1?5:level===2?7:9;
  const xs = Array.from({length:n},(_,i)=>i+1);
  const ys = xs.map(()=>randInt(0,9));
  const idx = randInt(0,n-1);
  const xq = xs[idx];
  const yq = ys[idx];

  const prompt = `X = [${xs.join(", ")}]\nY = [${ys.join(", ")}]\n¿Cuál es y cuando x = ${xq}? Responde SOLO el número.`;
  const matlab =
`X=[${xs.join(" ")}];\nY=[${ys.join(" ")}];\nxq=${xq};\nidx=find(X==xq);\ndisp(['y(' num2str(xq) ') = ' num2str(Y(idx))]);\n`;
  return {topic:"discreta", level, prompt, matlab, type:"scalar", expected:String(yq), payload:{xs,ys,xq}};
}

function renderPractice(){
  const promptBox = document.getElementById("practicePrompt");
  const feedback = document.getElementById("practiceFeedback");
  const ans = document.getElementById("practiceAnswer");
  const codeEl = document.getElementById("practiceMatlab");
  if (!promptBox || !codeEl) return;

  if (!PRACTICE_STATE){
    promptBox.innerHTML = `<div class="video-placeholder" style="min-height:180px;">
      <div class="ph-title">Aún no hay reto</div>
      <div class="ph-sub">Genera un reto para empezar.</div>
    </div>`;
    codeEl.textContent = "% Genera un reto para ver el código MATLAB aquí.";
    if (feedback){ feedback.innerHTML = ""; feedback.classList.remove("ok","bad"); }
    if (ans) ans.value = "";
    try{ hljs.highlightElement(codeEl); }catch(e){}
    try{ renderChoices(); }catch(e){}
    try{ renderPracticeHistory(); }catch(e){}
    return;
  }

  const p = PRACTICE_STATE.prompt.replace(/</g,"&lt;").replace(/>/g,"&gt;");
  promptBox.innerHTML = `<pre class="practice-pre">${p}</pre>`;
  if (feedback){ feedback.innerHTML = ""; feedback.classList.remove("ok","bad"); }
  if (ans) ans.value = "";
  codeEl.textContent = PRACTICE_STATE.matlab;
  try{ hljs.highlightElement(codeEl); }catch(e){}
  try{ renderChoices(); }catch(e){}
  try{ renderPracticeHistory(); }catch(e){}
}


function topicLabel(t){
  switch(t){
    case "prod-cartesiano": return "Producto cartesiano";
    case "clasificacion": return "Clasificación";
    case "inversa": return "Función inversa";
    case "compuesta": return "Función compuesta";
    case "discreta": return "Función discreta";
    default: return t || "Práctica";
  }
}

function buildChoicesFor(state){
  if (!state) return [];
  if (state.type === "yn"){
    return ["Sí","No"];
  }
  if (state.type === "scalar"){
    const correct = String(state.expected);
    const choices = new Set([correct]);
    const asNum = Number(correct);
    if (!Number.isNaN(asNum) && correct.trim() !== ""){
      const deltas = [1,2,3,-1,-2,-3];
      for (const d of deltas){
        if (choices.size>=4) break;
        choices.add(String(asNum + d));
      }
    } else {
      const pool = ["a","b","c","d","e","f","g","h","1","2","3","4"];
      for (const p of pool){
        if (choices.size>=4) break;
        if (p !== correct) choices.add(p);
      }
    }
    return shuffle(Array.from(choices)).slice(0,4);
  }
  if (state.type === "pairs" && Array.isArray(state.expected) && state.expected.length <= 6){
    const correct = `{ ${state.expected.map(p=>`(${p[0]},${p[1]})`).join(", ")} }`;
    const miss = `{ ${state.expected.slice(0, Math.max(1,state.expected.length-1)).map(p=>`(${p[0]},${p[1]})`).join(", ")} }`;
    const fake = state.expected[0] ? `{ ${state.expected.map(p=>`(${p[0]},${p[1]})`).join(", ")}, (${state.expected[0][0]},z) }` : miss;
    return shuffle([correct, miss, fake]).slice(0,3);
  }
  return [];
}

function renderChoices(){
  const box = document.getElementById("practiceChoices");
  if (!box) return;
  box.innerHTML = "";
  if (!PRACTICE_STATE) return;
  const choices = buildChoicesFor(PRACTICE_STATE);
  if (!choices.length) return;

  box.innerHTML = choices.map(c=>`<button class="choice-chip" type="button">${String(c).replace(/</g,"&lt;")}</button>`).join("");
  box.querySelectorAll(".choice-chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const val = btn.textContent || "";
      const inp = document.getElementById("practiceAnswer");
      if (inp) inp.value = val;
      try{ uiBeep(); }catch(e){}
    });
  });
}

function practiceHint(){
  if (!PRACTICE_STATE) return "";
  switch(PRACTICE_STATE.topic){
    case "prod-cartesiano": return "Incluye todos los pares (a,b) con a∈A y b∈B.";
    case "clasificacion": return "Si un x aparece con dos y distintos, no es función.";
    case "inversa": return "Encuentra el x que produce ese valor en f.";
    case "compuesta": return "Primero aplica f, luego g.";
    case "discreta": return "Encuentra el índice de x en X y toma el mismo índice en Y.";
    default: return "";
  }
}

function checkPractice(){
  const feedback = document.getElementById("practiceFeedback");
  const ansRaw = (document.getElementById("practiceAnswer")?.value || "");
  if (!feedback) return;

  if (!PRACTICE_STATE){
    feedback.classList.remove("ok","bad");
    feedback.classList.add("bad");
    feedback.textContent = "Primero genera un reto.";
    return;
  }

  if (!ansRaw.trim()){
    feedback.classList.remove("ok","bad");
    feedback.classList.add("bad");
    feedback.textContent = "Escribe una respuesta.";
    return;
  }

  let ok = false;
  if (PRACTICE_STATE.type==="scalar"){
    ok = normStr(ansRaw) === normStr(String(PRACTICE_STATE.expected));
  }else if (PRACTICE_STATE.type==="yn"){
    const a = normStr(ansRaw);
    const exp = normStr(String(PRACTICE_STATE.expected));
    ok = (["si","sí","s"].includes(a) && exp==="si") || (["no","n"].includes(a) && exp==="no");
  }else if (PRACTICE_STATE.type==="pairs"){
    const pa = parsePairsFromAnswer(ansRaw);
    ok = samePairs(pa, PRACTICE_STATE.expected);
  }

  feedback.classList.remove("ok","bad");
  if (ok){
    feedback.classList.add("ok");
    const gained = 60;
    const xpKey = `prac|${PRACTICE_STATE.topic}|${PRACTICE_STATE.level}|${PRACTICE_STATE.prompt}|${JSON.stringify(PRACTICE_STATE.expected)}`;
    let awarded = false;
    try{ awarded = awardXp(gained, "Práctica", xpKey); }catch(e){ awarded = false; }
    const actual = awarded ? gained : 0;
    feedback.innerHTML = awarded ? `✅ Correcto. +${gained} XP` : `✅ Correcto. (ya completado)`;
    try{ updateStreak(); }catch(e){}
    try{ pushPracticeHistory({topic:PRACTICE_STATE.topic, topicLabel: topicLabel(PRACTICE_STATE.topic), level:PRACTICE_STATE.level, ok:true, xp:actual, when: new Date().toLocaleString(), prompt:PRACTICE_STATE.prompt, expected:PRACTICE_STATE.expected, answer: ansRaw}); }catch(e){}
    try{ if (awarded) burstConfetti(); }catch(e){}
  }else{
    feedback.classList.add("bad");
    feedback.innerHTML = `❌ Incorrecto. <b>Pista:</b> ${practiceHint()}`;
    try{ pushPracticeHistory({topic:PRACTICE_STATE.topic, topicLabel: topicLabel(PRACTICE_STATE.topic), level:PRACTICE_STATE.level, ok:false, xp:0, when: new Date().toLocaleString(), prompt:PRACTICE_STATE.prompt, expected:PRACTICE_STATE.expected, answer: ansRaw}); }catch(e){}
  }
}

function revealPractice(){
  const feedback = document.getElementById("practiceFeedback");
  if (!feedback) return;

  if (!PRACTICE_STATE){
    feedback.classList.remove("ok","bad");
    feedback.classList.add("bad");
    feedback.textContent = "Primero genera un reto.";
    return;
  }

  feedback.classList.remove("ok","bad");
  feedback.classList.add("ok");
  if (PRACTICE_STATE.type==="pairs"){
    feedback.innerHTML = `Solución: { ${PRACTICE_STATE.expected.map(p=>`(${p[0]},${p[1]})`).join(", ")} }`;
  }else{
    feedback.innerHTML = `Solución: <b>${PRACTICE_STATE.expected}</b>`;
  }
}

function loadPracticeIntoSection(){
  if (!PRACTICE_STATE) return;

  const t = PRACTICE_STATE.topic;
  if (t==="prod-cartesiano"){
    document.getElementById("setA").value = PRACTICE_STATE.payload.A.join(",");
    document.getElementById("setB").value = PRACTICE_STATE.payload.B.join(",");
    openTab(new Event("click"), "prod-cartesiano");
    try{ calcCartesian(); }catch(e){}
  }else if (t==="clasificacion"){
    const d = PRACTICE_STATE.payload.domain;
    const c = PRACTICE_STATE.payload.cod;
    const pairs = PRACTICE_STATE.payload.pairs;
    document.getElementById("classDomain").value = d.join(",");
    document.getElementById("classCodomain").value = c.join(",");
    document.getElementById("classMap").value = pairs.map(p=>`${p[0]}->${p[1]}`).join(",");
    openTab(new Event("click"), "clasificacion");
    try{ classifyFunction(); }catch(e){}
  }else if (t==="inversa"){
    const pairs = PRACTICE_STATE.payload.pairs;
    const domain = Array.from(new Set(pairs.map(p=>p[0])));
    const codomain = Array.from(new Set(pairs.map(p=>p[1])));
    document.getElementById("invDomain").value = domain.join(",");
    document.getElementById("invCodomain").value = codomain.join(",");
    document.getElementById("invMap").value = pairs.map(p=>`${p[0]}->${p[1]}`).join(",");
    document.getElementById("invQuery").value = PRACTICE_STATE.payload.q;
    openTab(new Event("click"), "inversa");
    try{ invertFunction(); }catch(e){}
  }else if (t==="compuesta"){
    const A = PRACTICE_STATE.payload.A;
    const B = PRACTICE_STATE.payload.B;
    const C = PRACTICE_STATE.payload.C;
    const f = PRACTICE_STATE.payload.f;
    const g = PRACTICE_STATE.payload.g;
    document.getElementById("compDomain").value = A.join(",");
    document.getElementById("compMid").value = B.join(",");
    document.getElementById("compCodomain").value = C.join(",");
    document.getElementById("compMapF").value = f.map(p=>`${p[0]}->${p[1]}`).join(",");
    document.getElementById("compMapG").value = g.map(p=>`${p[0]}->${p[1]}`).join(",");
    openTab(new Event("click"), "compuesta");
    try{ composeFunctions(); }catch(e){}
  }else if (t==="discreta"){
    document.getElementById("discX").value = PRACTICE_STATE.payload.xs.join(",");
    document.getElementById("discY").value = PRACTICE_STATE.payload.ys.join(",");
    openTab(new Event("click"), "discreta");
    try{ plotDiscrete(); }catch(e){}
  }

  try{ showToast("Reto cargado en la sección"); }catch(e){}
}

function copyPracticeMatlab(){
  const code = document.getElementById("practiceMatlab")?.textContent || "";
  if (!navigator.clipboard){ return; }
  navigator.clipboard.writeText(code).then(()=>{ try{ showToast("MATLAB copiado"); }catch(e){} });
}
function downloadPracticeMatlab(){
  const code = document.getElementById("practiceMatlab")?.textContent || "";
  const blob = new Blob([code], {type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "practice.m";
  document.body.appendChild(a);
  a.click();
  a.remove();
}


function exportPracticeCSV(){
  const arr = loadPracticeHistory();
  const rows = [["fecha","tema","nivel","resultado","xp","respuesta","esperado","enunciado"]];
  arr.forEach(r=>{
    rows.push([
      r.when||"",
      topicLabel(r.topic||""),
      String(r.level||""),
      r.ok ? "correcto" : "incorrecto",
      String(r.xp||0),
      String(r.answer||"").replace(/\n/g," "),
      (typeof r.expected === "object" ? JSON.stringify(r.expected) : String(r.expected||"")),
      String(r.prompt||"").replace(/\n/g," ")
    ]);
  });
  const csv = rows.map(row=>row.map(cell=>{
    const s = String(cell).replace(/"/g,'""');
    return `"${s}"`;
  }).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "historial_practica.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function exportPracticeJSON(){
  const arr = loadPracticeHistory();
  const blob = new Blob([JSON.stringify(arr, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "historial_practica.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function initPracticeMode(){
  if (window.__mcPracticeBound) { try{ renderPractice(); }catch(e){}; return; }
  window.__mcPracticeBound = true;
  const topicSel = document.getElementById("practiceTopic");
  const levelSel = document.getElementById("practiceLevel");

  const btnNew = document.getElementById("practiceNew");
  const btnCheck = document.getElementById("practiceCheck");
  const btnReveal = document.getElementById("practiceReveal");
  const btnLoad = document.getElementById("practiceLoad");
  const btnReset = document.getElementById("practiceReset");
  const btnCopy = document.getElementById("practiceCopy");
  const btnDown = document.getElementById("practiceDownload");
  const btnHint = document.getElementById("practiceHintBtn");
  const btnCsv = document.getElementById("practiceExportCSV");
  const btnJson = document.getElementById("practiceExportJSON");
  const btnClear = document.getElementById("practiceClearHistory");

  if (!btnNew) return;

  btnNew.addEventListener("click", ()=>{
    const topic = topicSel?.value || "prod-cartesiano";
    const lvl = Number(levelSel?.value || 1);
    PRACTICE_STATE = makePractice(topic, lvl);
    renderPractice();
    try{ showToast("Reto generado"); }catch(e){}
  });

  btnCheck && btnCheck.addEventListener("click", checkPractice);
  btnReveal && btnReveal.addEventListener("click", revealPractice);
  btnLoad && btnLoad.addEventListener("click", loadPracticeIntoSection);
  btnReset && btnReset.addEventListener("click", ()=>{
    PRACTICE_STATE = null;
    renderPractice();
  });
  btnCopy && btnCopy.addEventListener("click", copyPracticeMatlab);
  btnDown && btnDown.addEventListener("click", downloadPracticeMatlab);


  btnHint && btnHint.addEventListener("click", ()=>{
    const fb = document.getElementById("practiceFeedback");
    if (!fb) return;
    fb.classList.remove("ok","bad");
    fb.classList.add("ok");
    fb.innerHTML = `💡 Pista: <b>${practiceHint()}</b>`;
    try{ uiBeep(); }catch(e){}
  });

  btnCsv && btnCsv.addEventListener("click", exportPracticeCSV);
  btnJson && btnJson.addEventListener("click", exportPracticeJSON);
  btnClear && btnClear.addEventListener("click", ()=>{
    savePracticeHistory([]);
    PRACTICE_HISTORY = [];
    renderPracticeHistory();
    try{ showToast("Historial limpio"); }catch(e){}
  });

  // Abrir un reto anterior desde el historial
  document.addEventListener("click", (e)=>{
    const b = e.target.closest && e.target.closest(".ph-open");
    if (!b) return;
    const idx = Number(b.getAttribute("data-ph-index"));
    const arr = loadPracticeHistory();
    const r = arr[idx];
    if (!r) return;
    // reconstruir estado básico
    const topic = r.topic || "prod-cartesiano";
    const lvl = Number(r.level || 1);
    PRACTICE_STATE = makePractice(topic, lvl);
    // reescribir para mostrar el mismo enunciado si existe
    if (r.prompt) PRACTICE_STATE.prompt = r.prompt;
    if (r.expected !== undefined) PRACTICE_STATE.expected = r.expected;
    renderPractice();
    const inp = document.getElementById("practiceAnswer");
    if (inp) inp.value = r.answer || "";
    try{ showToast("Reto cargado"); }catch(e){}
  }, true);

  // Enter para evaluar
  const ansInput = document.getElementById("practiceAnswer");
  ansInput && ansInput.addEventListener("keydown", (ev)=>{
    if (ev.key === "Enter"){
      ev.preventDefault();
      checkPractice();
    }
  });

  renderPractice();
}


function initPracticeEntryButtons(){
  const btn = document.getElementById("openPracticeFromEj");
  const tipBtn = document.getElementById("practiceQuickTipBtn");
  const tip = document.getElementById("practiceQuickTip");
  btn && btn.addEventListener("click", ()=>{
    openTab(new Event("click"), "practica");
    try{ showToast("Modo Práctica"); }catch(e){}
  });
  tipBtn && tipBtn.addEventListener("click", ()=>{
    if (!tip) return;
    const on = tip.style.display !== "none";
    tip.style.display = on ? "none" : "block";
    try{ uiBeep(); }catch(e){}
  });
}
document.addEventListener("DOMContentLoaded", () => {
  try{ validateLastTab(); }catch(e){}

  try{ initGlobalModalClose(); }catch(e){}

  try{ bindTabLinksHard(); }catch(e){}
  try{ renumberMissionBadges(); }catch(e){}
  try{ initPlayerPanelClose(); }catch(e){}
  try{ initPracticeMode(); }catch(e){}
  try{ initPracticeEntryButtons(); }catch(e){}

  try{ updateStreak(); }catch(e){}
  try{ saveXp(loadXp()); }catch(e){} // render XP in HUD
  try{ initSidebarSearch(); }catch(e){}
  try{ initStarPicker(); }catch(e){}
  try{ initModalSystem(); }catch(e){}
  try{ initHud(); }catch(e){}
  try{ initXpBadge(); }catch(e){}
  try{ initQuickSearch(); }catch(e){}
  try{ initVideoSection(); }catch(e){}
  try{ initPractice(); }catch(e){}
  try{ renderReviews(); }catch(e){}
  // pair-builder sync on blur
  [["class","classMap"],["inv","invMap"],["compF","compMapF"],["compG","compMapG"]].forEach(([p,id])=>{
    const el=document.getElementById(id);
    if(el){ el.addEventListener("blur", ()=>syncPairsFromInput(p,id)); syncPairs(p,id); }
  });
  initStarPicker?.();
});



function initSidebarSearch(){
  const input = document.getElementById("sidebarSearch");
  const btn = document.getElementById("sidebarSearchBtn");
  const results = document.getElementById("sidebarSearchResults");
  if (!input) return;

  const links = Array.from(document.querySelectorAll(".sidebar .tab-link"));
  // Store original labels (only the visible section name, without "MISION X")
  links.forEach(a=>{
    const txt = (a.querySelector(".nav-text") || a).textContent.trim();
    if (!a.dataset.label) a.dataset.label = txt;
  });

  const norm = (s)=> (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const clearHighlights = ()=>{
    links.forEach(a=>{
      const label = a.dataset.label || (a.querySelector(".nav-text")||a).textContent.trim();
      const target = (a.querySelector(".nav-text") || a);
      if (target) target.textContent = label;
    });
  };

  const apply = ()=>{
    const raw = input.value.trim();
    const q = norm(raw);
    let visibleCount = 0;

    links.forEach(a=>{
      const label = a.dataset.label || (a.querySelector(".nav-text")||a).textContent.trim();
      const match = !q || norm(label).includes(q);
      const li = a.closest("li") || a.parentElement;
      if (li) li.style.display = match ? "" : "none";
      if (match) visibleCount++;

      // highlight in nav-text only
      const target = (a.querySelector(".nav-text") || a);
      if (!target) return;
      if (!q){
        target.textContent = label;
      } else {
        const idx = norm(label).indexOf(q);
        if (idx >= 0){
          const before = label.slice(0, idx);
          const mid = label.slice(idx, idx + raw.length);
          const after = label.slice(idx + raw.length);
          target.innerHTML = `${escapeHtml(before)}<span class="nav-hit">${escapeHtml(mid)}</span>${escapeHtml(after)}`;
        } else {
          target.textContent = label;
        }
      }
    });

    // results dropdown
    if (results){
      results.innerHTML = "";
      if (!q){
        results.classList.remove("show");
      } else {
        const matches = links
          .filter(a=>{
            const li = a.closest("li") || a.parentElement;
            return li && li.style.display !== "none";
          })
          .slice(0, 7);

        if (!matches.length){
          results.innerHTML = `<div class="search-empty">Sin resultados</div>`;
        } else {
          matches.forEach(a=>{
            const item = document.createElement("button");
            item.type = "button";
            item.className = "search-result";
            item.textContent = a.dataset.label || a.textContent.trim();
            item.addEventListener("click", ()=>{
              a.click();
              results.classList.remove("show");
              document.body.classList.remove("menu-open");
            });
            results.appendChild(item);
          });
        }
        results.classList.add("show");
      }
    }
  };

  input.addEventListener("input", apply);
  input.addEventListener("keydown", (e)=>{
    if (e.key === "Enter"){
      const first = links.find(a=>{
        const li = a.closest("li") || a.parentElement;
        return li && li.style.display !== "none";
      });
      if (first){
        first.click();
        results?.classList.remove("show");
        document.body.classList.remove("menu-open");
      }
    }
    if (e.key === "Escape"){
      input.value = "";
      apply();
      results?.classList.remove("show");
    }
  });

  btn?.addEventListener("click", ()=>{
    input.focus();
    apply();
  });

  // "/" focuses the search
  document.addEventListener("keydown", (e)=>{
    if (e.key === "/" && document.activeElement !== input){
      e.preventDefault();
      input.focus();
    }
  });

  apply();
}



function openAchModal(){
  const modal = document.getElementById("achModal");
  if (!modal) return;
  renderAchievements();
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
}
function closeAchModal(){
  const modal = document.getElementById("achModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
}

function initModalSystem(){
  // Close achievements modal
  document.querySelectorAll("#achModal [data-close]").forEach(el=>{
    el.addEventListener("click", ()=> closeAchModal());
  });
  document.addEventListener("keydown", (e)=>{
    if (e.key === "Escape"){ 
      closeAchModal();
      document.body.classList.remove("sidebar-open");
    }
  });
}

function initHud(){
  // Streak click -> info
  document.querySelector(".streak")?.addEventListener("click", ()=>{
    const st = loadStreak();
    showToast(`Racha: ${st.count||1} día(s)`);
  });

  // Trophy -> open achievements modal
  document.getElementById("trophyBtn")?.addEventListener("click", openAchModal);

  // Sound toggle
  const soundBtn = document.getElementById("soundBtn");
  const getSound = ()=> (localStorage.getItem("mc_sound") || "off");
  const setSound = (v)=>{
    localStorage.setItem("mc_sound", v);
    if (soundBtn){
      soundBtn.innerHTML = v === "on" ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
      soundBtn.title = "Sonido: " + (v === "on" ? "on" : "off");
    }
    showToast(v === "on" ? "Sonido activado" : "Sonido desactivado");
    uiBeep();
  };
  setSound(getSound());
  soundBtn?.addEventListener("click", ()=> setSound(getSound()==="on" ? "off" : "on"));

  // Theme toggle (gold <-> cyber)
  const themeBtn = document.getElementById("themeBtn");
  const root = document.documentElement;
  const getTheme = ()=> localStorage.getItem("mc_theme") || "gold";
  const setTheme = (t)=>{
    root.setAttribute("data-theme", t);
    localStorage.setItem("mc_theme", t);
    showToast("Tema: " + (t === "cyber" ? "Cyber" : "Gold"));
  };
  setTheme(getTheme());
  themeBtn?.addEventListener("click", ()=> setTheme(getTheme()==="gold" ? "cyber" : "gold"));

  // Fullscreen
  const fsBtn = document.getElementById("fsBtn");
  const updateFs = ()=>{
    const isFs = !!document.fullscreenElement;
    if (fsBtn){
      fsBtn.innerHTML = isFs ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
      fsBtn.title = isFs ? "Salir de pantalla completa" : "Pantalla completa";
    }
  };
  updateFs();
  fsBtn?.addEventListener("click", async ()=>{
    try{
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    }catch(e){
      showToast("No se pudo activar pantalla completa.");
    }
    updateFs();
  });
  document.addEventListener("fullscreenchange", updateFs);

  // Sidebar toggle for mobile
  const toggle = document.getElementById("sidebarToggle");
  toggle?.addEventListener("click", ()=>{
    document.body.classList.toggle("sidebar-open");
  });
  // clicking overlay closes
  document.addEventListener("click",(e)=>{
    if (!document.body.classList.contains("sidebar-open")) return;
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.getElementById("sidebarToggle");
    if (sidebar && !sidebar.contains(e.target) && toggle && !toggle.contains(e.target)){
      document.body.classList.remove("sidebar-open");
    }
  });
}


// --- Layout stability: keep header height in CSS var (prevents motto clipping) ---
function updateTopbarHeight(){
  const header = document.querySelector('.top-header');
  if (!header) return;
  const h = Math.ceil(header.getBoundingClientRect().height);
  if (h > 0){
    document.documentElement.style.setProperty('--topbar-height', h + 'px');
  }
}
window.addEventListener('resize', ()=>requestAnimationFrame(updateTopbarHeight), { passive:true });

// ACTIVAR COLOREADO DE CÓDIGO
document.addEventListener('DOMContentLoaded', () => {
    if (window.hljs && typeof window.hljs.highlightAll === 'function') {
        window.hljs.highlightAll();
    }
});

// --- DICCIONARIO DE COLORES NEÓN VIBRANTES ---
const sectionColors = {
  practica: "#00FFC8",
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

    // Evitar salto al inicio por href="#"
    if (evt && evt.preventDefault) evt.preventDefault();

    // Color por sección (siempre definido)
    var newColor = sectionColors[tabName] || '#FFD700';

    // Ocultar contenidos
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    // Animación: reset clase active
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList && tabcontent[i].classList.remove("active");
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
        
        // Animación: activar
        if (currentTab.classList) {
            requestAnimationFrame(() => currentTab.classList.add("active"));
        }
document.documentElement.style.setProperty('--gold-primary', newColor);
    }

    // Activar botón
    if (evt && evt.currentTarget) {
        evt.currentTarget.className += " active";
        evt.currentTarget.style.borderColor = newColor;
        evt.currentTarget.style.color = newColor;
    }
    try{ ensureMiniMissions(); updateMiniMission(tabName); }catch(e){}


    try{ cleanupNonGameTabs(); }catch(e){}

    // UX: al cambiar de pestaña, vuelve arriba del panel central
    try{
        const scroller = document.querySelector(".main-content");
        if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
    }catch(e){}
    // Si no hubo evento (carga inicial), activa el link correspondiente
    if (!evt) { try{ activateLinkForTab(tabName); }catch(e){} }

    try{ localStorage.setItem("mc_last_tab", tabName); }catch(e){}
    try{ setCurrentSection(tabName); }catch(e){}
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

    const A = rawA.split(',').map(s => s.trim()).filter(Boolean);
    const B = rawB.split(',').map(s => s.trim()).filter(Boolean);
    if (A.length === 0 || B.length === 0) { 
        resDiv.innerHTML = "⚠️ DATOS FALTANTES"; 
        resDiv.style.color = "red";
        return;
    }

    let pairs = [];

    A.forEach(a => {
        B.forEach(b => {
            pairs.push(`(${a},${b})`);
        });
    });

    try{ awardXp(40, "Producto cartesiano", `cart|${A.join(",")}|${B.join(",")}`); }catch(e){}

    resDiv.style.color = "var(--gold-primary)";
    resDiv.innerHTML = `<strong>PARES GENERADOS:</strong><br>{ ${pairs.join(', ')} }`;
}

// =========================
//  NUEVAS SECCIONES (MC)
//  Clasificación / Inversa / Compuesta / Discreta / Video / Reseñas
// =========================

function parseList(raw) {
    if (!raw) return [];
    return raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
}

function parseMapping(raw) {
    const out = { map: {}, pairs: [], errors: [] };
    if (!raw) { out.errors.push("⚠️ Ingresa el mapeo."); return out; }

    let cleaned = raw.replace(/[{}]/g, '').trim();
    cleaned = cleaned.replace(/\(/g, '').replace(/\)/g, '');

    const parts = cleaned.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

    // Si el usuario puso "1,a,2,b" lo emparejamos
    let chunks = parts;
    const hasArrow = cleaned.includes("->") || cleaned.includes(":") || cleaned.includes("=");
    if (!hasArrow && parts.length % 2 === 0) {
        chunks = [];
        for (let i = 0; i < parts.length; i += 2) chunks.push(parts[i] + "," + parts[i+1]);
    }

    const seps = ["->", ":", "="];
    for (const p of chunks) {
        let x = "", y = "";

        let found = false;
        for (const sep of seps) {
            if (p.includes(sep)) {
                const tmp = p.split(sep);
                x = (tmp[0] || "").trim();
                y = (tmp[1] || "").trim();
                found = true;
                break;
            }
        }
        if (!found && p.includes(",")) {
            const tmp = p.split(",");
            x = (tmp[0] || "").trim();
            y = (tmp[1] || "").trim();
            found = true;
        }

        if (!x || !y) {
            out.errors.push(`⚠️ Par inválido: "${p}"`);
            continue;
        }

        if (Object.prototype.hasOwnProperty.call(out.map, x) && out.map[x] !== y) {
            out.errors.push(`❌ No es función: "${x}" tiene dos salidas (${out.map[x]} y ${y}).`);
            continue;
        }

        out.map[x] = y;
        out.pairs.push([x, y]);
    }

    if (out.pairs.length === 0 && out.errors.length === 0) out.errors.push("⚠️ No se detectaron pares.");
    return out;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


// =============================
// UI helpers (toast / download / pair builder)
// =============================
function showToast(msg, type="info", ms=2600) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.className = "toast toast-" + type;
    el.textContent = msg;
    el.style.display = "block";
    el.style.opacity = "1";
    clearTimeout(el.__t);
    el.__t = setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(()=>{ el.style.display = "none"; }, 250);
    }, ms);
}

function downloadCode(codeId, filename="script.m") {
    const el = document.getElementById(codeId);
    if (!el) return;
    const txt = el.textContent || "";
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast("Descargado: " + filename, "ok");
}

// Pair builder store
const pairStore = Object.create(null);

function addPair(prefix, mapInputId) {
    const xEl = document.getElementById(prefix + "PairX");
    const yEl = document.getElementById(prefix + "PairY");
    const listEl = document.getElementById(prefix + "PairsList");
    const mapEl = document.getElementById(mapInputId);

    if (!xEl || !yEl || !listEl || !mapEl) return;

    const x = (xEl.value || "").trim();
    const y = (yEl.value || "").trim();
    if (!x || !y) {
        showToast("Completa x e y.", "warn");
        return;
    }

    pairStore[prefix] = pairStore[prefix] || [];
    const idx = pairStore[prefix].findIndex(p => p[0] === x);
    if (idx >= 0) pairStore[prefix][idx] = [x, y];
    else pairStore[prefix].push([x, y]);

    xEl.value = ""; yEl.value = "";
    syncPairs(prefix, mapInputId);
}

function removePair(prefix, mapInputId, encodedX) {
    const x = decodeURIComponent(encodedX || "");
    pairStore[prefix] = (pairStore[prefix] || []).filter(p => p[0] !== x);
    syncPairs(prefix, mapInputId);
}

function clearPairs(prefix, mapInputId) {
    pairStore[prefix] = [];
    syncPairs(prefix, mapInputId);
    showToast("Pares borrados.", "info");
}

function syncPairs(prefix, mapInputId) {
    const listEl = document.getElementById(prefix + "PairsList");
    const mapEl = document.getElementById(mapInputId);
    if (!listEl || !mapEl) return;

    const arr = pairStore[prefix] || [];
    mapEl.value = arr.map(([x,y]) => `${x}->${y}`).join(", ");

    if (!arr.length) {
        listEl.innerHTML = `<span class="pairs-empty">Sin pares (usa + para agregar)</span>`;
        return;
    }

    listEl.innerHTML = arr.map(([x,y]) => {
        const ex = encodeURIComponent(x);
        return `<span class="pair-chip"><strong>${escapeHtml(x)}</strong>→${escapeHtml(y)} <button class="chip-x" onclick="removePair('${prefix}','${mapInputId}','${ex}')">×</button></span>`;
    }).join("");
}

// When user writes mapping manually, try to reflect it into the builder list
function syncPairsFromInput(prefix, mapInputId) {
    const mapEl = document.getElementById(mapInputId);
    if (!mapEl) return;
    const parsed = parseMapping(mapEl.value);
    if (parsed.errors.length) return; // don't overwrite with bad input
    pairStore[prefix] = parsed.pairs.map(([x,y]) => [x,y]);
    syncPairs(prefix, mapInputId);
}

function clearSection(sectionId) {
    if (sectionId === "clasificacion") {
        ["classDomain","classCodomain","classMap","classPairX","classPairY"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
        const out = document.getElementById("classResult"); if(out) out.textContent="Esperando entrada...";
        const wrap = document.getElementById("classMatlabWrap"); if(wrap) wrap.style.display="none";
        pairStore["class"] = []; syncPairs("class","classMap");
    }
    if (sectionId === "inversa") {
        ["invDomain","invCodomain","invMap","invQuery","invPairX","invPairY"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
        const out = document.getElementById("invResult"); if(out) out.textContent="Esperando entrada...";
        const wrap = document.getElementById("invMatlabWrap"); if(wrap) wrap.style.display="none";
        pairStore["inv"] = []; syncPairs("inv","invMap");
    }
    if (sectionId === "compuesta") {
        ["compDomain","compMid","compCodomain","compMapF","compMapG","compFPairX","compFPairY","compGPairX","compGPairY"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
        const out = document.getElementById("compResult"); if(out) out.textContent="Esperando entrada...";
        const wrap = document.getElementById("compMatlabWrap"); if(wrap) wrap.style.display="none";
        pairStore["compF"] = []; pairStore["compG"] = [];
        syncPairs("compF","compMapF"); syncPairs("compG","compMapG");
    }
    if (sectionId === "discreta") {
        ["discX","discY"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
        const out = document.getElementById("discResult"); if(out) out.textContent="Esperando entrada...";
        const wrap = document.getElementById("discMatlabWrap"); if(wrap) wrap.style.display="none";
        const canvas = document.getElementById("discCanvas");
        if (canvas && canvas.getContext) canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
    }
    showToast("Listo: sección limpia.", "ok");
}

function pairsTable(pairs, h1="x", h2="f(x)") {
    const rows = pairs.map(([a,b]) => `<tr><td>${escapeHtml(a)}</td><td>${escapeHtml(b)}</td></tr>`).join("");
    return `<table class="mini-table"><thead><tr><th>${escapeHtml(h1)}</th><th>${escapeHtml(h2)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function setMatlab(codeId, wrapId, codeStr, autoOpen=true) {
    const codeEl = document.getElementById(codeId);
    const wrap = document.getElementById(wrapId);
    if (!codeEl || !wrap) return;
    codeEl.textContent = codeStr || "";
    if (autoOpen) wrap.style.display = "block";

    // highlight.js (si existe)
    if (window.hljs && typeof window.hljs.highlightElement === "function") {
        try { window.hljs.highlightElement(codeEl); } catch {}
    }
}

function toggleMatlab(wrapId, btnEl) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const isHidden = (wrap.style.display === "none" || wrap.style.display === "");
    wrap.style.display = isHidden ? "block" : "none";
    if (btnEl) btnEl.textContent = isHidden ? "Ocultar MATLAB" : "Ver MATLAB";
}

async function copyCode(codeId) {
    const el = document.getElementById(codeId);
    if (!el) return;
    const txt = el.textContent || "";
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(txt);
            showToast("Copiado ✓", "ok");
        } else {
            throw new Error("no clipboard");
        }
    } catch {
        const ta = document.createElement("textarea");
        ta.value = txt;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Copiado ✓", "ok");
    }
}

function badge(text, type="ok") {
    const cls = type === "ok" ? "badge-ok" : (type === "warn" ? "badge-warn" : "badge-bad");
    return `<span class="pill ${cls}">${escapeHtml(text)}</span>`;
}

// --------- CLASIFICACIÓN ----------
function classifyFunction() {
    const domain = parseList(document.getElementById("classDomain")?.value);
    const codomain = parseList(document.getElementById("classCodomain")?.value);
    const mapping = parseMapping(document.getElementById("classMap")?.value);
    const out = document.getElementById("classResult");

    if (!out) return;

    const errors = [];
    if (domain.length === 0) errors.push("⚠️ Dominio A vacío.");
    if (codomain.length === 0) errors.push("⚠️ Codominio B vacío.");
    errors.push(...mapping.errors);

    if (errors.length) {
        out.innerHTML = `<div class="alert-bad">${errors.map(e => `<div>${escapeHtml(e)}</div>`).join("")}</div>`;
        setMatlab("classMatlab", "classMatlabWrap", "% Corrige los datos primero para generar el script MATLAB.", false);
        return;
    }

    // Validar que todo x del dominio tenga imagen
    const missingX = domain.filter(x => !Object.prototype.hasOwnProperty.call(mapping.map, x));
    const extraX = Object.keys(mapping.map).filter(x => !domain.includes(x));

    let isFunction = missingX.length === 0 && mapping.errors.length === 0;

    // Validar que imágenes estén en codominio
    const badY = Object.values(mapping.map).filter(y => !codomain.includes(y));
    if (badY.length) {
        isFunction = false;
        errors.push(`❌ Hay salidas fuera del codominio: ${[...new Set(badY)].join(", ")}`);
    }

    if (!isFunction) {
        const html = [
            badge("NO es función", "bad"),
            missingX.length ? `<div class="alert-warn">Faltan mapeos para: ${escapeHtml(missingX.join(", "))}</div>` : "",
            extraX.length ? `<div class="alert-warn">Sobran entradas (no están en A): ${escapeHtml(extraX.join(", "))}</div>` : "",
            errors.length ? `<div class="alert-bad">${errors.map(e => `<div>${escapeHtml(e)}</div>`).join("")}</div>` : "",
            pairsTable(mapping.pairs, "x", "imagen")
        ].join("");
        out.innerHTML = html;

        setMatlab("classMatlab","classMatlabWrap",
`% CLASIFICACIÓN (revisa datos: no es función con el dominio/codominio actual)
A = {${domain.map(x=>`'${x}'`).join(", ")}};
B = {${codomain.map(x=>`'${x}'`).join(", ")}};
% Mapeo (x -> y)
pairs = {${mapping.pairs.map(([x,y])=>`'${x}','${y}'`).join(", ")}};
% Sugerencia: valida que cada x en A tenga exactamente una salida en B.`, true);
        return;
    }

    // Injectiva: todas las imágenes únicas
    const images = domain.map(x => mapping.map[x]);
    const uniqueImages = new Set(images);
    const injective = uniqueImages.size === images.length;

    // Sobreyectiva: todas las y del codominio aparecen
    const imageSet = new Set(images);
    const surjective = codomain.every(y => imageSet.has(y));

    const bijective = injective && surjective;

    const html = [
        badge("Es función", "ok"),
        injective ? badge("Inyectiva", "ok") : badge("No inyectiva", "warn"),
        surjective ? badge("Sobreyectiva", "ok") : badge("No sobreyectiva", "warn"),
        bijective ? badge("Biyectiva", "ok") : badge("No biyectiva", "warn"),
        `<div style="margin-top:12px">${pairsTable(domain.map(x=>[x, mapping.map[x]]), "x", "f(x)")}</div>`
    ].join(" ");
    out.innerHTML = html;

    // MATLAB script
    const matlab =
`% CLASIFICACIÓN DE UNA FUNCIÓN (discreta)
A = {${domain.map(x=>`'${x}'`).join(", ")}};
B = {${codomain.map(x=>`'${x}'`).join(", ")}};

% Pares (x -> y)
X = {${domain.map(x=>`'${x}'`).join(", ")}};
Y = {${domain.map(x=>`'${mapping.map[x]}'`).join(", ")}};

% Inyectiva: todas las imágenes distintas
isInjective = numel(unique(Y)) == numel(Y);

% Sobreyectiva: cubre todo el codominio
isSurjective = all(ismember(B, Y));

% Biyectiva
isBijective = isInjective && isSurjective;

disp(isInjective); disp(isSurjective); disp(isBijective);`;
    setMatlab("classMatlab","classMatlabWrap", matlab, true);
    const xpKey = `class|A:${domain.join(",")}|B:${codomain.join(",")}|M:${Object.entries(mapping.map).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([x,y])=>`${x}->${y}`).join(",")}`;
    try{ awardXp(60, "Clasificación", xpKey); }catch(e){}
}

// --------- INVERSA ----------
function invertFunction() {
    const domain = parseList(document.getElementById("invDomain")?.value);
    const codomain = parseList(document.getElementById("invCodomain")?.value);
    const mapping = parseMapping(document.getElementById("invMap")?.value);
    const query = (document.getElementById("invQuery")?.value || "").trim();
    const out = document.getElementById("invResult");
    if (!out) return;

    const errors = [];
    if (domain.length === 0) errors.push("⚠️ Dominio A vacío.");
    if (codomain.length === 0) errors.push("⚠️ Codominio B vacío.");
    errors.push(...mapping.errors);

    if (errors.length) {
        out.innerHTML = `<div class="alert-bad">${errors.map(e => `<div>${escapeHtml(e)}</div>`).join("")}</div>`;
        setMatlab("invMatlab","invMatlabWrap","% Corrige los datos para generar el script MATLAB.", false);
        return;
    }

    // Validar que todo x del dominio tenga imagen y en B
    const missingX = domain.filter(x => !Object.prototype.hasOwnProperty.call(mapping.map, x));
    const images = domain.filter(x=>Object.prototype.hasOwnProperty.call(mapping.map,x)).map(x => mapping.map[x]);
    const badY = images.filter(y => !codomain.includes(y));

    if (missingX.length || badY.length) {
        out.innerHTML = badge("NO es biyectiva → no hay inversa", "bad") +
            (missingX.length ? `<div class="alert-warn">Faltan mapeos para: ${escapeHtml(missingX.join(", "))}</div>` : "") +
            (badY.length ? `<div class="alert-bad">Hay salidas fuera de B: ${escapeHtml([...new Set(badY)].join(", "))}</div>` : "");
        setMatlab("invMatlab","invMatlabWrap","% No hay inversa: revisa dominio/codominio y el mapeo.", true);
        return;
    }

    const injective = (new Set(images)).size === images.length;
    const surjective = codomain.every(y => new Set(images).has(y));
    const bijective = injective && surjective;

    if (!bijective) {
        out.innerHTML = badge("Es función, pero NO biyectiva → no hay inversa", "warn");
        setMatlab("invMatlab","invMatlabWrap","% No hay inversa: se requiere biyectividad.", true);
        return;
    }

    const inv = {};
    domain.forEach(x => { inv[mapping.map[x]] = x; });
    const invPairs = Object.keys(inv).map(y => [y, inv[y]]);

    let queryHtml = "";
    if (query) {
        queryHtml = Object.prototype.hasOwnProperty.call(inv, query)
            ? `<div class="alert-ok">f⁻¹(${escapeHtml(query)}) = <b>${escapeHtml(inv[query])}</b></div>`
            : `<div class="alert-warn">No existe f⁻¹(${escapeHtml(query)}) con el mapeo actual.</div>`;
    }

    out.innerHTML = [
        badge("Biyectiva → inversa existe", "ok"),
        queryHtml,
        `<div style="margin-top:12px">${pairsTable(invPairs, "y", "f⁻¹(y)")}</div>`
    ].join("");

    const matlab =
`% INVERSA DE UNA FUNCIÓN BIYECTIVA (discreta)
A = {${domain.map(x=>`'${x}'`).join(", ")}};
B = {${codomain.map(x=>`'${x}'`).join(", ")}};

X = {${domain.map(x=>`'${x}'`).join(", ")}};
Y = {${domain.map(x=>`'${mapping.map[x]}'`).join(", ")}};

% Verificar biyectividad
isInjective = numel(unique(Y)) == numel(Y);
isSurjective = all(ismember(B, Y));
if ~(isInjective && isSurjective)
    error('No es biyectiva, no existe inversa.');
end

% Construir inversa (y -> x)
invMap = containers.Map(Y, X);

% Consultar ejemplo
yq = '${query || (codomain[0] || "")}';
if isKey(invMap, yq)
    disp(invMap(yq));
else
    disp('No existe f^{-1}(y) para ese valor.');
end`;
    setMatlab("invMatlab","invMatlabWrap", matlab, true);
    const xpKey = `inv|A:${domain.join(",")}|B:${codomain.join(",")}|M:${Object.entries(mapping.map).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([x,y])=>`${x}->${y}`).join(",")}`;
    try{ awardXp(60, "Inversa", xpKey); }catch(e){}
}

// --------- COMPUESTA ----------
function composeFunctions() {
    const A = parseList(document.getElementById("compDomain")?.value);
    const B = parseList(document.getElementById("compMid")?.value);
    const C = parseList(document.getElementById("compCodomain")?.value);
    const f = parseMapping(document.getElementById("compMapF")?.value);
    const g = parseMapping(document.getElementById("compMapG")?.value);
    const out = document.getElementById("compResult");
    if (!out) return;

    const errors = [];
    if (A.length === 0) errors.push("⚠️ A vacío.");
    if (B.length === 0) errors.push("⚠️ B vacío.");
    if (C.length === 0) errors.push("⚠️ C vacío.");
    errors.push(...f.errors.map(e=>"f: "+e), ...g.errors.map(e=>"g: "+e));

    if (errors.length) {
        out.innerHTML = `<div class="alert-bad">${errors.map(e => `<div>${escapeHtml(e)}</div>`).join("")}</div>`;
        setMatlab("compMatlab","compMatlabWrap","% Corrige los datos para generar el script MATLAB.", false);
        return;
    }

    // Validar f: A->B y g: B->C
    const missingF = A.filter(x => !Object.prototype.hasOwnProperty.call(f.map, x));
    const fOut = A.filter(x=>Object.prototype.hasOwnProperty.call(f.map,x)).map(x=>f.map[x]);
    const badF = fOut.filter(y => !B.includes(y));

    const gKeys = Object.keys(g.map);
    const badGIn = gKeys.filter(y => !B.includes(y));
    const gOut = gKeys.map(y=>g.map[y]);
    const badGOut = gOut.filter(z => !C.includes(z));

    if (missingF.length || badF.length || badGIn.length || badGOut.length) {
        out.innerHTML =
            badge("No se puede componer (datos inconsistentes)", "bad") +
            (missingF.length ? `<div class="alert-warn">f no está definida para: ${escapeHtml(missingF.join(", "))}</div>` : "") +
            (badF.length ? `<div class="alert-bad">f(x) fuera de B: ${escapeHtml([...new Set(badF)].join(", "))}</div>` : "") +
            (badGIn.length ? `<div class="alert-warn">g tiene entradas fuera de B: ${escapeHtml([...new Set(badGIn)].join(", "))}</div>` : "") +
            (badGOut.length ? `<div class="alert-bad">g(y) fuera de C: ${escapeHtml([...new Set(badGOut)].join(", "))}</div>` : "");
        setMatlab("compMatlab","compMatlabWrap","% Revisa que f: A->B y g: B->C.", true);
        return;
    }

    const compPairs = [];
    const stepsRows = [];
    for (const x of A) {
        const y = f.map[x];
        const z = g.map[y];
        compPairs.push([x, z]);
        stepsRows.push([x, y, z]);
    }

    const stepsTable = `<table class="mini-table"><thead><tr><th>x</th><th>f(x)</th><th>g(f(x))</th></tr></thead><tbody>${
        stepsRows.map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td>${escapeHtml(r[2])}</td></tr>`).join("")
    }</tbody></table>`;

    out.innerHTML = badge("Compuesta g∘f calculada", "ok") +
        `<div style="margin-top:12px">${stepsTable}</div>` +
        `<div style="margin-top:12px">${pairsTable(compPairs,"x","(g∘f)(x)")}</div>`;

    const matlab =
`% FUNCIÓN COMPUESTA h = g ∘ f
A = {${A.map(x=>`'${x}'`).join(", ")}};
B = {${B.map(x=>`'${x}'`).join(", ")}};
C = {${C.map(x=>`'${x}'`).join(", ")}};

% f: A->B
Xf = {${A.map(x=>`'${x}'`).join(", ")}};
Yf = {${A.map(x=>`'${f.map[x]}'`).join(", ")}};

% g: B->C  (definida en los valores que usa f)
Xg = {${B.map(x=>`'${x}'`).join(", ")}};
% Ajusta Yg según tu mapeo
% Ejemplo (rellena según tu entrada):
% Yg = {...};

% Para usar en MATLAB con maps:
fMap = containers.Map(Xf, Yf);

% gMap (ejemplo): define gMap con tus pares
% gMap = containers.Map(Xg, Yg);

% Calcular h(x) = g(f(x))
% h = cell(size(A));
% for i=1:numel(A)
%   y = fMap(A{i});
%   h{i} = gMap(y);
% end`;
    setMatlab("compMatlab","compMatlabWrap", matlab, true);
    const xpKey = `comp|A:${A.join(",")}|B:${B.join(",")}|C:${C.join(",")}|f:${Object.entries(f.map).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([x,y])=>`${x}->${y}`).join(",")}|g:${Object.entries(g.map).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([x,y])=>`${x}->${y}`).join(",")}`;
    try{ awardXp(70, "Composición", xpKey); }catch(e){}
}

// --------- DISCRETA ----------
function plotDiscrete() {
    let xs = parseList(document.getElementById("discX")?.value).map(Number);
    let ys = parseList(document.getElementById("discY")?.value).map(Number);
    const out = document.getElementById("discResult");
    const canvas = document.getElementById("discCanvas");

    if (!out) return;

    if (xs.length === 0 || ys.length === 0) {
        out.innerHTML = `<div class="alert-warn">⚠️ Ingresa listas X e Y.</div>`;
        return;
    }
    if (xs.length !== ys.length || xs.some(Number.isNaN) || ys.some(Number.isNaN)) {
        out.innerHTML = `<div class="alert-bad">❌ X e Y deben tener la misma cantidad de números (y ser numéricos).</div>`;
        return;
    }

    // opciones
    const plotType = document.getElementById("discPlotType")?.value || "stem";
    const useGrid = !!document.getElementById("discGrid")?.checked;
    const sortX = !!document.getElementById("discSortX")?.checked;

    if (sortX) {
        const zipped = xs.map((x,i)=>({x, y: ys[i]})).sort((a,b)=>a.x-b.x);
        xs = zipped.map(p=>p.x);
        ys = zipped.map(p=>p.y);
    }

    const pairs = xs.map((x,i)=>[String(x), String(ys[i])]);
    out.innerHTML = badge("Datos cargados", "ok") + `<div style="margin-top:12px">${pairsTable(pairs,"x","f(x)")}</div>`;

    if (canvas && canvas.getContext) {
        drawDiscretePlot(canvas, xs, ys, { plotType, useGrid });
        ensurePlotTooltip(canvas);
    }

    const matlab =
`% FUNCIÓN DISCRETA (gráfica)
x = [${xs.join(" ")}];
y = [${ys.join(" ")}];

% stem / plot / scatter
${plotType === "stem" ? "stem(x, y, 'filled');" : plotType === "line" ? "plot(x, y, '-o');" : "scatter(x, y, 'filled');"}
grid ${useGrid ? "on" : "off"};
xlabel('x'); ylabel('f(x)');
title('Función discreta');`;
    setMatlab("discMatlab","discMatlabWrap", matlab, true);
    const xpKey = `disc|x:${xs.join(",")}|y:${ys.join(",")}`;
    try{ awardXp(70, "Gráfica discreta", xpKey); }catch(e){}
}

function drawDiscretePlot(canvas, xs, ys, opts={}) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    const plotType = opts.plotType || "stem";
    const useGrid = !!opts.useGrid;

    // margins
    const mx = 48, my = 34;

    // ranges
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(0, ...ys), maxY = Math.max(...ys);

    const xScale = (w - 2*mx) / (maxX - minX || 1);
    const yScale = (h - 2*my) / (maxY - minY || 1);

    const xToPx = x => mx + (x - minX) * xScale;
    const yToPx = y => h - my - (y - minY) * yScale;

    // grid
    if (useGrid) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        const n = 6;
        for (let i=1;i<n;i++){
            const gx = mx + i*(w-2*mx)/n;
            const gy = my + i*(h-2*my)/n;
            ctx.beginPath(); ctx.moveTo(gx,my); ctx.lineTo(gx,h-my); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(mx,gy); ctx.lineTo(w-mx,gy); ctx.stroke();
        }
    }

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, h-my);
    ctx.lineTo(w-mx, h-my);
    ctx.stroke();

    // ticks labels (simple)
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px Exo 2, sans-serif";
    ctx.fillText(String(minX), mx, h-my+18);
    ctx.fillText(String(maxX), w-mx-18, h-my+18);
    ctx.fillText(String(maxY), 8, my+4);
    ctx.fillText(String(minY), 8, h-my);

    // points for tooltip
    const points = xs.map((x,i)=>({
        x, y: ys[i],
        px: xToPx(x),
        py: yToPx(ys[i]),
        p0: yToPx(0)
    }));
    canvas.__points = points;

    // draw
    ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
    ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
    ctx.lineWidth = 2;

    if (plotType === "line") {
        ctx.beginPath();
        points.forEach((p, i)=>{
            if(i===0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
        });
        ctx.stroke();
    }

    points.forEach((p)=>{
        if (plotType === "stem") {
            ctx.beginPath();
            ctx.moveTo(p.px, p.p0);
            ctx.lineTo(p.px, p.py);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(p.px, p.py, 4, 0, Math.PI*2);
        ctx.fill();
    });
}

// --------- RESEÑAS ----------
const REV_KEY = "mc_reviews_v1";

function loadReviews() {
    try {
        const raw = localStorage.getItem(REV_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch { return []; }
}

function saveReviews(arr) {
    try { localStorage.setItem(REV_KEY, JSON.stringify(arr)); } catch {}
}

function stars(n) {
    const k = Math.max(0, Math.min(5, Number(n)||0));
    return "★".repeat(k) + "☆".repeat(5-k);
}

function renderReviews() {
    const list = document.getElementById("reviewsList");
    const avgEl = document.getElementById("avgRating");
    if (!list) return;

    // promedio
    if (avgEl) {
        if (!arr.length) { avgEl.textContent = "—"; }
        else {
            const avg = arr.reduce((s,r)=>s + Number(r.rating||0), 0) / arr.length;
            avgEl.textContent = avg.toFixed(1) + " ★";
        }
    }
    const arr = loadReviews();
    if (arr.length === 0) {
        list.innerHTML = `<div class="review-card"><div class="review-text">Aún no hay reseñas.</div></div>`;
        return;
    }
    list.innerHTML = arr.slice().reverse().map(r => {
        const name = escapeHtml(r.name || "Anónimo");
        const text = escapeHtml(r.text || "");
        const date = escapeHtml(r.date || "");
        const rating = Number(r.rating)||0;
        return `<div class="review-card">
            <div class="review-top">
                <div>
                    <div class="review-name">${name}</div>
                    <div class="review-date">${date}</div>
                </div>
                <div class="review-stars">${stars(rating)}</div>
            </div>
            <div class="review-text">${text}</div>
        </div>`;
    }).join("");
}

function addReview() {
    const nameEl = document.getElementById("revName");
    const ratingEl = document.getElementById("revRating");
    const textEl = document.getElementById("revText");
    const msg = document.getElementById("revMsg");

    const name = (nameEl?.value || "").trim();
    const rating = Number(ratingEl?.value || 5);
    const text = (textEl?.value || "").trim();

    if (!text) {
        if (msg) msg.textContent = "Escribe una reseña.";
        return;
    }

    const arr = loadReviews();
    arr.push({
        name: name || "Anónimo",
        rating: Math.max(1, Math.min(5, rating)),
        text,
        date: new Date().toLocaleString()
    });
    saveReviews(arr);
    if (textEl) textEl.value = "";
    if (msg) msg.textContent = "Reseña guardada ✅";
    renderReviews();
}

function clearReviews() {
    try { localStorage.removeItem(REV_KEY); } catch {}
    const msg = document.getElementById("revMsg");
    if (msg) msg.textContent = "Reseñas eliminadas.";
    renderReviews();
}

// Inicialización segura

function toEmbedUrl(raw){
  const u = (raw||"").trim();
  if(!u) return "";
  if(u.includes("/embed/")) return u;

  // youtu.be/ID
  let m = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}`;

  // watch?v=ID
  m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}`;

  return u;
}

function initVideoSection() {
  // Always start blank (no default video)
  try{ localStorage.removeItem("mc_video_url"); }catch(e){}

  const input = document.getElementById("videoInput");
  const loadBtn = document.getElementById("videoLoadBtn");
  const clearBtn = document.getElementById("videoClearBtn");
  const wrap = document.getElementById("videoPreviewWrap");
  const ph = document.getElementById("videoPlaceholder");
  if(!input || !loadBtn || !wrap) return;

  const removeIframe = ()=>wrap.querySelectorAll("iframe").forEach(x=>x.remove());

  const showPlaceholder = ()=>{
    removeIframe();
    if(ph) ph.style.display = "flex";
  };

  const load = ()=>{
    const src = toEmbedUrl(input.value);
    if(!src){ showPlaceholder(); return; }

    removeIframe();
    const iframe = document.createElement("iframe");
    iframe.className = "video-iframe";
    iframe.src = src;
    iframe.title = "Video explicativo";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    if(ph) ph.style.display = "none";
    wrap.appendChild(iframe);
  };

  loadBtn.addEventListener("click", load);
  clearBtn?.addEventListener("click", ()=>{
    input.value = "";
    showPlaceholder();
  });

  input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){ e.preventDefault(); load(); }
  });

  // always start blank
  input.value = "";
  showPlaceholder();
}

window.__MC_APP_LOADED__ = true;


function ensurePlotTooltip(canvas) {
    if (canvas.__tooltipBound) return;
    canvas.__tooltipBound = true;
    const tip = document.getElementById("plotTip");
    if (!tip) return;

    canvas.addEventListener("mousemove", (e) => {
        const pts = canvas.__points || [];
        if (!pts.length) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        // nearest point
        let best = null, bestD = Infinity;
        for (const p of pts) {
            const d = (p.px - mx)*(p.px - mx) + (p.py - my)*(p.py - my);
            if (d < bestD) { bestD = d; best = p; }
        }
        if (best && bestD < 250) {
            tip.style.display = "block";
            tip.innerHTML = `x = <strong>${escapeHtml(best.x)}</strong><br>f(x) = <strong>${escapeHtml(best.y)}</strong>`;
            tip.style.left = (e.pageX + 12) + "px";
            tip.style.top = (e.pageY + 12) + "px";
        } else {
            tip.style.display = "none";
        }
    });
    canvas.addEventListener("mouseleave", () => {
        const tip = document.getElementById("plotTip");
        if (tip) tip.style.display = "none";
    });
}


function initStarPicker() {
    const picker = document.getElementById("starPicker");
    const sel = document.getElementById("revRating");
    if (!picker || !sel) return;

    function paint(v) {
        const stars = picker.querySelectorAll(".star");
        stars.forEach(btn=>{
            const n = Number(btn.dataset.v);
            btn.classList.toggle("on", n <= v);
        });
    }

    const v0 = Number(sel.value || 5);
    paint(v0);

    picker.addEventListener("click", (e)=>{
        const btn = e.target.closest(".star");
        if (!btn) return;
        const v = Number(btn.dataset.v);
        sel.value = String(v);
        paint(v);
        showToast("Rating: " + v + "/5", "info", 1200);
    });

    sel.addEventListener("change", ()=>paint(Number(sel.value||5)));
}


/* ==========================================================
   UI EXTRAS: progress bar + volver arriba (no rompe lógica)
   ========================================================== */
(function initUiExtras(){
    const bar = document.getElementById("scrollProgress");
    const topBtn = document.getElementById("toTopBtn");
    function onScroll(){
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
        const scrollHeight = (doc.scrollHeight || 0) - (doc.clientHeight || 0);
        const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
        if (topBtn) topBtn.style.display = scrollTop > 420 ? "flex" : "none";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (topBtn){
        topBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
})();


/* ==========================================================
   FIX: estabilidad de altura en móvil (evita saltos de tamaño)
   ========================================================== */
(function setAppHeight(){
    const root = document.documentElement;
    function apply(){
        // iOS/Android: innerHeight cambia con la barra del navegador al hacer scroll.
        // Congelamos altura real en px para mantener layout consistente.
        root.style.setProperty('--app-height', window.innerHeight + 'px');
    }
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
})();


/* ==========================================================
   MODO MISIÓN / PROGRESO (localStorage)
   ========================================================== */
const MISSIONS = [
  { id: "prod-cartesiano", label: "Producto cartesiano" },
  { id: "funciones", label: "Funciones" },
  { id: "ejercicios", label: "Ejemplos / Hojas" },
  { id: "clasificacion", label: "Clasificación" },
  { id: "inversa", label: "Función inversa" },
  { id: "compuesta", label: "Función compuesta" },
  { id: "discreta", label: "Función discreta" }
];

function loadMissions(){
  try{
    return JSON.parse(localStorage.getItem("mc_missions") || "{}") || {};
  }catch(e){ return {}; }
}
function saveMissions(state){
  localStorage.setItem("mc_missions", JSON.stringify(state || {}));
}
function getMissionState(){
  return loadMissions();
}
function setMissionDone(id, done=true){
  const st = loadMissions();
  st[id] = !!done;
  saveMissions(st);
  renderMissions();
  updateMiniMission(id);
}
function resetMissions(){
  localStorage.removeItem("mc_missions");
  renderMissions();
  // actualizar mini barras
  MISSIONS.forEach(m => updateMiniMission(m.id));
  if (typeof showToast === "function") showToast("Progreso reiniciado");
}

function computeMissionStats(){
  const st = loadMissions();
  const total = MISSIONS.length;
  const done = MISSIONS.filter(m => st[m.id]).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  return { total, done, pct };
}

function renderMissions(){
  const list = document.getElementById("missionList");
  const fill = document.getElementById("missionBarFill");
  const pctEl = document.getElementById("missionPct");
  const xpEl = document.getElementById("xpValue");

  if (!list) return;
  const st = loadMissions();
  list.innerHTML = "";

  MISSIONS.forEach((m, idx) => {
    
    
    if (["video","resenas"].includes(m.id)) return;
if (["video","resenas"].includes(m.id)) return;
const li = document.createElement("li");
    li.className = "mission-item" + (st[m.id] ? " done" : "");
    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `<i class="fas ${st[m.id] ? "fa-circle-check" : "fa-circle"}"></i>
                      <span class="label">${m.label}</span> <span class="mission-lv">LV ${idx+1}</span>`;
    const state = document.createElement("span");
    state.className = "state";
    state.textContent = st[m.id] ? "Completada" : "Pendiente";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = st[m.id] ? "Desmarcar" : "Completar";
    btn.addEventListener("click", () => setMissionDone(m.id, !st[m.id]));

    li.appendChild(left);
    li.appendChild(state);
    li.appendChild(btn);
    list.appendChild(li);
  });

  const stats = computeMissionStats();
  if (fill) fill.style.width = stats.pct + "%";
  if (pctEl) pctEl.textContent = stats.pct + "%";
  if (xpEl) xpEl.textContent = stats.done * 120; // XP simple (120 por misión)

  // feedback visual en gold-primary según progreso
}

function ensureMiniMissions(){
  // Inserta una mini barra al inicio de cada tab-content (solo una vez)
  const st = loadMissions();
  MISSIONS.forEach((m, idx) => {
    const tab = document.getElementById(m.id);
    if (!tab) return;
    if (tab.querySelector(".mission-mini")) return;

    const bar = document.createElement("div");
    bar.className = "mission-mini";
    bar.dataset.mission = m.id;
    bar.innerHTML = `
      <div class="mini-left">
        <i class="fas fa-bullseye"></i>
        <div class="mini-title">Misión: ${m.label}</div>
      </div>
      <button type="button" class="mini-btn ${st[m.id] ? "done" : ""}">
        ${st[m.id] ? "Completada ✓" : "Marcar completada"}
      </button>
    `;
    const btn = bar.querySelector("button");
    btn.addEventListener("click", () => {
      const now = !!loadMissions()[m.id];
      setMissionDone(m.id, !now);
      if (typeof showToast === "function") showToast(!now ? "Misión completada" : "Misión desmarcada");
    });

    tab.insertBefore(bar, tab.firstChild);
  });
}

function updateMiniMission(id){
  const st = loadMissions();
  const tab = document.getElementById(id);
  if (!tab) return;
  const mini = tab.querySelector(".mission-mini");
  if (!mini) return;
  const btn = mini.querySelector("button");
  if (!btn) return;
  const done = !!st[id];
  btn.classList.toggle("done", done);
  btn.textContent = done ? "Completada ✓" : "Marcar completada";
}


function toEmbedUrl(raw){
  const u = (raw||"").trim();
  if(!u) return "";
  if(u.includes("/embed/")) return u;

  // youtu.be/ID
  let m = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}`;

  // watch?v=ID
  m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}`;

  return u;
}

function initVideoSection(){
  const input = document.getElementById("videoInput");
  const loadBtn = document.getElementById("videoLoadBtn");
  const clearBtn = document.getElementById("videoClearBtn");
  const wrap = document.getElementById("videoPreviewWrap");
  const ph = document.getElementById("videoPlaceholder");
  if(!input || !loadBtn || !wrap) return;

  const removeIframe = ()=>wrap.querySelectorAll("iframe").forEach(x=>x.remove());

  const showPlaceholder = ()=>{
    removeIframe();
    if(ph) ph.style.display = "flex";
  };

  const load = ()=>{
    const src = toEmbedUrl(input.value);
    if(!src){ showPlaceholder(); return; }

    removeIframe();
    const iframe = document.createElement("iframe");
    iframe.className = "video-iframe";
    iframe.src = src;
    iframe.title = "Video explicativo";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    if(ph) ph.style.display = "none";
    wrap.appendChild(iframe);
  };

  loadBtn.addEventListener("click", load);
  clearBtn?.addEventListener("click", ()=>{
    input.value = "";
    showPlaceholder();
  });

  input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){ e.preventDefault(); load(); }
  });

  // always start blank
  input.value = "";
  showPlaceholder();
}





/* ==========================================================
   SIDEBAR DRAWER CONTROLS
   ========================================================== */
(function initSidebarDrawer(){
    const btn = document.getElementById("sidebarToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    function close(){
        document.body.classList.remove("sidebar-open");
    }
    function toggle(){
        document.body.classList.toggle("sidebar-open");
    }
    if (btn) btn.addEventListener("click", toggle);
    if (backdrop) backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
    });
    // cerrar drawer al tocar un link
    document.addEventListener("click", (e) => {
        const a = e.target && e.target.closest ? e.target.closest(".tab-link") : null;
        if (a && window.matchMedia && window.matchMedia("(max-width: 1200px)").matches){
            close();
        }
    });
})();


/* ==========================================================
   MODO JUEGO: XP + LOGROS (simple, localStorage)
   ========================================================== */
const ACHIEVEMENTS = [
  { id: "xp_300", xp: 300, title: "Aprendiz Lógico", desc: "Alcanza 300 XP" },
  { id: "xp_700", xp: 700, title: "Explorador de Funciones", desc: "Alcanza 700 XP" },
  { id: "xp_1200", xp: 1200, title: "Maestro del Dominio", desc: "Alcanza 1200 XP" }
];

function loadXp(){
  return parseInt(localStorage.getItem("mc_xp") || "0", 10) || 0;
}
function saveXp(v){
  localStorage.setItem("mc_xp", String(v));
  const xpEl = document.getElementById("xpValue");
  if (xpEl) xpEl.textContent = v;
  try{ updateLevelHud(v); }catch(e){}
  try{ updateProfilePanel(); }catch(e){}
}
function loadAch(){
  try{ return JSON.parse(localStorage.getItem("mc_ach") || "{}") || {}; }catch(e){ return {}; }
}
function saveAch(st){ localStorage.setItem("mc_ach", JSON.stringify(st||{})); }

const XP_KEYS_STORE = "mc_xp_keys";

// Guarda qué retos/acciones ya dieron XP (anti-farmeo)
function loadXpKeys(){
  try{ return JSON.parse(localStorage.getItem(XP_KEYS_STORE) || "{}") || {}; }catch(e){ return {}; }
}
function saveXpKeys(st){
  try{
    // Evita crecimiento infinito: conserva los más recientes
    const entries = Object.entries(st || {});
    if (entries.length > 1500){
      entries.sort((a,b)=> (a[1]||0) - (b[1]||0)); // más antiguos primero
      const trimmed = entries.slice(entries.length-1500);
      st = Object.fromEntries(trimmed);
    }
    localStorage.setItem(XP_KEYS_STORE, JSON.stringify(st||{}));
  }catch(e){}
}
function hashKey(s){
  // hash simple (rápido y estable)
  s = String(s ?? "");
  let h = 2166136261;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

/**
 * Suma XP SOLO si (a) amount>0 y (b) no se ha otorgado antes por la misma acción/entrada.
 * @returns {boolean} true si se otorgó XP, false si no (ya completado o inválido).
 */
function awardXp(amount, reason, key){
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount <= 0) return false;

  if (key){
    const st = loadXpKeys();
    const hk = hashKey(key);
    if (st[hk]){
      if (typeof showToast === "function") showToast(`✔ ${reason || "Completado"} · 0 XP (ya obtenido)`, "info");
      return false;
    }
    st[hk] = Date.now();
    saveXpKeys(st);
  }

  const xp = loadXp() + amount;
  saveXp(xp);
  if (typeof showToast === "function") showToast(`+${amount} XP${reason ? " · " + reason : ""}`);
  checkAchievements(xp);
  return true;
}

function checkAchievements(xp){
  const st = loadAch();
  let unlocked = 0;
  ACHIEVEMENTS.forEach(a => {
    if (!st[a.id] && xp >= a.xp){
      st[a.id] = true;
      unlocked++;
      if (typeof showAchievementPopup === "function") showAchievementPopup(a.title, a.desc);
      else if (typeof showToast === "function") showToast(`Logro desbloqueado: ${a.title}`);
    }
  });
  if (unlocked) saveAch(st);
}

// Inicializar XP badge al cargar

function toEmbedUrl(raw){
  const u = (raw||"").trim();
  if(!u) return "";
  if(u.includes("/embed/")) return u;

  // youtu.be/ID
  let m = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}`;

  // watch?v=ID
  m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}`;

  return u;
}

function initVideoSection(){
  const input = document.getElementById("videoInput");
  const loadBtn = document.getElementById("videoLoadBtn");
  const clearBtn = document.getElementById("videoClearBtn");
  const wrap = document.getElementById("videoPreviewWrap");
  const ph = document.getElementById("videoPlaceholder");
  if(!input || !loadBtn || !wrap) return;

  const removeIframe = ()=>wrap.querySelectorAll("iframe").forEach(x=>x.remove());

  const showPlaceholder = ()=>{
    removeIframe();
    if(ph) ph.style.display = "flex";
  };

  const load = ()=>{
    const src = toEmbedUrl(input.value);
    if(!src){ showPlaceholder(); return; }

    removeIframe();
    const iframe = document.createElement("iframe");
    iframe.className = "video-iframe";
    iframe.src = src;
    iframe.title = "Video explicativo";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    if(ph) ph.style.display = "none";
    wrap.appendChild(iframe);
  };

  loadBtn.addEventListener("click", load);
  clearBtn?.addEventListener("click", ()=>{
    input.value = "";
    showPlaceholder();
  });

  input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){ e.preventDefault(); load(); }
  });

  // always start blank
  input.value = "";
  showPlaceholder();
}





/* ==========================================================
   LEVEL HUD (LV + barra de XP)
   ========================================================== */
function updateLevelHud(xp){
  const levelSize = 500; // XP por nivel
  const level = Math.floor((xp || 0) / levelSize) + 1;
  const inLevel = (xp || 0) % levelSize;
  const pct = Math.round((inLevel / levelSize) * 100);

  const lvlEl = document.getElementById("levelValue");
  const barEl = document.getElementById("xpBar");
  if (lvlEl) lvlEl.textContent = level;
  if (barEl) barEl.style.width = pct + "%";
}


/* ==========================================================
   FX: glow que sigue el cursor (ligero)
   ========================================================== */
(function initCursorGlow(){
  const root = document.documentElement;
  function setPos(x,y){
    root.style.setProperty('--mx', x + 'px');
    root.style.setProperty('--my', y + 'px');
  }
  window.addEventListener('mousemove', (e)=>{ setPos(e.clientX, e.clientY); }, { passive:true });
  window.addEventListener('touchmove', (e)=>{
    const t = e.touches && e.touches[0];
    if (t) setPos(t.clientX, t.clientY);
  }, { passive:true });
  setPos(window.innerWidth * 0.5, window.innerHeight * 0.25);
})();


function cleanupNonGameTabs(){
  ["video","resenas"].forEach(id=>{
    const tab = document.getElementById(id);
    if(!tab) return;
    const mini = tab.querySelector(".mission-mini");
    if(mini) mini.remove();
  });
}
document.addEventListener("DOMContentLoaded", cleanupNonGameTabs);


/* =========================
   FIX: pestaña por defecto (siempre visible)
   ========================= */
(function initDefaultTab_final(){
  function run(){
    try{
      const activeTab = document.querySelector(".tab-content.active") || document.getElementById("inicio") || document.querySelector(".tab-content");
      const id = activeTab && activeTab.id ? activeTab.id : "inicio";
      // Mostrar siempre la pestaña inicial con openTab para sincronizar estilos/colores
      if (typeof openTab === "function"){
        openTab(null, id);
      } else if (activeTab){
        activeTab.style.display = "block";
      }
    }catch(e){
      const t = document.getElementById("inicio");
      if (t){ t.style.display="block"; }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();

function activateLinkForTab(tabName){
  const links = document.querySelectorAll('.tab-link');
  links.forEach(a=>{
    if ((a.getAttribute("onclick")||"").includes("'" + tabName + "'")){
      a.classList.add("active");
      const newColor = sectionColors[tabName] || '#FFD700';
      a.style.borderColor = newColor;
      a.style.color = newColor;
    }
  });
}


/* =========================
   UX: títulos por pestaña
   ========================= */
const TAB_TITLES = {
  "inicio": "Inicio",
  "prod-cartesiano": "Producto Cartesiano",
  "funciones": "Funciones",
  "ejercicios": "Ejemplos / Hojas",
  "clasificacion": "Clasificación",
  "inversa": "Función Inversa",
  "compuesta": "Función Compuesta",
  "discreta": "Función Discreta",
  "video": "Video Explicativo",
  "resenas": "Reseñas"
};
function setCurrentSection(tabName){
  const pill = document.getElementById("currentSection");
  if (!pill) return;
  pill.textContent = TAB_TITLES[tabName] || tabName;
}


/* =========================
   Sidebar: buscador de secciones
   ========================= */


/* =========================
   Persistencia: última pestaña
   ========================= */
(function initLastTab(){
  function run(){
    let last = null;
    try{ last = localStorage.getItem("mc_last_tab"); }catch(e){}
    if (!last) last = "inicio";
    // Si el tab existe, ábrelo
    const tab = document.getElementById(last);
    if (tab && typeof openTab === "function"){
      openTab(null, last);
    } else if (typeof openTab === "function"){
      openTab(null, "inicio");
    }
    try{ setCurrentSection(last); }catch(e){}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();


/* ==========================================================
   STREAK SYSTEM + Sound + Achievement UI
   ========================================================== */
function todayStr(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function ydayStr(){
  const d = new Date();
  d.setDate(d.getDate()-1);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function loadStreak(){
  try{ return JSON.parse(localStorage.getItem("mc_streak") || "{}") || {}; }catch(e){ return {}; }
}
function saveStreak(st){ localStorage.setItem("mc_streak", JSON.stringify(st||{})); }
function updateStreak(){
  const st = loadStreak();
  const t = todayStr();
  const y = ydayStr();
  if (!st.last){
    st.last = t; st.count = 1;
  } else if (st.last === t){
    // nada
  } else if (st.last === y){
    st.last = t; st.count = (st.count||0) + 1;
  } else {
    st.last = t; st.count = 1;
  }
  saveStreak(st);
  const el = document.getElementById("streakValue");
  if (el) el.textContent = st.count || 1;
  return st.count || 1;
}

function loadSound(){
  try{ return localStorage.getItem("mc_sound") === "on"; }catch(e){ return false; }
}
function saveSound(on){
  try{ localStorage.setItem("mc_sound", on ? "on" : "off"); }catch(e){}
}
function setSoundBtn(on){
  const btn = document.getElementById("soundBtn");
  if (!btn) return;
  btn.title = "Sonido: " + (on ? "on" : "off");
  btn.innerHTML = on ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-mute"></i>';
}
function playDing(){
  if (!loadSound()) return;
  // beep simple con WebAudio (ligero)
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.stop(ctx.currentTime + 0.20);
    setTimeout(()=>ctx.close(), 250);
  }catch(e){}
}


function burstConfetti(){
  const root = document.body;
  const wrap = document.createElement("div");
  wrap.className = "confetti-wrap";
  const n = 26;
  for (let i=0;i<n;i++){
    const p = document.createElement("span");
    p.className = "confetti";
    p.style.left = Math.round(Math.random()*100) + "vw";
    p.style.animationDelay = (Math.random()*0.25) + "s";
    p.style.opacity = (0.7 + Math.random()*0.3).toFixed(2);
    wrap.appendChild(p);
  }
  root.appendChild(wrap);
  setTimeout(()=>{ try{ wrap.remove(); }catch(e){} }, 1300);
  try{ if (loadSound && loadSound()) playDing(); }catch(e){}
}
function showAchievementPopup(title, desc){
  const box = document.getElementById("achPopup");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "ach-pop";
  el.innerHTML = `<div class="row">
      <span class="badge"><i class="fas fa-trophy"></i> Logro</span>
      <div>
        <div class="name">${title}</div>
        <div class="desc">${desc || ""}</div>
      </div>
    </div>`;
  box.appendChild(el);
  playDing();
  setTimeout(()=>{ try{ el.remove(); }catch(e){} }, 3200);
}

function renderAchievements(){
  const grid = document.getElementById("achGrid");
  if (!grid) return;
  const st = loadAch();
  const xp = loadXp();
  grid.innerHTML = "";
  ACHIEVEMENTS.forEach(a=>{
    const unlocked = !!st[a.id] || xp >= a.xp;
    const item = document.createElement("div");
    item.className = "ach-item " + (unlocked ? "unlocked" : "locked");
    item.innerHTML = `
      <div class="left">
        <div class="icon"><i class="fas ${unlocked ? "fa-trophy" : "fa-lock"}"></i></div>
        <div class="meta">
          <div class="title">${a.title}</div>
          <div class="desc">${a.desc}</div>
        </div>
      </div>
      <div class="badge">${unlocked ? "Desbloqueado" : (a.xp + " XP")}</div>
    `;
    grid.appendChild(item);
  });
}

function openAchModal(){
  const modal = document.getElementById("achModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  renderAchievements();
}
function closeAchModal(){
  const modal = document.getElementById("achModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}
(function initAchModal(){
  function run(){
    const btn = document.getElementById("achBtn");
    if (btn) btn.addEventListener("click", openAchModal);
    const modal = document.getElementById("achModal");
    if (!modal) return;
    modal.addEventListener("click", (e)=>{
      const t = e.target;
      if (t && t.dataset && t.dataset.close) closeAchModal();
    });
    document.addEventListener("keydown",(e)=>{
      if (e.key === "Escape") closeAchModal();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
(function initSoundToggle(){
  function run(){
    const btn = document.getElementById("soundBtn");
    if (!btn) return;
    let on = loadSound();
    setSoundBtn(on);
    btn.addEventListener("click", ()=>{
      on = !on;
      saveSound(on);
      setSoundBtn(on);
      if (typeof showToast === "function") showToast("Sonido: " + (on ? "on" : "off"));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
document.addEventListener("DOMContentLoaded", updateStreak);


/* ==========================================================
   PARTICLE SYSTEM (ligero)
   ========================================================== */
(function initParticles(){
  function run(){
    const canvas = document.getElementById("particlesCanvas");
    if (!canvas) return;

    // respeta reduce-motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let w=0,h=0,raf=0;
    const count = Math.min(70, Math.floor((window.innerWidth*window.innerHeight)/22000));
    const parts = [];

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function rnd(a,b){ return a + Math.random()*(b-a); }
    function make(){
      return {
        x: rnd(0,w), y:rnd(0,h),
        vx: rnd(-0.25,0.25), vy:rnd(-0.18,0.18),
        r: rnd(1.0,2.4),
        a: rnd(0.08,0.22)
      };
    }
    function reset(){
      parts.length=0;
      for (let i=0;i<count;i++) parts.push(make());
    }

    function step(){
      ctx.clearRect(0,0,w,h);
      // dots
      for (const p of parts){
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w+20;
        if (p.x > w+20) p.x = -20;
        if (p.y < -20) p.y = h+20;
        if (p.y > h+20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,215,0,${p.a})`;
        ctx.fill();
      }
      // links
      for (let i=0;i<parts.length;i++){
        for (let j=i+1;j<parts.length;j++){
          const a=parts[i], b=parts[j];
          const dx=a.x-b.x, dy=a.y-b.y;
          const d2=dx*dx+dy*dy;
          if (d2 < 140*140){
            const alpha = 0.10 * (1 - d2/(140*140));
            ctx.strokeStyle = `rgba(0,255,200,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x,a.y);
            ctx.lineTo(b.x,b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    resize(); reset(); step();
    window.addEventListener("resize", ()=>{ resize(); reset(); }, { passive:true });

    // pausa si no visible
    document.addEventListener("visibilitychange", ()=>{
      if (document.hidden){
        cancelAnimationFrame(raf);
      }else{
        step();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();


/* ==========================================================
   PRACTICE MODE: generator + checker + export
   ========================================================== */
function loadPractice(){
  try{ return JSON.parse(localStorage.getItem("mc_practice") || "[]") || []; }catch(e){ return []; }
}
function savePractice(arr){
  localStorage.setItem("mc_practice", JSON.stringify(arr||[]));
}
function renderPracticeHistory(){
  const box = document.getElementById("practiceHistory");
  if (!box) return;
  const arr = loadPractice();
  if (!arr.length){
    box.innerHTML = '<div class="soft">Aún no hay intentos.</div>';
    return;
  }
  box.innerHTML = "";
  arr.slice().reverse().slice(0,30).forEach(item=>{
    const div = document.createElement("div");
    div.className = "hist-item " + (item.correct ? "ok" : "bad");
    div.innerHTML = `<div class="q">${item.topicLabel}: ${item.prompt}</div>
      <div class="tag">${item.correct ? "✔" : "✘"} ${item.userAnswer}</div>`;
    box.appendChild(div);
  });
}

function downloadText(filename, text){
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 50);
}

let currentPractice = null;

function normAnswer(s){
  return (s||"").trim().toLowerCase().replace(/\s+/g,"");
}

function genPractice(topic){
  // Returns {prompt, answer, hint, topicLabel}
  function rint(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  const mapLabel = {
    cartesiano: "Producto cartesiano",
    composicion: "Función compuesta",
    inversa: "Función inversa",
    funcion: "¿Es función?",
    discreta: "Función discreta"
  };
  const topicLabel = mapLabel[topic] || topic;

  if (topic === "cartesiano"){
    const a = rint(2,7), b=rint(2,7);
    return {
      topicLabel,
      prompt: `Si |A|=${a} y |B|=${b}, ¿cuántos pares tiene A×B?`,
      answer: String(a*b),
      hint: `Recuerda: |A×B| = |A|·|B| = ${a}·${b}.`
    };
  }

  if (topic === "composicion"){
    const a=rint(1,5), b=rint(-6,6);
    const c=rint(1,5), d=rint(-6,6);
    const k=rint(-3,3);
    // f(x)=ax+b, g(x)=cx+d
    const gx = c*k + d;
    const fog = a*gx + b;
    return {
      topicLabel,
      prompt: `Sea f(x)=${a}x${b>=0?"+":""}${b} y g(x)=${c}x${d>=0?"+":""}${d}. Calcula (f∘g)(${k}).`,
      answer: String(fog),
      hint: `Primero g(${k})=${gx}, luego f(g(${k}))=${a}·${gx}${b>=0?"+":""}${b}.`
    };
  }

  if (topic === "inversa"){
    const a=rint(1,6);
    const b=rint(-6,6);
    const y=rint(-5,5);
    // f(x)=ax+b. Inverse: x=(y-b)/a
    const x = (y - b)/a;
    // if not integer, keep fraction
    const ans = Number.isInteger(x) ? String(x) : `${y - b}/${a}`;
    return {
      topicLabel,
      prompt: `Sea f(x)=${a}x${b>=0?"+":""}${b}. Calcula f^{-1}(${y}).`,
      answer: ans,
      hint: `Resuelve y = ${a}x${b>=0?"+":""}${b} ⇒ x = (y - ${b})/${a}.`
    };
  }

  if (topic === "discreta"){
    const n = rint(4,7);
    const vals = Array.from({length:n}, ()=>rint(-3,9));
    const idx = rint(1,n);
    return {
      topicLabel,
      prompt: `Si f(1..${n}) = [${vals.join(", ")}], ¿cuál es f(${idx})?`,
      answer: String(vals[idx-1]),
      hint: `Es el valor en la posición ${idx} de la lista.`
    };
  }

  // ¿Es función? con pares (x,y)
  const A = [1,2,3,4];
  const pairs = [];
  const dup = Math.random() < 0.45; // a veces no es función
  const usedX = {};
  for (const x of A){
    const y1 = rint(1,5);
    pairs.push([x,y1]);
    usedX[x] = y1;
  }
  if (dup){
    const x = rint(1,4);
    let y2 = usedX[x];
    while (y2 === usedX[x]) y2 = rint(1,5);
    pairs.push([x,y2]); // viola unicidad
  }
  const isFunc = !dup;
  return {
    topicLabel,
    prompt: `Relación R = { ${pairs.map(p=>`(${p[0]},${p[1]})`).join(", ")} }. ¿Es función? Responde "si" o "no".`,
    answer: isFunc ? "si" : "no",
    hint: `Es función si cada x tiene UNA sola salida. Busca x repetida con distinto y.`
  };
}

(function initPractice(){
  function run(){
    const topicSel = document.getElementById("practiceTopic");
    const genBtn = document.getElementById("genPracticeBtn");
    const chkBtn = document.getElementById("checkPracticeBtn");
    const hintBtn = document.getElementById("hintPracticeBtn");
    const ansIn = document.getElementById("practiceAnswer");
    const qBox = document.getElementById("practiceQuestion");
    const fb = document.getElementById("practiceFeedback");
    const csvBtn = document.getElementById("exportCsvBtn");
    const jsonBtn = document.getElementById("exportJsonBtn");
    const clearBtn = document.getElementById("clearPracticeBtn");

    if (!topicSel || !genBtn || !chkBtn || !ansIn || !qBox || !fb) return;

    renderPracticeHistory();

    function setFeedback(text, ok=null){
      fb.textContent = text || "";
      fb.classList.remove("ok","bad");
      if (ok === true) fb.classList.add("ok");
      if (ok === false) fb.classList.add("bad");
    }

    function generate(){
      const t = topicSel.value;
      currentPractice = genPractice(t);
      qBox.innerHTML = currentPractice.prompt;
      ansIn.value = "";
      ansIn.focus();
      setFeedback("Escribe tu respuesta y presiona Verificar.", null);
    }

    function check(){
      if (!currentPractice){
        setFeedback("Primero genera un ejercicio.", false);
        return;
      }
      const ua = ansIn.value.trim();
      if (!ua){
        setFeedback("Escribe una respuesta.", false);
        return;
      }
      const ok = normAnswer(ua) === normAnswer(currentPractice.answer);
      const arr = loadPractice();
      arr.push({
        ts: new Date().toISOString(),
        topicLabel: currentPractice.topicLabel,
        prompt: currentPractice.prompt,
        userAnswer: ua,
        correct: ok,
        correctAnswer: currentPractice.answer
      });
      savePractice(arr);
      renderPracticeHistory();

      if (ok){
        const xpKey = `prac2|${currentPractice.topicLabel}|${currentPractice.prompt}|${currentPractice.answer}`;
        let awarded = false;
        if (typeof awardXp === "function") awarded = awardXp(50, "Práctica", xpKey);
        setFeedback(awarded ? "Correcto ✅  +50 XP" : "Correcto ✅  (ya completado)", true);
        // XP solo en modo práctica/cálculo (no video/reseñas)
}else{
        setFeedback(`Incorrecto ❌  Respuesta: ${currentPractice.answer}`, false);
      }
    }

    function hint(){
      if (!currentPractice){
        setFeedback("Primero genera un ejercicio.", false);
        return;
      }
      setFeedback("Pista: " + currentPractice.hint, null);
    }

    genBtn.addEventListener("click", generate);
    chkBtn.addEventListener("click", check);
    hintBtn.addEventListener("click", hint);

    ansIn.addEventListener("keydown",(e)=>{
      if (e.key === "Enter") check();
    });

    if (csvBtn){
      csvBtn.addEventListener("click", ()=>{
        const arr = loadPractice();
        const header = ["timestamp","tema","pregunta","respuesta_usuario","correcto","respuesta_correcta"];
        const rows = arr.map(it=>[
          it.ts, it.topicLabel, it.prompt.replaceAll("\n"," "),
          it.userAnswer, it.correct ? "1" : "0", it.correctAnswer
        ].map(v=>`"${String(v).replaceAll('"','""')}"`).join(","));
        downloadText("mc_practice.csv", header.join(",") + "\n" + rows.join("\n"));
      });
    }
    if (jsonBtn){
      jsonBtn.addEventListener("click", ()=>{
        const arr = loadPractice();
        downloadText("mc_practice.json", JSON.stringify(arr, null, 2));
      });
    }
    if (clearBtn){
      clearBtn.addEventListener("click", ()=>{
        savePractice([]);
        renderPracticeHistory();
        setFeedback("Historial borrado.", null);
        if (typeof showToast === "function") showToast("Historial de práctica borrado");
      });
    }

    // autogenera una al entrar por primera vez
    if (!currentPractice) generate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();


/* ==========================================================
   FINAL POLISH: Tema + Pantalla completa (sin romper nada)
   ========================================================== */
(function initThemeAndFullscreen(){
  function ready(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(function(){
    // Theme toggle
    const themeBtn = document.getElementById("themeBtn");
    const THEME_KEY = "mc_theme";
    function applyTheme(t){
      document.body.classList.toggle("theme-cyber", t === "cyber");
      if (themeBtn){
        themeBtn.title = (t === "cyber") ? "Tema: Cyber" : "Tema: Dorado";
        themeBtn.innerHTML = (t === "cyber") ? '<i class="fas fa-wand-magic-sparkles"></i>' : '<i class="fas fa-palette"></i>';
      }
    }
    if (themeBtn){
      let theme = "gold";
      try{ theme = localStorage.getItem(THEME_KEY) || "gold"; }catch(e){}
      applyTheme(theme);
      themeBtn.addEventListener("click", function(){
        theme = (theme === "cyber") ? "gold" : "cyber";
        try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
        applyTheme(theme);
        try{ showToast(theme === "cyber" ? "Tema activado: Cyber" : "Tema activado: Dorado"); }catch(e){}
      });
    }

    // Fullscreen toggle (solo si el navegador lo permite)
    const fsBtn = document.getElementById("fsBtn");
    function isFS(){ return !!document.fullscreenElement; }
    function updateFSIcon(){
      if (!fsBtn) return;
      fsBtn.title = isFS() ? "Salir de pantalla completa" : "Pantalla completa";
      fsBtn.innerHTML = isFS() ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
    }
    if (fsBtn && document.documentElement.requestFullscreen){
      updateFSIcon();
      fsBtn.addEventListener("click", async function(){
        try{
          if (!isFS()) await document.documentElement.requestFullscreen();
          else await document.exitFullscreen();
        }catch(e){}
        updateFSIcon();
      });
      document.addEventListener("fullscreenchange", updateFSIcon);
    }else if (fsBtn){
      fsBtn.style.display = "none";
    }
  });
})();
