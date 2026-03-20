let estatisticas = {
    val: 0,
    inc: 1,
    mul: 1,
   
    upgrades: [
    {id:"up1", custo: 10, ganho: 1e0, multiplicador: 1.3},
    {id:"up2",custo: 100, ganho: 1e1, multiplicador: 1.3},
    {id:"up3",custo: 1000, ganho: 1e2, multiplicador: 1.3},
    {id:"up4",custo: 10000, ganho: 1e3, multiplicador: 1.3},
    {id:"up5",custo: 100000, ganho: 1e4, multiplicador: 1.3},
    {id:"up6",custo: 1000000, ganho: 1e5, multiplicador: 1.3}
    ],
    
    multi: [
    {id:"mu1",custo: 50000, ganho: 1, multiplicador: 9},
    {id:"mu2",custo: 2000000, ganho: 5, multiplicador: 15}
    ],
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

function upgrade(index){
    let upgr = estatisticas.upgrades[index]

    if (estatisticas.val >= upgr.custo) {
    estatisticas.val -= upgr.custo;
    estatisticas.inc += upgr.ganho;
    upgr.custo = Math.ceil(upgr.custo * upgr.multiplicador);
    }
    salvarNoNavegador()
}

function multiplicador(index){
    let muti = estatisticas.multi[index]

    if (estatisticas.val >= muti.custo) {
        estatisticas.val -= muti.custo;
        estatisticas.mul += muti.ganho;
        muti.custo = Math.ceil(muti.custo * muti.multiplicador);
    }
    salvarNoNavegador()
}



function atl(){
    document.getElementById("medidor").textContent = abreviar(estatisticas.val);
    document.getElementById("up1").textContent = "Upgrade 1: " + abreviar(estatisticas.upgrades[0].custo);
    document.getElementById("up2").textContent = "Upgrade 2: " + abreviar(estatisticas.upgrades[1].custo);
    document.getElementById("up3").textContent = "Upgrade 3: " + abreviar(estatisticas.upgrades[2].custo);
    document.getElementById("up4").textContent = "Upgrade 4: " + abreviar(estatisticas.upgrades[3].custo);
    document.getElementById("up5").textContent = "Upgrade 5: " + abreviar(estatisticas.upgrades[4].custo);
    document.getElementById("up6").textContent = "Upgrade 6: " + abreviar(estatisticas.upgrades[5].custo);
    document.getElementById("mult1").textContent = "Multiplicador 1: " + abreviar(estatisticas.multi[0].custo);
    document.getElementById("mult2").textContent = "Multiplicador 2: " + abreviar(estatisticas.multi[1].custo);
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

function salvarNoNavegador() {
    const dadosEmJson = JSON.stringify(estatisticas);
    localStorage.setItem("save_clicker_game", dadosEmJson);
}

function carregarDoNavegador() {
    const saveData = localStorage.getItem("save_clicker_game");
    if (saveData) {
        const dadosCarregados = JSON.parse(saveData);
        
        Object.assign(estatisticas, dadosCarregados);
    }
}

function reset() {
    if (confirm("Deseja realmente resetar todo seu progresso?")) {
        estatisticas.val = 0; 
        estatisticas.inc = 1;
        estatisticas.mul = 1;
        estatisticas.verif = 0;

        estatisticas.upgrades = [
            {id:"up1", custo: 10, ganho: 1e0, multiplicador: 1.3},
            {id:"up2", custo: 100, ganho: 1e1, multiplicador: 1.3},
            {id:"up3", custo: 1000, ganho: 1e2, multiplicador: 1.3},
            {id:"up4", custo: 10000, ganho: 1e3, multiplicador: 1.3},
            {id:"up5", custo: 100000, ganho: 1e4, multiplicador: 1.3},
            {id:"up6", custo: 1000000, ganho: 1e5, multiplicador: 1.3}
        ];
        
        estatisticas.multi = [
            {id:"mu1", custo: 50000, ganho: 1, multiplicador: 9},
            {id:"mu2", custo: 2000000, ganho: 5, multiplicador: 15}
        ];

        salvarNoNavegador();     
        location.reload(); 
    }
}