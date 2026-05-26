let estatisticas = {
    nome: "",
    userId: "",   
    val: 0,
    inc: 1,
    mul: 1,
    auto: 0,
    total: 0,
    verif: 0, 
    upgrades: [
        {id:"up1", ganho: 1, multiplicador: 0, custo: 10}, 
        {id:"up2", ganho: 10, multiplicador: 0, custo: 100}, 
        {id:"up3", ganho: 100, multiplicador: 0, custo: 1000},
        {id:"up4", ganho: 1000, multiplicador: 0, custo: 10000}, 
        {id:"up5", ganho: 10000, multiplicador: 0, custo: 100000}, 
        {id:"up6", ganho: 100000, multiplicador: 0, custo: 1000000}
    ],
    autos: [
        {id:"aut1", ganho: 1, multiplicador: 0, custo: 15}, 
        {id:"aut2", ganho: 10, multiplicador: 0, custo: 150}, 
        {id:"aut3", ganho: 100, multiplicador: 0, custo: 1500},
        {id:"aut4", ganho: 1000, multiplicador: 0, custo: 15000}, 
        {id:"aut5", ganho: 10000, multiplicador: 0, custo: 150000}, 
        {id:"aut6", ganho: 100000, multiplicador: 0, custo: 1500000}
    ],
    multi: [
        {id:"mult1", ganho: 1, multiplicador: 0, custo: 50000}, 
        {id:"mult2", ganho: 5, multiplicador: 0, custo: 2000000}
    ]
};

let valorVisual = 0;
let totalVisual = 0;
let primeiroCarregamento = true;
let cliquesAcumulados = 0;
let temporizadorClique = null;
let contadorSave = 0;