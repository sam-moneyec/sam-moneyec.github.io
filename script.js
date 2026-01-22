// ACTIVAR COLOREADO DE CÓDIGO
document.addEventListener('DOMContentLoaded', (event) => {
    hljs.highlightAll();
});

// --- DICCIONARIO DE COLORES NEÓN VIBRANTES ---
const sectionColors = {
    'inicio': '#FFD700',          // Dorado (Original)
    'prod-cartesiano': '#00FF00', // Verde Matrix
    'funciones': '#FFFF00',       // Amarillo Cyberpunk
    'ejercicios': '#00FFFF',      // Turquesa Neón
    'clasificacion': '#BC13FE',   // Púrpura Eléctrico
    'inversa': '#FF0055',         // Rojo Neón Intenso
    'compuesta': '#FF00FF',       // Magenta Láser
    'discreta': '#FF5500',        // Naranja Fuego
    'video': '#0088FF',           // Azul Eléctrico (Nuevo)
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
        tablinks[i].style.color = "#e0e0e0"; // Reset color texto a gris
    }

    // Mostrar pestaña actual
    var currentTab = document.getElementById(tabName);
    if (currentTab) {
        currentTab.style.display = "block";
        
        // --- CAMBIO DE COLOR DINÁMICO ---
        var newColor = sectionColors[tabName] || '#FFD700';
        
        // Inyectamos el nuevo color en las variables CSS
        // Al cambiar --gold-primary, TODOS los títulos, bordes y fórmulas cambiarán
        document.documentElement.style.setProperty('--gold-primary', newColor);
    }

    // Activar botón con el nuevo color
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

    // Usamos el color actual para el resultado
    resDiv.style.color = "var(--gold-primary)";
    resDiv.innerHTML = `<strong>PARES GENERADOS:</strong><br>{ ${pairs.join(', ')} }`;
}

function calcFactorial() {
    const n = parseInt(document.getElementById('numFactorial').value);
    const resDiv = document.getElementById('resFactorial');
    if (isNaN(n) || n < 0) { resDiv.innerHTML = "⚠️ ERROR"; return; }
    let result = 1; for (let i = 1; i <= n; i++) result *= i;
    resDiv.innerHTML = `RESULTADO: ${n}! = ${result}`;
}

function calcComposition() {
    const x = parseFloat(document.getElementById('compInput').value);
    const resDiv = document.getElementById('resComposicion');
    if (isNaN(x)) { resDiv.innerHTML = "⚠️ ERROR"; return; }
    const gx = x + 1; const fgx = gx * gx;
    resDiv.innerHTML = `g(${x}) = ${gx} <br> f(${gx}) = ${fgx}`;
}