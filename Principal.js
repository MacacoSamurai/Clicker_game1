// ============================================================
// QUADRADO CLICKER — Principal.js (autenticação via supabase.auth)
// ============================================================

const { createClient } = supabase;
const SUPABASE_URL = 'https://vqqvfvtuikpohzuzgymb.supabase.co';
const SUPABASE_KEY = "sb_publishable_EV20V63Y2rjUscWHu28rbA_irMTciZk";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


let estatisticas = {
    nome: "",
    userId: "",   // novo: guarda o auth.uid() para identificar o jogador no banco
    val: 0,
    inc: 1,
    mul: 1,
    auto: 0,
    total: 0,
    //Devo mudar, não agora mas devo
    upgrades: [
        {id:"up1", custo: 10,      ganho: 1,      multiplicador: 1.17},
        {id:"up2", custo: 100,     ganho: 10,     multiplicador: 1.17},
        {id:"up3", custo: 1000,    ganho: 100,    multiplicador: 1.17},
        {id:"up4", custo: 10000,   ganho: 1000,   multiplicador: 1.17},
        {id:"up5", custo: 100000,  ganho: 10000,  multiplicador: 1.17},
        {id:"up6", custo: 1000000, ganho: 100000, multiplicador: 1.17}
    ],
    multi: [
        {id:"mult1", custo: 50000,   ganho: 1, multiplicador: 6},
        {id:"mult2", custo: 2000000, ganho: 5, multiplicador: 6.5}
    ],
    autos: [
        {id:"aut1", custo: 15,      ganho: 1,      multiplicador: 1.2},
        {id:"aut2", custo: 150,     ganho: 10,     multiplicador: 1.2},
        {id:"aut3", custo: 1500,    ganho: 100,    multiplicador: 1.2},
        {id:"aut4", custo: 15000,   ganho: 1000,   multiplicador: 1.2},
        {id:"aut5", custo: 150000,  ganho: 10000,  multiplicador: 1.2},
        {id:"aut6", custo: 1500000, ganho: 100000, multiplicador: 1.2}
    ],
    verif: 0
};

// Aliases para bater com os nomes chamados no HTML
function automatizar(index) { comprarAuto(index); }
function multiplicador(index) { comprarMulti(index); }

// --- VARIÁVEIS VISUAIS E DE BUFFER ---
let valorVisual = 0;
let totalVisual = 0;
let primeiroCarregamento = true;
let cliquesAcumulados = 0;
let temporizadorClique = null;
let contadorSave = 0;

// ============================================================
// LOOP OCIOSO — ganho passivo + sincronização periódica
// ============================================================
function ocioso() {
    if (!estatisticas.nome) return;

    // Incrementa o valor visual suavemente a cada 100ms (ganho passivo)
    let g = (estatisticas.auto * estatisticas.mul) / 10;
    valorVisual += g;
    totalVisual += g;

    // Se não há cliques pendentes, aproxima a tela do valor real do servidor (só sobe, nunca cai)
    if (cliquesAcumulados === 0 && !temporizadorClique) {
        if (estatisticas.val > valorVisual) {
            valorVisual += (estatisticas.val - valorVisual) * 0.2;
        }
        if (estatisticas.total > totalVisual) {
            totalVisual += (estatisticas.total - totalVisual) * 0.2;
        }
    }

    // Envia lote ao servidor a cada 3 segundos, só se houver cliques acumulados
    contadorSave++;
    if (contadorSave >= 30) {
        if (cliquesAcumulados > 0) enviarLoteAoServidor();
        contadorSave = 0;
    }
    atl();
}
setInterval(ocioso, 100);

// ============================================================
// CLIQUE PRINCIPAL
// ============================================================
function din() {
    if (estatisticas.verif === 0) estatisticas.verif = 1;

    let ganhoLocal = estatisticas.inc * estatisticas.mul;
    valorVisual += ganhoLocal;
    totalVisual += ganhoLocal;
    atl();

    cliquesAcumulados++;
    contadorSave = 0;

    if (!temporizadorClique) {
        temporizadorClique = setTimeout(() => { enviarLoteAoServidor(); }, 500);
    }
}

// ============================================================
// SINCRONIZAÇÃO — envia lote de cliques ao servidor via RPC
// A RPC agora valida pelo user_id (JWT) em vez de nickname+senha
// ============================================================
async function enviarLoteAoServidor() {
    const cliquesParaEnviar = cliquesAcumulados;
    cliquesAcumulados = 0;
    if (temporizadorClique) { clearTimeout(temporizadorClique); temporizadorClique = null; }

    if (!estatisticas.userId || !supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .rpc('registrar_clique_seguro', {
                p_user_id: estatisticas.userId,
                p_quantidade_cliques: cliquesParaEnviar
            });

        if (error) { console.error("Erro RPC clique:", error.message); return; }

        if (data && data.length > 0) {
            estatisticas.val   = data[0].novo_val;
            estatisticas.total = data[0].novo_total;

            if (primeiroCarregamento) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
                primeiroCarregamento = false;
            }

            // Se a tela ficou muito atrás do servidor, salta para o valor real
            if (estatisticas.val > valorVisual + (estatisticas.inc * estatisticas.mul * 10)) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
            }
            atl();
        }
    } catch (err) { console.error("Falha de rede ao enviar cliques:", err); }
}

// ============================================================
// COMPRAS — upgrade, auto, multiplicador
// Todas agora identificam o jogador pelo user_id (não mais nickname)
// ============================================================
async function upgrade(index) {
    let u = estatisticas.upgrades[index];
    if (valorVisual < u.custo) return;

    // Flush obrigatório: garante que todos os cliques pendentes chegam ao servidor
    // antes do desconto, evitando que a RPC de clique sobrescreva o val pós-compra
    if (cliquesAcumulados > 0) await enviarLoteAoServidor();

    const custo = u.custo;

    // Atualiza visualmente antes da confirmação do servidor (otimista)
    valorVisual      -= custo;
    estatisticas.val -= custo;
    estatisticas.inc += u.ganho;
    u.custo = Math.ceil(custo * u.multiplicador);
    atl();

    if (estatisticas.userId && supabaseClient) {
        try {
            // Desconto atômico no servidor: val = val - custo (não manda valor absoluto)
            const { data, error } = await supabaseClient
                .rpc('comprar_item', {
                    p_user_id: estatisticas.userId,
                    p_custo:   custo,
                    p_campo_json: 'upgrades',
                    p_json_novo:  estatisticas.upgrades,
                    p_campo_num:  'inc',
                    p_valor_num:  estatisticas.inc
                });
            if (error) {
                // Reverte localmente se o servidor recusou (ex: saldo insuficiente no servidor)
                console.error("Erro upgrade:", error.message);
                valorVisual      += custo;
                estatisticas.val += custo;
                estatisticas.inc -= u.ganho;
                u.custo = custo;
                atl();
                return;
            }
            // Sincroniza val real do servidor
            if (data) { estatisticas.val = data; valorVisual = data; }
        } catch (err) { console.error(err); }
    }
    salvarNoNavegador();
}

async function comprarAuto(index) {
    let a = estatisticas.autos[index];
    if (valorVisual < a.custo) return;

    if (cliquesAcumulados > 0) await enviarLoteAoServidor();

    const custo = a.custo;

    valorVisual       -= custo;
    estatisticas.val  -= custo;
    estatisticas.auto += a.ganho;
    a.custo = Math.ceil(custo * a.multiplicador);
    atl();

    if (estatisticas.userId && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .rpc('comprar_item', {
                    p_user_id: estatisticas.userId,
                    p_custo:   custo,
                    p_campo_json: 'autos',
                    p_json_novo:  estatisticas.autos,
                    p_campo_num:  'auto',
                    p_valor_num:  estatisticas.auto
                });
            if (error) {
                console.error("Erro auto:", error.message);
                valorVisual       += custo;
                estatisticas.val  += custo;
                estatisticas.auto -= a.ganho;
                a.custo = custo;
                atl();
                return;
            }
            if (data) { estatisticas.val = data; valorVisual = data; }
        } catch (err) { console.error(err); }
    }
    salvarNoNavegador();
}

async function comprarMulti(index) {
    let m = estatisticas.multi[index];
    if (valorVisual < m.custo) return;

    if (cliquesAcumulados > 0) await enviarLoteAoServidor();

    const custo = m.custo;

    valorVisual      -= custo;
    estatisticas.val -= custo;
    estatisticas.mul += m.ganho;
    m.custo = Math.ceil(custo * m.multiplicador);
    atl();

    if (estatisticas.userId && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .rpc('comprar_item', {
                    p_user_id: estatisticas.userId,
                    p_custo:   custo,
                    p_campo_json: 'multi',
                    p_json_novo:  estatisticas.multi,
                    p_campo_num:  'mul',
                    p_valor_num:  estatisticas.mul
                });
            if (error) {
                console.error("Erro multi:", error.message);
                valorVisual      += custo;
                estatisticas.val += custo;
                estatisticas.mul -= m.ganho;
                m.custo = custo;
                atl();
                return;
            }
            if (data) { estatisticas.val = data; valorVisual = data; }
        } catch (err) { console.error(err); }
    }
    salvarNoNavegador();
}

// ============================================================
// INTERFACE VISUAL
// ============================================================
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

// ============================================================
// PERSISTÊNCIA LOCAL
// ============================================================
function salvarNoNavegador() {
    localStorage.setItem("save_clicker_game", JSON.stringify(estatisticas));
}

async function salvarNoSupabase() {
    if (!estatisticas.userId || !supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('jogadores')
            .update({
                val: estatisticas.val, inc: estatisticas.inc,
                mul: estatisticas.mul, auto: estatisticas.auto,
                total: estatisticas.total, upgrades: estatisticas.upgrades,
                autos: estatisticas.autos, multi: estatisticas.multi
            })
            .eq('user_id', estatisticas.userId);
        if (error) console.error("Erro ao salvar no Supabase:", error.message);
    } catch (err) { console.error(err); }
}

// ============================================================
// CARREGAR DADOS DO SUPABASE após login
// ============================================================
async function puxarDadosDoSupabase(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) { console.error("Erro ao carregar dados:", error.message); return; }

        if (data) {
            estatisticas.nome  = data.nickname;
            estatisticas.userId = userId;
            estatisticas.val   = data.val;
            estatisticas.inc   = data.inc;
            estatisticas.mul   = data.mul;
            estatisticas.auto  = data.auto;
            estatisticas.total = data.total;
            valorVisual        = data.val;
            totalVisual        = data.total;
            primeiroCarregamento = false;

            if (data.upgrades) estatisticas.upgrades = data.upgrades;
            if (data.autos)    estatisticas.autos    = data.autos;
            if (data.multi)    estatisticas.multi    = data.multi;

            if (estatisticas.inc > 1 || estatisticas.mul > 1) estatisticas.verif = 1;

            salvarNoNavegador();
            mostrarTelaJogo();
            mostrarAviso(`🎮 Bem-vindo de volta, ${estatisticas.nome}!`, "sucesso");
        }
    } catch (err) { console.error("Erro crítico ao carregar dados:", err); }
}

// ============================================================
// AUTENTICAÇÃO — cadastro e login via supabase.auth
// ============================================================
async function iniciarJogo() {
    const emailInput = document.getElementById("nick-input").value.trim();   // campo reutilizado para email
    const senhaInput = document.getElementById("senha-input").value.trim();

    if (emailInput.length < 5 || !emailInput.includes("@")) {
        mostrarAviso("Digite um email válido!", "erro"); return;
    }
    if (senhaInput.length < 6) {
        mostrarAviso("A senha precisa de pelo menos 6 caracteres!", "erro"); return;
    }

    // Tenta fazer login primeiro; se falhar, oferece cadastro
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: emailInput,
        password: senhaInput
    });

    if (!loginError && loginData.user) {
        // Login bem sucedido — carrega os dados do jogador
        await puxarDadosDoSupabase(loginData.user.id);
        return;
    }

    // Login falhou — pode ser conta nova
    if (loginError && loginError.message.includes("Invalid login credentials")) {
        // Abre modal para criar conta nova
        document.getElementById("modal-mensagem").textContent =
            `Nenhuma conta encontrada com este email. Deseja criar uma conta nova?`;
        const modal = document.getElementById("custom-modal");
        if (modal) modal.style.display = "flex";

        document.getElementById("btn-modal-confirmar").onclick = async function() {
            fecharModal();
            await criarContaNova(emailInput, senhaInput);
        };
    } else {
        mostrarAviso("Erro ao conectar: " + (loginError?.message || "Tente novamente."), "erro");
    }
}

async function criarContaNova(email, senha) {
    // Pede nickname antes de criar a conta
    const nick = prompt("Escolha seu Nickname (mínimo 3 letras):");
    if (!nick || nick.trim().length < 3) {
        mostrarAviso("Nickname inválido. Conta não criada.", "erro"); return;
    }

    // Verifica se o nickname já está em uso
    const { data: nickExiste } = await supabaseClient
        .from('jogadores')
        .select('nickname')
        .eq('nickname', nick.trim())
        .maybeSingle();

    if (nickExiste) {
        mostrarAviso("Este nickname já está em uso! Escolha outro.", "erro"); return;
    }

    // Cria o usuário no supabase.auth (bcrypt com salt automático)
    const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
        email: email,
        password: senha
    });

    if (signupError) { mostrarAviso("Erro ao criar conta: " + signupError.message, "erro"); return; }

    const userId = signupData.user.id;

    // Cria o registro na tabela jogadores com o user_id linkado
    const { error: insertError } = await supabaseClient
        .from('jogadores')
        .insert({
            user_id:  userId,
            nickname: nick.trim(),
            val: 0, inc: 1, mul: 1, auto: 0, total: 0,
            upgrades: estatisticas.upgrades,
            autos:    estatisticas.autos,
            multi:    estatisticas.multi
        });

    if (insertError) { mostrarAviso("Erro ao salvar conta: " + insertError.message, "erro"); return; }

    estatisticas.nome   = nick.trim();
    estatisticas.userId = userId;
    salvarNoNavegador();
    mostrarTelaJogo();
    mostrarAviso("Conta criada com sucesso! Bem-vindo, " + nick.trim() + "!", "sucesso");

    // Após criar a conta, pergunta se quer migrar dados antigos
    setTimeout(() => oferecer_migracao(), 2000);
}

// ============================================================
// MIGRAÇÃO — fluxo para recuperar dados de conta antiga
// ============================================================
async function oferecer_migracao() {
    const quer = confirm("Você tinha uma conta antiga (nickname + senha)?\nClique OK para migrar seu progresso!");
    if (!quer) return;
    await iniciarMigracao();
}

async function iniciarMigracao() {
    const nickAntigo = prompt("Digite seu nickname ANTIGO:");
    if (!nickAntigo || nickAntigo.trim().length < 3) { mostrarAviso("Nickname inválido.", "erro"); return; }

    const senhaAntiga = prompt("Digite sua senha ANTIGA:");
    if (!senhaAntiga || senhaAntiga.trim().length < 3) { mostrarAviso("Senha inválida.", "erro"); return; }

    mostrarAviso("Verificando conta antiga...", "sucesso");

    // Gera o hash SHA-256 da senha antiga (mesmo método que o sistema antigo usava)
    const hashSenhaAntiga = await generarHashSenha(senhaAntiga.trim());

    // Chama a RPC de migração no Supabase — ela valida, copia os dados e apaga o registro antigo
    const { data, error } = await supabaseClient
        .rpc('migrar_conta_antiga', {
            p_nickname_antigo: nickAntigo.trim(),
            p_hash_senha_antiga: hashSenhaAntiga,
            p_novo_user_id: estatisticas.userId
        });

    if (error) { mostrarAviso("Erro na migração: " + error.message, "erro"); return; }

    if (data === 'ok') {
        mostrarAviso("✅ Migração feita! Seus dados antigos foram transferidos.", "sucesso");
        // Recarrega os dados já migrados do servidor
        await puxarDadosDoSupabase(estatisticas.userId);
    } else if (data === 'senha_errada') {
        mostrarAviso("❌ Nickname ou senha antiga incorretos.", "erro");
    } else if (data === 'nickname_nao_encontrado') {
        mostrarAviso("❌ Nenhuma conta antiga encontrada com esse nickname.", "erro");
    } else {
        mostrarAviso("Resposta inesperada do servidor.", "erro");
    }
}

// Hash SHA-256 — mantido apenas para verificar a senha do sistema antigo durante a migração
async function generarHashSenha(senhaPura) {
    const msgBuffer = new TextEncoder().encode(senhaPura);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// TELA DO JOGO
// ============================================================
function mostrarTelaJogo() {
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("tela-jogo").style.display  = "flex";
    document.getElementById("area-reset").style.display = "flex";
    document.getElementById("navbar").style.display     = "flex"; // exibe a navbar
    document.getElementById("exibir-nick").textContent  = `Jogador: ${estatisticas.nome}`;
    atl();
    atualizarLeaderboard(); // carrega em background mesmo com a aba fechada
}

// Abre/fecha a aba lateral sem bloquear o jogo
function toggleLeaderboard() {
    const sidebar = document.getElementById("aba-leaderboard");
    const overlay = document.getElementById("leaderboard-overlay");
    const botao   = document.querySelector(".leaderboard-toggle-btn");
    const aberto  = sidebar.classList.contains("aberto");
    sidebar.classList.toggle("aberto", !aberto);
    overlay.classList.toggle("aberto", !aberto);
    botao.classList.toggle("ativo",    !aberto);
}

function fecharLeaderboard() {
    document.getElementById("aba-leaderboard").classList.remove("aberto");
    document.getElementById("leaderboard-overlay").classList.remove("aberto");
    document.querySelector(".leaderboard-toggle-btn").classList.remove("ativo");
}

// ============================================================
// LEADERBOARD
// ============================================================
async function atualizarLeaderboard() {
    if (!estatisticas.nome || !supabaseClient) return;
    try {
        const { data: topDez, error } = await supabaseClient
            .from('jogadores')
            .select('nickname, val, total')
            .order('total', { ascending: false })
            .limit(10);

        if (error) { console.error("Erro leaderboard:", error.message); return; }

        let listaJogadores = [...topDez];
        let meuIndice = listaJogadores.findIndex(j => j.nickname === estatisticas.nome);

        if (meuIndice !== -1) {
            listaJogadores[meuIndice].val   = valorVisual;
            listaJogadores[meuIndice].total = totalVisual;
        } else {
            listaJogadores.push({ nickname: estatisticas.nome, val: valorVisual, total: totalVisual });
        }

        listaJogadores.sort((a, b) => b.total - a.total);

        const corpoTabela = document.getElementById("corpo-leaderboard");
        if (!corpoTabela) return;
        corpoTabela.innerHTML = "";

        let minhaPosicaoReal = listaJogadores.findIndex(j => j.nickname === estatisticas.nome) + 1;
        let estaNoTopNove    = minhaPosicaoReal <= 9;
        let limiteExibicao   = estaNoTopNove ? Math.min(listaJogadores.length, 10) : 9;

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
                <td>${abreviar(Math.floor(jogador.total))}</td>`;
            corpoTabela.appendChild(linha);
        }

        if (!estaNoTopNove) {
            const linhaVoce = document.createElement("tr");
            linhaVoce.className = "linha-destaque";
            linhaVoce.innerHTML = `
                <td>${minhaPosicaoReal}. (Você)</td>
                <td>${estatisticas.nome}</td>
                <td>${abreviar(Math.floor(valorVisual))}</td>
                <td>${abreviar(Math.floor(totalVisual))}</td>`;
            corpoTabela.appendChild(linhaVoce);
        }
    } catch (err) { console.error("Falha ao processar leaderboard:", err); }
}
setInterval(atualizarLeaderboard, 5000);

// ============================================================
// UTILITÁRIOS
// ============================================================
function abreviar(n) {
    if (n >= 1e12) return Math.floor(n / 1e11) / 10 + "T";
    if (n >= 1e9)  return Math.floor(n / 1e8)  / 10 + "B";
    if (n >= 1e6)  return Math.floor(n / 1e5)  / 10 + "M";
    if (n >= 1e3)  return Math.floor(n / 1e2)  / 10 + "K";
    return Math.floor(n).toString();
}

function mostrarAviso(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("custom-toast");
    if (!toast) return;
    toast.textContent = mensagem;
    toast.className = `toast-aviso ${tipo} mostrar`;
    setTimeout(() => toast.classList.remove("mostrar"), 3500);
}

function fecharModal() {
    const modal = document.getElementById("custom-modal");
    if (modal) modal.style.display = "none";
}

// ============================================================
// RESET
// ============================================================
async function reset() {
    if (!estatisticas.userId) return;
    if (!confirm("Deseja realmente resetar todo seu progresso?")) return;

    try {
        const { error } = await supabaseClient
            .from('jogadores')
            .update({
                val: 0, inc: 1, mul: 1, auto: 0, total: 0,
                upgrades: estatisticas.upgrades.map((u, i) => ({...u, custo: [10,100,1000,10000,100000,1000000][i]})),
                autos:    estatisticas.autos.map((a, i)    => ({...a, custo: [15,150,1500,15000,150000,1500000][i]})),
                multi:    estatisticas.multi.map((m, i)    => ({...m, custo: [50000,2000000][i]}))
            })
            .eq('user_id', estatisticas.userId);

        if (error) { mostrarAviso("Erro ao resetar no servidor.", "erro"); return; }

        localStorage.removeItem("save_clicker_game");
        mostrarAviso("Progresso resetado com sucesso!", "sucesso");
        setTimeout(() => location.reload(), 1500);
    } catch (err) { console.error("Falha no reset:", err); }
}

// ============================================================
// INICIALIZAÇÃO — verifica sessão ativa ao carregar a página
// O supabase.auth mantém a sessão salva automaticamente no localStorage
// ============================================================
async function inicializar() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
        // Sessão ativa encontrada — carrega o jogo direto sem pedir login
        await puxarDadosDoSupabase(session.user.id);
    }
    // Se não tiver sessão, simplesmente fica na tela de login
}
inicializar();