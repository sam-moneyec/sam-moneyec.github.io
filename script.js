/**
 * LÓGICA DE PESTAÑAS (TABS)
 */
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Ocultar todo el contenido
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Desactivar botones del menú
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Mostrar pestaña seleccionada y activar botón (si existe el evento)
    var targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.style.display = "block";
    }
    
    if (evt) {
        evt.currentTarget.className += " active";
    }
}

/**
 * CALCULADORA: PRODUCTO CARTESIANO
 */
function calcCartesian() {
    const rawA = document.getElementById('setA').value;
    const rawB = document.getElementById('setB').value;
    const resDiv = document.getElementById('resCartesiano');

    if (!rawA || !rawB) {
        resDiv.innerHTML = "⚠️ Ingresa datos en ambos campos.";
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

    resDiv.innerHTML = `<strong>Resultado:</strong> { ${pairs.join(', ')} } <br> <strong>Total:</strong> ${pairs.length} pares.`;
}

/**
 * CALCULADORA: FACTORIAL
 */
function calcFactorial() {
    const n = parseInt(document.getElementById('numFactorial').value);
    const resDiv = document.getElementById('resFactorial');

    if (isNaN(n) || n < 0) {
        resDiv.innerHTML = "⚠️ Ingresa un entero positivo.";
        return;
    }

    let result = 1;
    for (let i = 1; i <= n; i++) result *= i;
    resDiv.innerHTML = `<strong>${n}! =</strong> ${result}`;
}

/**
 * CALCULADORA: COMPOSICIÓN
 */
function calcComposition() {
    const x = parseFloat(document.getElementById('compInput').value);
    const resDiv = document.getElementById('resComposicion');

    if (isNaN(x)) {
        resDiv.innerHTML = "⚠️ Ingresa un número.";
        return;
    }
    
    // g(x) = x + 1
    const gx = x + 1;
    // f(u) = u^2
    const fgx = gx * gx;

    resDiv.innerHTML = `g(${x}) = ${gx} <br> f(${gx}) = ${fgx}`;
}