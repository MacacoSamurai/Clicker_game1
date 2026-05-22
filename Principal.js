const { createClient } = supabase;
const SUPABASE_URL = 'https://vqqvfvtuikpohzuzgymb.supabase.co';
const SUPABASE_KEY = "sb_publishable_EV20V63Y2rjUscWHu28rbA_irMTciZk";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estatisticas = {
    nome: "",
    senha: "", 
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

// --- VARIÁVEIS PARA ELIMINAR FLUTUAÇÃO VISUAL (INTERPOLAÇÃO) ---
let valorVisual = 0;
let totalVisual = 0;
let primeiroCarregamento = true;

// --- VARIÁVEIS DE CONTROLO DO BUFFER DE CLIQUES ---
let cliquesAcumulados = 0;
let temporizadorClique = null;
let contadorSave = 0;

// --- LOOP DE GANHO OCIOSO VISUAL E AJUSTE SUAVE DE TELA ---
function ocioso() {
    if (!estatisticas.nome) return;

    // 1. O ganho passivo visual acontece na tela de forma fluida
    let g = (estatisticas.auto * estatisticas.mul) / 10;
    valorVisual += g;
    totalVisual += g;

    // 2. Sistema de aproximação inteligente (Apenas para CIMA)
    // Se parou de clicar, a tela SÓ vai se ajustar se o banco de dados tiver MAIS pontos que a tela.
    // Se o banco estiver com menos (atraso de rede), a tela simplesmente espera e NUNCA cai!
    if (cliquesAcumulados === 0 && !temporizadorClique) {
        
        // Ajuste do saldo atual (Apenas se o banco for maior)
        if (estatisticas.val > valorVisual) {
            let diferenca = estatisticas.val - valorVisual;
            valorVisual += diferenca * 0.2; // Sobe suavemente para alcançar o servidor
        }
        
        // Ajuste do total (Apenas se o banco for maior)
        if (estatisticas.total > totalVisual) {
            let diferencaTotal = estatisticas.total - totalVisual;
            totalVisual += diferencaTotal * 0.2;
        }
    }

    // 3. Sincroniza com o servidor a cada 3 segundos em ócio absoluto
    contadorSave++;
    if (contadorSave >= 30) { 
        enviarLoteAoServidor();
        contadorSave = 0;
    }
    atl();
}
setInterval(ocioso, 100);

// --- CLIQUE PRINCIPAL ---
function din() {
    if (estatisticas.verif === 0) {
        estatisticas.verif = 1;
    }

    // Soma imediata na interface visual do utilizador
    let ganhoLocal = estatisticas.inc * estatisticas.mul;
    valorVisual += ganhoLocal;
    totalVisual += ganhoLocal;
    atl();

    // Acumula na fila para o envio unificado à nuvem
    cliquesAcumulados++;
    contadorSave = 0; // Pausa o save do ócio enquanto clica

    if (!temporizadorClique) {
        temporizadorClique = setTimeout(() => {
            enviarLoteAoServidor();
        }, 500); // Consolida e envia pacotes a cada meio segundo
    }
}

// --- FUNÇÃO CENTRAL DE SINCRONIZAÇÃO SEM JOGOS DE IOIÔ ---
async function enviarLoteAoServidor() {
    const cliquesParaEnviar = cliquesAcumulados;
    cliquesAcumulados = 0; 
    
    if (temporizadorClique) {
        clearTimeout(temporizadorClique);
        temporizadorClique = null;
    }

    if (estatisticas.nome && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .rpc('registrar_clique_seguro', { 
                    p_nickname: estatisticas.nome, 
                    p_senha: estatisticas.senha,
                    p_quantidade_cliques: cliquesParaEnviar
                });

            if (error) {
                console.error("Erro ao validar dados no servidor:", error.message);
                return;
            }

            if (data && data.length > 0) {
                // Atualiza o valor real matemático vindo da nuvem
                estatisticas.val = data[0].novo_val;
                estatisticas.total = data[0].novo_total;
                
                // Se for o primeiro carregamento, alinha na hora
                if (primeiroCarregamento) {
                    valorVisual = estatisticas.val;
                    totalVisual = estatisticas.total;
                    primeiroCarregamento = false;
                }
                
                // SE POR ACASO a tela ficou muito para trás do servidor (ex: muito tempo sem clicar ou lag), 
                // força o valor visual a saltar para o valor real para o jogador não perder pontos.
                if (estatisticas.val > valorVisual + (estatisticas.inc * estatisticas.mul * 10)) {
                    valorVisual = estatisticas.val;
                    totalVisual = estatisticas.total;
                }

                atl();
            }
        } catch (err) {
            console.error("Falha ao comunicar com o servidor:", err);
        }
    }
}

// --- MERCADO DE COMPRAS (DEDUÇÃO SIMULTÂNEA NAS DUAS VARIÁVEIS) ---
function upgrade(index) {
    let u = estatisticas.upgrades[index];
    if (valorVisual >= u.custo) {
        valorVisual -= u.custo;
        estatisticas.val -= u.custo;
        estatisticas.inc += u.ganho;
        u.custo = Math.ceil(u.custo * u.multiplicador);
        salvarSincronizado();
        atl();
    }
}

function automatizar(index) {
    let a = estatisticas.autos[index];
    if (valorVisual >= a.custo) {
        valorVisual -= a.custo;
        estatisticas.val -= a.custo;
        estatisticas.auto += a.ganho;
        a.custo = Math.ceil(a.custo * a.multiplicador);
        salvarSincronizado();
        atl();
    }
}

function multiplicador(index) {
    let m = estatisticas.multi[index];
    if (valorVisual >= m.custo) {
        valorVisual -= m.custo;
        estatisticas.val -= m.custo;
        estatisticas.mul += m.ganho;
        m.custo = Math.ceil(m.custo * m.multiplicador);
        salvarSincronizado();
        atl();
    }
}

// --- ATUALIZAÇÃO DA INTERFACE VISUAL (USANDO VALOR VISUAL SMOOTH) ---
function atl() {
    if (!estatisticas.nome) return;

    document.getElementById("medidor").textContent = abreviar(Math.floor(valorVisual));

    const vpsEl = document.getElementById("vps");
    if (vpsEl) vpsEl.textContent = "Valor por segundo: " + abreviar(Math.floor(estatisticas.auto * estatisticas.mul));

    if (estatisticas.verif === 1) {
        document.getElementById("quadr").textContent = "+" + abreviar(Math.floor(estatisticas.inc * estatisticas.mul));
    }

    const ajustarEstiloBotao = (id, custo) => {
        const b = document.getElementById(id);
        if (!b) return;
        if (Math.floor(valorVisual) >= custo) {
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
}

// --- PERSISTÊNCIA ---
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
                upgrades: estatisticas.upgrades,
                autos: estatisticas.autos,
                multi: estatisticas.multi
            }, { onConflict: 'nickname' });

        if (error) console.error("❌ Erro ao sincronizar upgrades:", error.message);
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

// --- CONTROLO VISUAL INTERNO ---
function mostrarAviso(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("custom-toast");
    if (!toast) return;
    toast.textContent = mensagem;
    toast.className = `toast-aviso ${tipo} mostrar`;
    
    setTimeout(() => {
        toast.classList.remove("mostrar");
    }, 3500);
}

function fecharModal() {
    const modal = document.getElementById("custom-modal");
    if (modal) modal.style.display = "none";
}

// --- SISTEMA DE LEADERBOARD DINÂMICO (TOP 9 + VOCÊ COM DESTAQUE) ---
async function atualizarLeaderboard() {
    if (!estatisticas.nome || !supabaseClient) return;

    try {
        // 1. Puxamos o Top 10 atualizado direto do banco de dados
        const { data: topDez, error: errorTop } = await supabaseClient
            .from('jogadores')
            .select('nickname, val, total')
            .order('total', { ascending: false })
            .limit(10);

        if (errorTop) {
            console.error("Erro ao buscar o top 10:", errorTop.message);
            return;
        }

        // 2. Garantimos que os TEUS dados locais mais recentes entram no cálculo, 
        // mesmo que o banco ainda esteja a processar os milissegundos do lote.
        let listaJogadores = [...topDez];
        
        // Procura se tu já estás dentro desse Top 10 enviado pelo banco
        let meuIndiceNaLista = listaJogadores.findIndex(j => j.nickname === estatisticas.nome);

        if (meuIndiceNaLista !== -1) {
            // Se já estás no top 10, garante que a lista usa o teu valor visual ultra-recente
            listaJogadores[meuIndiceNaLista].val = valorVisual;
            listaJogadores[meuIndiceNaLista].total = totalVisual;
        } else {
            // Se ainda não estás no top 10 do banco, adicionamos-te temporariamente no fim para ordenar
            listaJogadores.push({
                nickname: estatisticas.nome,
                val: valorVisual,
                total: totalVisual
            });
        }

        // 3. REORDENAÇÃO FORÇADA NO JAVASCRIPT: Organiza a lista inteira de forma decrescente pelo TOTAL
        // Isto garante que se o teu total passou o de alguém, tu SOBES de posição na hora na tela!
        listaJogadores.sort((a, b) => b.total - a.total);

        const corpoTabela = document.getElementById("corpo-leaderboard");
        if (!corpoTabela) return;
        corpoTabela.innerHTML = "";

        // 4. Descobre qual é a tua posição real após a ordenação matemática implacável
        let minhaPosicaoReal = listaJogadores.findIndex(j => j.nickname === estatisticas.nome) + 1;
        let estaNoTopNove = minhaPosicaoReal <= 9;

        // Se estás no top 9, mostramos até 10 jogadores. Se estás fora, cortamos o 10º para dar lugar à tua linha isolada.
        let limiteExibicao = estaNoTopNove ? Math.min(listaJogadores.length, 10) : 9;

        // 5. Renderiza o Placar Correto
        for (let i = 0; i < limiteExibicao; i++) {
            const jogador = listaJogadores[i];
            const linha = document.createElement("tr");
            let posicaoTexto = `${i + 1}.`;

            if (jogador.nickname === estatisticas.nome) {
                linha.className = "linha-destaque";
                posicaoTexto = `${i + 1}. (Você)`;
            }

            linha.innerHTML = `
                <td>${posicaoTexto}</td>
                <td>${jogador.nickname}</td>
                <td>${abreviar(Math.floor(jogador.val))}</td>
                <td>${abreviar(Math.floor(jogador.total))}</td>
            `;
            corpoTabela.appendChild(linha);
        }

        // 6. Se a ordenação provar que ainda estás abaixo do 9º lugar, injeta a tua linha especial no fim
        if (!estaNoTopNove) {
            const linhaVoce = document.createElement("tr");
            linhaVoce.className = "linha-destaque";
            linhaVoce.innerHTML = `
                <td>${minhaPosicaoReal}. (Você)</td>
                <td>${estatisticas.nome}</td>
                <td>${abreviar(Math.floor(valorVisual))}</td>
                <td>${abreviar(Math.floor(totalVisual))}</td>
            `;
            corpoTabela.appendChild(linhaVoce);
        }

    } catch (err) {
        console.error("Falha ao processar dados do placar:", err);
    }
}
setInterval(atualizarLeaderboard, 5000); // Consulta segura a cada 5 segundos

// --- ACESSO DE USUÁRIOS (SHA-256) ---
async function iniciarJogo() {
    const nickInput = document.getElementById("nick-input").value.trim();
    const senhaInput = document.getElementById("senha-input").value.trim();
    
    if (nickInput.length < 3) { mostrarAviso("O nome precisa de pelo menos 3 letras!", "erro"); return; }
    if (senhaInput.length < 3) { mostrarAviso("A senha precisa de pelo menos 3 caracteres!", "erro"); return; }

    try {
        const hashSenha = await generarHashSenha(senhaInput);

        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('nickname, senha')
            .eq('nickname', nickInput)
            .maybeSingle();

        if (error) {
            console.error("Erro ao verificar conta no Supabase:", error);
            mostrarAviso("Erro ao conectar ao servidor.", "erro");
            return;
        }

        if (!data) {
            document.getElementById("modal-mensagem").textContent = `O nickname "${nickInput}" está disponível! Deseja criar uma conta nova?`;
            const modal = document.getElementById("custom-modal");
            if (modal) modal.style.display = "flex";
            
            document.getElementById("btn-modal-confirmar").onclick = function() {
                estatisticas.nome = nickInput;
                estatisticas.senha = hashSenha; 
                fecharModal();
                mostrarTelaJogo();
                salvarSincronizado(); 
                mostrarAviso("Sua conta foi registrada com sucesso!", "sucesso");
            };
            return;
        }

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
            
            valorVisual = data.val;
            totalVisual = data.total;
            primeiroCarregamento = false;

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
    document.getElementById("tela-login").style.display       = "none";
    document.getElementById("tela-jogo").style.display        = "flex";
    document.getElementById("area-reset").style.display       = "flex";
    document.getElementById("aba-leaderboard").style.display  = "block";
    document.getElementById("exibir-nick").textContent        = `Jogador: ${estatisticas.nome}`;
    atl();
    atualizarLeaderboard();
}

async function generarHashSenha(senhaPura) {
    const msgBuffer = new TextEncoder().encode(senhaPura);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function abreviar(n) {
    if (n >= 1e12) return Math.floor(n / 1e11) / 10 + "T";
    if (n >= 1e9)  return Math.floor(n / 1e8)  / 10 + "B";
    if (n >= 1e6)  return Math.floor(n / 1e5)  / 10 + "M";
    if (n >= 1e3)  return Math.floor(n / 1e2)  / 10 + "K";
    return Math.floor(n).toString();
}

// --- FUNÇÃO DE RESET SEGURO ---
async function reset() {
    if (!estatisticas.nome) return;

    if (confirm("Deseja realmente resetar todo seu progresso na nuvem e no navegador?")) {
        try {
            if (supabaseClient) {
                const { error } = await supabaseClient
                    .rpc('resetar_jogador_seguro', { 
                        p_nickname: estatisticas.nome, 
                        p_senha: estatisticas.senha 
                    });

                if (error) {
                    console.error("Erro ao resetar no servidor:", error.message);
                    mostrarAviso("Erro ao sincronizar o reset com o servidor.", "erro");
                    return;
                }
            }

            localStorage.removeItem("save_clicker_game");
            mostrarAviso("Progresso resetado com sucesso!", "sucesso");
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        } catch (err) {
            console.error("Falha ao executar o reset:", err);
        }
    }
}

carregarDoNavegador();