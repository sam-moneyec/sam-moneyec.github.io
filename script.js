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
  if (evt) evt.preventDefault();

  // Ocultar contenidos
  const tabcontent = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";

  // Resetear botones
  const tablinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
    tablinks[i].style.borderColor = "transparent";
    tablinks[i].style.color = "#e0e0e0";
  }

  const currentTab = document.getElementById(tabName);

  // Si no existe esa sección, no dejes la página en blanco:
  if (!currentTab) {
    // vuelve a Inicio
    const inicio = document.getElementById("inicio");
    if (inicio) inicio.style.display = "block";
    document.documentElement.style.setProperty('--gold-primary', sectionColors["inicio"] || '#FFD700');
    alert("Esta sección aún no está creada en el HTML.");
    return;
  }

  currentTab.style.display = "block";

  const newColor = sectionColors[tabName] || '#FFD700';
  document.documentElement.style.setProperty('--gold-primary', newColor);

  if (evt) {
    evt.currentTarget.className += " active";
    evt.currentTarget.style.borderColor = newColor;
    evt.currentTarget.style.color = newColor;
  }

  // Si usas MathJax en fórmulas dentro de tabs:
  if (window.MathJax && window.MathJax.typeset) window.MathJax.typeset();
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
