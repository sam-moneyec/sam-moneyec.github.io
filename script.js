// ACTIVAR COLOREADO DE CÓDIGO
document.addEventListener('DOMContentLoaded', (event) => {
    hljs.highlightAll();
});

// --- DICCIONARIO DE COLORES NEÓN VIBRANTES ---
const sectionColors = {
    'inicio': '#FFD700',          // Dorado (Original)
    'prod-cartesiano': '#00FF00', // Verde Matrix
    'funciones': '#FF0033',       // <--- CAMBIO AQUÍ: ROJO NEÓN
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