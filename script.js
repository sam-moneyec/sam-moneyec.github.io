// Función para abrir pestañas
function openTab(evt, tabName) {
    // 1. Ocultar todos los elementos con clase "tab-content"
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // 2. Quitar la clase "active" de todos los botones del menú
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // 3. Mostrar la pestaña actual y añadir clase "active" al botón clickeado
    document.getElementById(tabName).style.display = "block";
    
    // Si el evento existe (click), poner la clase activa.
    // Si no (carga inicial), no hacemos nada con los links.
    if (evt) {
        evt.currentTarget.className += " active";
    }
}

// --- FUNCIONES MATEMÁTICAS ---

// 1. Producto Cartesiano
function calcCartesian() {
    const rawA = document.getElementById('setA').value;
    const rawB = document.getElementById('setB').value;
    const resDiv = document.getElementById('resCartesiano');

    if(!rawA || !rawB) {
        resDiv.innerHTML = "<span style='color:red'>Por favor llena ambos campos</span>";
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

    resDiv.innerHTML = `{ ${pairs.join(', ')} } <br> Total de pares: ${pairs.length}`;
}

// 2. Factorial (Función Discreta)
function calcFactorial() {
    const n = parseInt(document.getElementById('numFactorial').value);
    const resDiv = document.getElementById('resFactorial');

    if(isNaN(n) || n < 0) {
        resDiv.innerHTML = "Ingresa un entero positivo (N)";
        return;
    }

    let result = 1;
    for(let i = 1; i <= n; i++) {
        result *= i;
    }
    
    resDiv.innerHTML = `f(${n}) = ${n}! = ${result}`;
}