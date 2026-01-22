document.addEventListener('DOMContentLoaded', (event) => {
    hljs.highlightAll();
});

// MAPA DE COLORES NEÓN POR SECCIÓN
const sectionColors = {
    'inicio': '#FFD700',          // Dorado (Default)
    'prod-cartesiano': '#00FF00', // Verde Matrix
    'funciones': '#FFFF00',       // Amarillo Cyberpunk
    'ejercicios': '#00FFFF',      // Cian Neón
    'clasificacion': '#BC13FE',   // Púrpura
    'inversa': '#FF0055',         // Rojo Neón
    'compuesta': '#FF00FF',       // Magenta
    'discreta': '#FF5500',        // Naranja Fuego
    'video': '#FFFFFF',           // Blanco Glitch
    'resenas': '#00FF9C'          // Menta
};

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        tablinks[i].style.borderColor = "transparent"; // Resetear borde
    }

    var currentTab = document.getElementById(tabName);
    if (currentTab) {
        currentTab.style.display = "block";
        
        // CAMBIO DE COLOR DINÁMICO
        var newColor = sectionColors[tabName] || '#FFD700';
        document.documentElement.style.setProperty('--gold-primary', newColor);
    }

    if (evt) {
        evt.currentTarget.className += " active";
        evt.currentTarget.style.borderColor = newColor; // Borde activo del color actual
    }
}

// Calculadoras (Sin cambios en lógica)
function calcCartesian() {
    const rawA = document.getElementById('setA').value;
    const rawB = document.getElementById('setB').value;
    const resDiv = document.getElementById('resCartesiano');
    if (!rawA || !rawB) { resDiv.innerHTML = "⚠️ DATOS INCOMPLETOS"; return; }
    
    const A = rawA.split(',').map(s => s.trim());
    const B = rawB.split(',').map(s => s.trim());
    let pairs = [];
    A.forEach(a => { B.forEach(b => { pairs.push(`(${a},${b})`); }); });
    resDiv.innerHTML = `<strong>PARES:</strong> { ${pairs.join(', ')} }`;
}

function calcFactorial() {
    const n = parseInt(document.getElementById('numFactorial').value);
    const resDiv = document.getElementById('resFactorial');
    if (isNaN(n) || n < 0) { resDiv.innerHTML = "⚠️ ERROR NUMÉRICO"; return; }
    let result = 1; for (let i = 1; i <= n; i++) result *= i;
    resDiv.innerHTML = `<strong>${n}! =</strong> ${result}`;
}

function calcComposition() {
    const x = parseFloat(document.getElementById('compInput').value);
    const resDiv = document.getElementById('resComposicion');
    if (isNaN(x)) { resDiv.innerHTML = "⚠️ ERROR ENTRADA"; return; }
    const gx = x + 1; const fgx = gx * gx;
    resDiv.innerHTML = `g(${x}) = ${gx} <br> f(${gx}) = ${fgx}`;
}