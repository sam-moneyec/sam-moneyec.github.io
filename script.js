// 1. Lógica del Producto Cartesiano
function calcCartesian() {
    const rawA = document.getElementById('setA').value;
    const rawB = document.getElementById('setB').value;
    
    // Convertir strings a arrays
    const A = rawA.split(',').map(item => item.trim());
    const B = rawB.split(',').map(item => item.trim());
    
    if(A[0] === "" || B[0] === "") {
        alert("Por favor ingresa elementos en ambos conjuntos");
        return;
    }

    let resultado = [];
    A.forEach(a => {
        B.forEach(b => {
            resultado.push(`(${a}, ${b})`);
        });
    });

    document.getElementById('resCartesiano').innerHTML = 
        `A x B = { ${resultado.join(', ')} } <br> Cardinalidad: ${resultado.length}`;
}

// 2. Lógica de Función Discreta (Factorial)
function calcFactorial() {
    const n = parseInt(document.getElementById('numN').value);
    if (isNaN(n) || n < 0) {
        alert("Ingresa un número entero positivo");
        return;
    }

    let res = 1;
    for(let i = 1; i <= n; i++) {
        res *= i;
    }

    document.getElementById('resFactorial').innerText = `Resultado f(${n}) = ${res}`;
}