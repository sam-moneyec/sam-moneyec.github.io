/**
 * NOTIFICACIÓN DE MATHBOT
 */
function mathBotSay(message) {
    const resDivs = document.querySelectorAll('.result-display');
    // Esto añade un prefijo de MathBot a los resultados
    return `🤖 <strong>MathBot dice:</strong> ${message}`;
}

// Ejemplo de integración en la calculadora de Factorial
function calcFactorial() {
    const n = parseInt(document.getElementById('numFactorial').value);
    const resDiv = document.getElementById('resFactorial');

    if (isNaN(n) || n < 0) {
        resDiv.innerHTML = mathBotSay("¡Cuidado! El factorial solo se define para enteros no negativos.");
        return;
    }

    let result = 1;
    for (let i = 1; i <= n; i++) result *= i;

    resDiv.innerHTML = `<strong>Resultado:</strong> ${n}! = ${result} <br> ${mathBotSay("¡Operación completada con éxito!")}`;
}