function ocioso() {
    if (!estatisticas.nome) return;

    let g = (estatisticas.auto * estatisticas.mul) / 10;
    valorVisual += g;
    totalVisual += g;

    if (cliquesAcumulados === 0 && !temporizadorClique) {
        if (estatisticas.val > valorVisual) {
            valorVisual += (estatisticas.val - valorVisual) * 0.2;
        }
        if (estatisticas.total > totalVisual) {
            totalVisual += (estatisticas.total - totalVisual) * 0.2;
        }
    }

    contadorSave++;
    if (contadorSave >= 30) {
        if (cliquesAcumulados > 0) enviarLoteAoServidor();
        contadorSave = 0;
    }
    atl();
}
setInterval(ocioso, 100);

function din() {
    // 🟢 CORREÇÃO: Força o verif a virar 1 independentemente de como iniciar
    if (!estatisticas.verif) estatisticas.verif = 1;

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

async function inicializar() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
        await puxarDadosDoSupabase(session.user.id);
    }
}
inicializar();