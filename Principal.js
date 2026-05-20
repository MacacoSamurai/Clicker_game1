const { createClient } = supabase;
const SUPABASE_URL = 'https://vqqvfvtuikpohzuzgymb.supabase.co';
const SUPABASE_KEY = "sb_publishable_EV20V63Y2rjUscWHu28rbA_irMTciZk";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estatisticas = {
    nome: "",
    senha: "", // Guarda o hash seguro da senha (SHA-256)
    val: 0,
    inc: 1,
    mul: 1,
    auto: 0,
    total: 0,
    upgrades: [
        {id:"up1", custo: 10,      ganho: 1,      multiplicador: 1.3},
        {id:"up2", custo: 100,     ganho: 10,     multiplicador: 1.3},
        {id:"up3", custo: 1000,    ganho: 100,    multiplicador: 1.3},
        {id:"up4", custo: 10000,   ganho: 1000,   multiplicador: 1.3},
        {id:"up5", custo: 100000,  ganho: 10000,  multiplicador: 1.3},
        {id:"up6", custo: 1000000, ganho: 100000, multiplicador: 1.3}
    ],
    multi: [
        {id:"mult1", custo: 50000,   ganho: 1, multiplicador: 9},
        {id:"mult2", custo: 2000000, ganho: 5, multiplicador: 15}
    ],
    autos: [
        {id:"aut1", custo: 15,      ganho: 1,      multiplicador: 1.4},
        {id:"aut2", custo: 150,     ganho: 10,     multiplicador: 1.4},
        {id:"aut3", custo: 1500,    ganho: 100,    multiplicador: 1.4},
        {id:"aut4", custo: 15000,   ganho: 1000,   multiplicador: 1.4},
        {id:"aut5", custo: 150000,  ganho: 10000,  multiplicador: 1.4},
        {id:"aut6", custo: 1500000, ganho: 100000, multiplicador: 1.4}
    ],
    verif: 0 
};

let contadorSave = 0;

// --- LOOP DE GANHO OCIOSO (A CADA 100ms) ---
function ocioso() {
    if (!estatisticas.nome) return;

    let g = (estatisticas.auto * estatisticas.mul) / 10;
    estatisticas.val   += g;
    estatisticas.total += g;
}
setInterval(ocioso, 100);

// --- CLIQUE PRINCIPAL ---
function din() {
    if (estatisticas.verif === 0) {
        estatisticas.verif = 1;
    }

    let ganho = estatisticas.inc * estatisticas.mul;
    estatisticas.val   += ganho;
    estatisticas.total += ganho;
    atl();
}

// --- COMPRA DE UPGRADES ---
function upgrade(index) {
    let u = estatisticas.upgrades[index];
    if (estatisticas.val >= u.custo) {
        estatisticas.val -= u.custo;
        estatisticas.inc += u.ganho;
        u.custo = Math.ceil(u.custo * u.multiplicador);
        salvarSincronizado();
    }
}

// --- COMPRA DE AUTOMATIZADORES ---
function automatizar(index) {
    let a = estatisticas.autos[index];
    if (estatisticas.val >= a.custo) {
        estatisticas.val  -= a.custo;
        estatisticas.auto += a.ganho;
        a.custo = Math.ceil(a.custo * a.multiplicador);
        salvarSincronizado();
    }
}

// --- COMPRA DE MULTIPLICADORES ---
function multiplicador(index) {
    let m = estatisticas.multi[index];
    if (estatisticas.val >= m.custo) {
        estatisticas.val -= m.custo;
        estatisticas.mul += m.ganho;
        m.custo = Math.ceil(m.custo * m.multiplicador);
        salvarSincronizado();
    }
}

// --- ATUALIZAÇÃO DA INTERFACE VISUAL ---
function atl() {
    if (!estatisticas.nome) return;

    document.getElementById("medidor").textContent = abreviar(Math.floor(estatisticas.val));

    const vpsEl = document.getElementById("vps");
    if (vpsEl) vpsEl.textContent = "Valor por segundo: " + abreviar(Math.floor(estatisticas.auto * estatisticas.mul));

    if (estatisticas.verif === 1) {
        document.getElementById("quadr").textContent = "+" + abreviar(Math.floor(estatisticas.inc * estatisticas.mul));
    }

    const ajustarEstiloBotao = (id, custo) => {
        const b = document.getElementById(id);
        if (!b) return;
        if (Math.floor(estatisticas.val) >= custo) {
            b.style.opacity = "1";
            b.style.cursor  = "pointer";
            b.style.filter  = "brightness(1.1)";
        } else {
            b.style.opacity = "0.4";
            b.style.cursor  = "not-allowed";
            b.style.filter  = "grayscale(0.5)";
        }
    };

    estatisticas.upgrades.forEach((u, i) => {
        const id = `up${i+1}`;
        ajustarEstiloBotao(id, u.custo);
        document.getElementById(id).textContent = `Up ${i+1}: ${abreviar(u.custo)}`;
    });

    estatisticas.autos.forEach((a, i) => {
        const id = `aut${i+1}`;
        ajustarEstiloBotao(id, a.custo);
        document.getElementById(id).textContent = `Auto ${i+1}: ${abreviar(a.custo)}`;
    });

    ajustarEstiloBotao("mult1", estatisticas.multi[0].custo);
    document.getElementById("mult1").textContent = `Mult 1: ${abreviar(estatisticas.multi[0].custo)}`;
    
    ajustarEstiloBotao("mult2", estatisticas.multi[1].custo);
    document.getElementById("mult2").textContent = `Mult 2: ${abreviar(estatisticas.multi[1].custo)}`;

    contadorSave++;
    if (contadorSave >= 50) { 
        salvarSincronizado(); 
        contadorSave = 0; 
    }
}
setInterval(atl, 100);

// --- SISTEMA DE SAVE E LOGS ---
function salvarSincronizado() {
    salvarNoNavegador();
    salvarNoSupabase();
}

function salvarNoNavegador() {
    localStorage.setItem("save_clicker_game", JSON.stringify(estatisticas));
}

async function salvarNoSupabase() {
    if (!estatisticas.nome || estatisticas.nome.trim() === "" || !supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('jogadores')
            .upsert({
                nickname: estatisticas.nome,
                senha: estatisticas.senha, 
                val: Math.floor(estatisticas.val),
                inc: estatisticas.inc,
                mul: estatisticas.mul,
                auto: estatisticas.auto,
                total: Math.floor(estatisticas.total),
                upgrades: estatisticas.upgrades,
                autos: estatisticas.autos,
                multi: estatisticas.multi
            }, { onConflict: 'nickname' });

        if (error) console.error("❌ Erro ao salvar no Supabase:", error.message);
    } catch (err) {
        console.error("Falha ao sincronizar dados na nuvem:", err);
    }
}

function carregarDoNavegador() {
    const save = localStorage.getItem("save_clicker_game");
    if (save) {
        const dadosCarregados = JSON.parse(save);
        if (dadosCarregados.nome && dadosCarregados.senha) {
            Object.assign(estatisticas, dadosCarregados);
            mostrarTelaJogo();
        }
    }
}

// --- FUNÇÕES DE CONTROLO DA NOVA INTERFACE ---
function mostrarAviso(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("custom-toast");
    toast.textContent = mensagem;
    toast.className = `toast-aviso ${tipo} mostrar`;
    
    setTimeout(() => {
        toast.classList.remove("mostrar");
    }, 3500);
}

function fecharModal() {
    document.getElementById("custom-modal").style.display = "none";
}

// --- SISTEMA DE LOGIN SEGURO CRIPTOGRAFADO (SHA-256) ---
async function iniciarJogo() {
    const nickInput = document.getElementById("nick-input").value.trim();
    const senhaInput = document.getElementById("senha-input").value.trim();
    
    if (nickInput.length < 3) { 
        mostrarAviso("O nome precisa de pelo menos 3 letras!", "erro"); 
        return; 
    }
    if (senhaInput.length < 3) { 
        mostrarAviso("A senha precisa de pelo menos 3 caracteres!", "erro"); 
        return; 
    }

    try {
        const hashSenha = await generarHashSenha(senhaInput);

        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('nickname, senha')
            .eq('nickname', nickInput)
            .maybeSingle();

        if (error) {
            console.error("Erro ao verificar conta no Supabase:", error);
            mostrarAviso("Erro ao conectar ao servidor. Verifique as Políticas RLS.", "erro");
            return;
        }

        // --- CASO A: CONTA NÃO EXISTE (CADASTRO NOVO VIA MODAL) ---
        if (!data) {
            document.getElementById("modal-mensagem").textContent = `O nickname "${nickInput}" está disponível! Deseja criar uma conta nova com a senha informada?`;
            
            const modal = document.getElementById("custom-modal");
            modal.style.display = "flex";
            
            document.getElementById("btn-modal-confirmar").onclick = function() {
                estatisticas.nome = nickInput;
                estatisticas.senha = hashSenha; 

                fecharModal();
                mostrarTelaJogo();
                salvarSincronizado(); 
                mostrarAviso("Sua conta foi registrada!", "sucesso");
            };
            return;
        }

        // --- CASO B: CONTA EXISTE (LOGIN DIRETO) ---
        if (hashSenha === data.senha) {
            estatisticas.nome = nickInput;
            estatisticas.senha = data.senha;
            
            await puxarDadosDoSupabase(nickInput);
        } else {
            mostrarAviso("❌ Senha incorreta para este nickname!", "erro");
        }

    } catch (err) {
        console.error("Falha no processo de login:", err);
    }
}

// --- DOWNLOAD DE DADOS DO BANCO ---
async function puxarDadosDoSupabase(nickname) {
    try {
        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('*')
            .eq('nickname', nickname)
            .single();

        if (error) {
            console.error("Erro ao baixar dados:", error.message);
            return;
        }

        if (data) {
            estatisticas.val = data.val;
            estatisticas.inc = data.inc;
            estatisticas.mul = data.mul;
            estatisticas.auto = data.auto;
            estatisticas.total = data.total;
            
            if (data.upgrades) estatisticas.upgrades = data.upgrades;
            if (data.autos) estatisticas.autos = data.autos;
            if (data.multi) estatisticas.multi = data.multi;

            if (estatisticas.inc > 1 || estatisticas.mul > 1) {
                estatisticas.verif = 1;
            }

            salvarNoNavegador(); 
            mostrarTelaJogo();
            mostrarAviso(`🎮 Bem-vindo de volta, ${nickname}!`, "sucesso");
        }
    } catch (err) {
        console.error("Erro crítico ao carregar dados da nuvem:", err);
    }
}

function mostrarTelaJogo() {
    document.getElementById("tela-login").style.display  = "none";
    document.getElementById("tela-jogo").style.display   = "flex";
    document.getElementById("area-reset").style.display  = "flex";
    document.getElementById("exibir-nick").textContent   = `Jogador: ${estatisticas.nome}`;
    atl();
}

// --- FUNÇÃO DE CRIPTOGRAFIA ---
async function generarHashSenha(senhaPura) {
    const msgBuffer = new TextEncoder().encode(senhaPura);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- FUNÇÕES AUXILIARES ---
function abreviar(n) {
    if (n >= 1e12) return Math.floor(n / 1e11) / 10 + "T";
    if (n >= 1e9)  return Math.floor(n / 1e8)  / 10 + "B";
    if (n >= 1e6)  return Math.floor(n / 1e5)  / 10 + "M";
    if (n >= 1e3)  return Math.floor(n / 1e2)  / 10 + "K";
    return Math.floor(n).toString();
}

function reset() {
    if (confirm("Deseja realmente resetar todo seu progresso?")) {
        localStorage.removeItem("save_clicker_game");
        location.reload();
    }
}

carregarDoNavegador();