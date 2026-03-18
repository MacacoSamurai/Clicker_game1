let estatisticas = {
    val: 0,
    inc: 1,
    mul: 1,
    up1: 10,
    up2: 100,
    up3: 1000,
    up4: 10000,
    up5: 100000,
    up6: 1000000,
    mu1: 50000,
    mu2: 2000000,
    verif: 0
};
let contadorSave = 0;

function carregarDoNavegador() {
    const saveData = localStorage.getItem("save_clicker_game");
    if (saveData) {
        const dadosCarregados = JSON.parse(saveData);
        
        Object.assign(estatisticas, dadosCarregados);
        console.log("Progresso carregado com sucesso!");
    }
}
carregarDoNavegador();


function calcularFim() {
    return estatisticas.inc * estatisticas.mul;
}

function abreviar(num) {
    if (num >= 1e15) return (num / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
    if (num >= 1e12) return (num / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (num >= 1e9)  return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1e6)  return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
}

function din() {
    estatisticas.val += (estatisticas.inc * estatisticas.mul);
    estatisticas.verif = 1;
}

function upg1() {
    if (estatisticas.val >= estatisticas.up1) {
        estatisticas.val -= estatisticas.up1;
        estatisticas.inc += 1;
        estatisticas.up1 = Math.ceil(estatisticas.up1 * 1.3);
    }
}

function upg2() {
    if (estatisticas.val >= estatisticas.up2) {
        estatisticas.val -= estatisticas.up2;
        estatisticas.inc += 10;
        estatisticas.up2 = Math.ceil(estatisticas.up2 * 1.3);
    }
}

function upg3() {
    if (estatisticas.val >= estatisticas.up3) {
        estatisticas.val -= estatisticas.up3;
        estatisticas.inc += 100;
        estatisticas.up3 = Math.ceil(estatisticas.up3 * 1.3);
    }
}

function upg4() {
    if (estatisticas.val >= estatisticas.up4) {
        estatisticas.val -= estatisticas.up4;
        estatisticas.inc += 1000;
        estatisticas.up4 = Math.ceil(estatisticas.up4 * 1.3);
    }
}

function upg5() {
    if (estatisticas.val >= estatisticas.up5) {
        estatisticas.val -= estatisticas.up5;
        estatisticas.inc += 10000;
        estatisticas.up5 = Math.ceil(estatisticas.up5 * 1.3);
    }
}

function upg6() {
    if (estatisticas.val >= estatisticas.up6) {
        estatisticas.val -= estatisticas.up6;
        estatisticas.inc += 100000;
        estatisticas.up6 = Math.ceil(estatisticas.up6 * 1.3);
    }
}

function multi1() {
    if (estatisticas.val >= estatisticas.mu1) {
        estatisticas.val -= estatisticas.mu1;
        estatisticas.mul += 1;
        estatisticas.mu1 = Math.ceil(estatisticas.mu1 * 9);
    }
}

function multi2() {
    if (estatisticas.val >= estatisticas.mu2) {
        estatisticas.val -= estatisticas.mu2;
        estatisticas.mul += 5;
        estatisticas.mu2 = Math.ceil(estatisticas.mu2 * 15);
    }
}

function atl() {
    document.getElementById("medidor").textContent = abreviar(estatisticas.val);
    document.getElementById("up1").textContent = "Upgrade 1: " + abreviar(estatisticas.up1);
    document.getElementById("up2").textContent = "Upgrade 2: " + abreviar(estatisticas.up2);
    document.getElementById("up3").textContent = "Upgrade 3: " + abreviar(estatisticas.up3);
    document.getElementById("up4").textContent = "Upgrade 4: " + abreviar(estatisticas.up4);
    document.getElementById("up5").textContent = "Upgrade 5: " + abreviar(estatisticas.up5);
    document.getElementById("up6").textContent = "Upgrade 6: " + abreviar(estatisticas.up6);
    document.getElementById("mult1").textContent = "Multiplicador 1: " + abreviar(estatisticas.mu1);
    document.getElementById("mult2").textContent = "Multiplicador 2: " + abreviar(estatisticas.mu2);
    
    if (estatisticas.verif == 1) {
        document.getElementById("quadr").textContent = abreviar(estatisticas.inc * estatisticas.mul);
    }
    contadorSave++;
    if (contadorSave >= 30) { 
        salvarNoNavegador();
        contadorSave = 0;
    }
}

setInterval(atl, 100);

// Transforma o objeto em JSON e salva no navegador
function salvarNoNavegador() {
    const dadosEmJson = JSON.stringify(estatisticas);
    localStorage.setItem("save_clicker_game", dadosEmJson);
}

// Tenta carregar os dados ao abrir o jogo
function carregarDoNavegador() {
    const saveData = localStorage.getItem("save_clicker_game");
    if (saveData) {
        // Transforma o JSON de volta em um objeto real
        const dadosCarregados = JSON.parse(saveData);
        
        // Atualiza o objeto estatisticas com os valores salvos
        Object.assign(estatisticas, dadosCarregados);
    }
}

