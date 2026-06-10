// JavaS/main.js
function ocioso() {
    if (!estatisticas.nome) return;

    // Ganho idle deste tick (100ms = 1/10 de segundo)
    const ganhoTick = (estatisticas.auto * estatisticas.mul) / 10;

    if (ganhoTick > 0) {
        valorVisual        += ganhoTick;
        totalVisual        += ganhoTick;
        ganhoIdleAcumulado += ganhoTick;
    }

    // Enquanto não há nada pendente, deixa o visual convergir
    // para o valor confirmado pelo servidor (ex.: outra aba aberta)
    if (cliquesAcumulados === 0 && ganhoIdleAcumulado === 0) {
        if (estatisticas.val > valorVisual) {
            valorVisual += (estatisticas.val - valorVisual) * 0.2;
        }
        if (estatisticas.total > totalVisual) {
            totalVisual += (estatisticas.total - totalVisual) * 0.2;
        }
    }

    contadorSave++;
    contadorIdle++; // avança independente de cliques

    // A cada 3 segundos (30 ticks × 100ms): persiste cliques no servidor
    if (contadorSave >= 30) {
        if (cliquesAcumulados > 0) enviarLoteAoServidor();
        contadorSave = 0;
    }

    // A cada 3 segundos: persiste idle no servidor (nunca interrompido por cliques)
    if (contadorIdle >= 30) {
        if (ganhoIdleAcumulado > 0) enviarIdleAoServidor();
        contadorIdle = 0;
    }

    atl();
}
setInterval(ocioso, 100);

let ultimoClique = 0;

function din() {
    if (!estatisticas.userId) return;

    const agora = Date.now();
    if (agora - ultimoClique < 25) return; // Anti-macro
    ultimoClique = agora;

    const ganhoLocal = estatisticas.inc * estatisticas.mul;
    valorVisual += ganhoLocal;
    totalVisual += ganhoLocal;

    cliquesAcumulados++;
    // contadorSave não é mais zerado aqui para não interferir no ciclo do idle
    // o timer de 350ms abaixo já garante o envio rápido dos cliques

    if (estatisticas.inc > 1 || estatisticas.mul > 1) {
        estatisticas.verif = 1;
    }

    if (!temporizadorClique) {
        temporizadorClique = setTimeout(enviarLoteAoServidor, 350);
    }

    atl();
}

async function reset() {
    if (!estatisticas.userId) return;
    if (!confirm("Deseja realmente resetar todo seu progresso?")) return;

    try {
        await supabaseClient.rpc('resetar_jogador', { p_user_id: estatisticas.userId });

        localStorage.removeItem("save_clicker_game");
        mostrarAviso("Progresso resetado com sucesso!", "sucesso");
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error("Falha no reset:", err);
        mostrarAviso("Erro ao resetar no servidor.", "erro");
    }
}

async function inicializar() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        await puxarDadosDoSupabase(session.user.id);
    }
}
inicializar();