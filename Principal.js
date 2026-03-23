let estatisticas = {
    val: 0,
    inc: 1,
    mul: 1,
    auto: 0, // Ganho passivo total por segundo
    upgrades: [
        {id:"up1", custo: 10, ganho: 1, multiplicador: 1.3},
        {id:"up2", custo: 100, ganho: 10, multiplicador: 1.3},
        {id:"up3", custo: 1000, ganho: 100, multiplicador: 1.3},
        {id:"up4", custo: 10000, ganho: 1000, multiplicador: 1.3},
        {id:"up5", custo: 100000, ganho: 10000, multiplicador: 1.3},
        {id:"up6", custo: 1000000, ganho: 100000, multiplicador: 1.3}
    ],
    multi: [
        {id:"mu1", custo: 50000, ganho: 1, multiplicador: 9},
        {id:"mu2", custo: 2000000, ganho: 5, multiplicador: 15}
    ],
    autos: [
        {id:"aut1", custo: 15, ganho: 1, multiplicador: 1.4},
        {id:"aut2", custo: 150, ganho: 10, multiplicador: 1.4},
        {id:"aut3", custo: 1500, ganho: 100, multiplicador: 1.4},
        {id:"aut4", custo: 15000, ganho: 1000, multiplicador: 1.4},
        {id:"aut5", custo: 150000, ganho: 10000, multiplicador: 1.4},
        {id:"aut6", custo: 1500000, ganho: 100000, multiplicador: 1.4}
    ],
    verif: 0
};

let contadorSave = 0;

// 1. Ganho Passivo (Roda a cada 0.1s para ser fluido)
function ocioso() {
    estatisticas.val += (estatisticas.auto / 10);
}
setInterval(ocioso, 100);

// 2. Clique Manual
function din() {
    estatisticas.val += (estatisticas.inc * estatisticas.mul);
    estatisticas.verif = 1;
}

// 3. Compra de Upgrades (Clique)
function upgrade(index) {
    let upgr = estatisticas.upgrades[index];
    if (estatisticas.val >= upgr.custo) {
        estatisticas.val -= upgr.custo;
        estatisticas.inc += upgr.ganho;
        upgr.custo = Math.ceil(upgr.custo * upgr.multiplicador);
        salvarNoNavegador();
    }
}

// 4. Compra de Automatizadores (Passivo)
function automatizar(index) {
    let aut = estatisticas.autos[index];
    if (estatisticas.val >= aut.custo) {
        estatisticas.val -= aut.custo;
        estatisticas.auto += aut.ganho;
        aut.custo = Math.ceil(aut.custo * aut.multiplicador);
        salvarNoNavegador();
    }
}

// 5. Compra de Multiplicadores
function multiplicador(index) {
    let muti = estatisticas.multi[index];
    if (estatisticas.val >= muti.custo) {
        estatisticas.val -= muti.custo;
        estatisticas.mul += muti.ganho;
        muti.custo = Math.ceil(muti.custo * muti.multiplicador);
        salvarNoNavegador();
    }
}

// 6. Atualização Visual e Auto-Save
function atl() {
    // 1. ATUALIZAÇÃO DOS TEXTOS PRINCIPAIS
    // Math.floor garante que se tiveres 9.9K, mostre 9K e não 10K antes da hora
    const valorInteiro = Math.floor(estatisticas.val);
    document.getElementById("medidor").textContent = abreviar(valorInteiro);
    
    const vpsElemento = document.getElementById("vps");
    if (vpsElemento) {
        vpsElemento.textContent = "Valor por segundo: " + abreviar(Math.floor(estatisticas.auto));
    }

    // 2. ATUALIZAÇÃO DO BOTÃO PRINCIPAL (CLIQUE)
    if (estatisticas.verif === 1) {
        const ganhoClique = Math.floor(estatisticas.inc * estatisticas.mul);
        document.getElementById("quadr").textContent = abreviar(ganhoClique);
    }

    const atualizarBotao = (id, custo) => {
    const botao = document.getElementById(id);
    if (!botao) return;

    // Usamos Math.floor aqui também para ser 100% fiel ao que o jogador vê
    if (Math.floor(estatisticas.val) >= custo) {
        botao.style.opacity = "1";
        botao.style.cursor = "pointer";
        botao.style.filter = "brightness(1.1)";
    } else {
        botao.style.opacity = "0.4";
        botao.style.cursor = "not-allowed";
        botao.style.filter = "grayscale(0.5)";
    }
};

    // Aplicar a lógica a todos os Upgrades
    estatisticas.upgrades.forEach((up, i) => {
        const id = `up${i+1}`;
        atualizarBotao(id, up.custo);
        document.getElementById(id).textContent = `Up ${i+1}: ${abreviar(up.custo)}`;
    });

    // Aplicar a lógica a todos os Autos
    estatisticas.autos.forEach((auto, i) => {
        const id = `aut${i+1}`;
        atualizarBotao(id, auto.custo);
        document.getElementById(id).textContent = `Auto ${i+1}: ${abreviar(auto.custo)}`;
    });

    // Aplicar aos Multiplicadores
    atualizarBotao("mult1", estatisticas.multi[0].custo);
    document.getElementById("mult1").textContent = `Mult 1: ${abreviar(estatisticas.multi[0].custo)}`;
    
    atualizarBotao("mult2", estatisticas.multi[1].custo);
    document.getElementById("mult2").textContent = `Mult 2: ${abreviar(estatisticas.multi[1].custo)}`;

    // 4. AUTO-SAVE
    contadorSave++;
    if (contadorSave >= 50) { 
        salvarNoNavegador();
        contadorSave = 0;
    }
}
setInterval(atl, 100);

function abreviar(numero) {
    // Usamos Math.floor para garantir que 999.9 nunca vire 1K antes da hora
    if (numero >= 1e12) return Math.floor(numero / 1e11) / 10 + "T";
    if (numero >= 1e9)  return Math.floor(numero / 1e8) / 10 + "B";
    if (numero >= 1e6)  return Math.floor(numero / 1e5) / 10 + "M";
    if (numero >= 1e3)  return Math.floor(numero / 1e2) / 10 + "K";
    return Math.floor(numero).toString();
}   

// 8. Salvar e Carregar
function salvarNoNavegador() {
    localStorage.setItem("save_clicker_game", JSON.stringify(estatisticas));
}

function carregarDoNavegador() {
    const saveData = localStorage.getItem("save_clicker_game");
    if (saveData) {
        Object.assign(estatisticas, JSON.parse(saveData));
    }
}
carregarDoNavegador();

// 9. Reset Total
function reset() {
    if (confirm("Deseja realmente resetar todo seu progresso?")) {
            localStorage.removeItem("save_clicker_game");
            location.reload(); 
        }
}