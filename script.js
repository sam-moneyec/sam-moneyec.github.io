/**
 * SISTEMA DE GESTIÓN DE PESTAÑAS
 */
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // 1. Ocultar todo el contenido
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // 2. Desactivar todos los botones del menú
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // 3. Mostrar la pestaña actual
    document.getElementById(tabName).style.display = "block";

    // 4. Activar el botón presionado
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
        resDiv.innerHTML = "<span style='color: #ff5555;'>⚠️ Error: Ingresa datos en ambos campos.</span>";
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

    resDiv.innerHTML = `
        <strong>Conjunto Resultante:</strong> { ${pairs.join(', ')} } <br>
        <strong>Cardinalidad:</strong> ${A.length} x ${B.length} = ${pairs.length} pares.
    `;
}

/**
 * CALCULADORA: FACTORIAL (DISCRETA)
 */
function calcFactorial() {
    const n = parseInt(document.getElementById('numFactorial').value);
    const resDiv = document.getElementById('resFactorial');

    if (isNaN(n) || n < 0) {
        resDiv.innerHTML = "⚠️ Ingresa un número entero positivo.";
        return;
    }

    let result = 1;
    for (let i = 1; i <= n; i++) {
        result *= i;
    }

    resDiv.innerHTML = `<strong>Resultado:</strong> f(${n}) = ${n}! = ${result}`;
}

/**
 * CALCULADORA: COMPOSICIÓN f(g(x))
 */
function calcComposition() {
    const x = parseFloat(document.getElementById('compInput').value);
    const resDiv = document.getElementById('resComposicion');

    if (isNaN(x)) {
        resDiv.innerHTML = "⚠️ Por favor ingresa un número.";
        return;
    }

    const gx = x + 1;      // Paso 1
    const fgx = gx * gx;   // Paso 2

    resDiv.innerHTML = `
        1. <strong>g(${x})</strong> = ${x} + 1 = ${gx} <br>
        2. <strong>f(${gx})</strong> = (${gx})² = ${fgx} <br>
        🏁 <strong>Resultado Final:</strong> ${fgx}
    `;
}