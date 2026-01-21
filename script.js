// 1. MÁQUINA FUNCIONAL (Concepto del PDF)
function runMachine() {
    const x = parseFloat(document.getElementById('inputX').value);
    const type = document.getElementById('funcType').value;
    const outputDiv = document.getElementById('machineResult');

    if (isNaN(x)) {
        outputDiv.innerHTML = "⚠️ Por favor ingresa un número válido.";
        return;
    }

    let result;
    let formula;

    switch(type) {
        case 'square':
            result = x * x;
            formula = `f(${x}) = ${x}^2`;
            break;
        case 'successor':
            result = x + 1;
            formula = `f(${x}) = ${x} + 1`;
            break;
        case 'double':
            result = x * 2;
            formula = `f(${x}) = 2(${x})`;
            break;
    }

    // Animación simple de texto
    outputDiv.style.opacity = 0;
    setTimeout(() => {
        outputDiv.innerHTML = `<strong>Proceso:</strong> ${formula} <br> <strong>Salida (Output):</strong> ${result}`;
        outputDiv.style.opacity = 1;
    }, 200);
}

// 2. PRODUCTO CARTESIANO
function calcCartesian() {
    const rawA = document.getElementById('setA').value;
    const rawB = document.getElementById('setB').value;
    
    // Convertir y limpiar inputs
    const A = rawA.split(',').map(s => s.trim()).filter(s => s !== "");
    const B = rawB.split(',').map(s => s.trim()).filter(s => s !== "");

    if(A.length === 0 || B.length === 0) {
        alert("¡Los conjuntos no pueden estar vacíos!");
        return;
    }

    let pairs = [];
    A.forEach(a => {
        B.forEach(b => {
            pairs.push(`(${a},${b})`);
        });
    });

    const resBox = document.getElementById('resCartesiano');
    resBox.innerHTML = `
        <p>Cardinalidad $|A \\times B| = ${A.length} \\times ${B.length} = ${pairs.length}$</p>
        <p>{ ${pairs.join(', ')} }</p>
    `;
}

// 3. COMPOSICIÓN DE FUNCIONES
function calcComposition() {
    const x = parseFloat(document.getElementById('compInput').value);
    const resBox = document.getElementById('resComposicion');

    if (isNaN(x)) {
        resBox.innerText = "Ingresa un número para x.";
        return;
    }

    // Funciones definidas internamente
    // g(x) = x + 1
    const gx = x + 1;
    // f(u) = u^2
    const fgx = gx * gx;

    resBox.innerHTML = `
        Paso 1: $g(${x}) = ${x} + 1 = ${gx}$ <br>
        Paso 2: $f(${gx}) = (${gx})^2 = ${fgx}$ <br>
        <strong>Resultado $(f \\circ g)(${x}) = ${fgx}$</strong>
    `;
    
    // Renderizar de nuevo las fórmulas matemáticas
    MathJax.typeset();
}