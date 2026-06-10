// --- Cliques manuais ---
async function enviarLoteAoServidor() {
    const cliquesParaEnviar = Math.min(cliquesAcumulados, 50);
    cliquesAcumulados -= cliquesParaEnviar;

    if (temporizadorClique) {
        clearTimeout(temporizadorClique);
        temporizadorClique = null;
    }

    if (!estatisticas.userId || !supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .rpc('registrar_clique_seguro', {
                p_user_id: estatisticas.userId,
                p_quantidade_cliques: cliquesParaEnviar
            });

        if (error) {
            console.error("Erro RPC clique:", error.message);
            cliquesAcumulados += cliquesParaEnviar;
            return;
        }

        if (data && data.length > 0) {
            estatisticas.val   = Number(data[0].novo_val);
            estatisticas.total = Number(data[0].novo_total);

            if (primeiroCarregamento) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
                primeiroCarregamento = false;
            }

            if (estatisticas.val > valorVisual + (estatisticas.inc * estatisticas.mul * 15)) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
            }

            if (valorVisual < estatisticas.val) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
            }

            atl();
        }
    } catch (err) {
        console.error("Falha de rede ao enviar cliques:", err);
        cliquesAcumulados += cliquesParaEnviar;
    }
}

// --- Ganho idle ---
async function enviarIdleAoServidor() {
    if (!estatisticas.userId || !supabaseClient) return;
    if (ganhoIdleAcumulado <= 0) return;

    const ganhoParaEnviar  = ganhoIdleAcumulado;
    ganhoIdleAcumulado     = 0;

    try {
        const { data, error } = await supabaseClient
            .rpc('registrar_idle_seguro', {
                p_user_id:    estatisticas.userId,
                p_ganho_idle: ganhoParaEnviar
            });

        if (error) {
            console.error("Erro RPC idle:", error.message);
            ganhoIdleAcumulado += ganhoParaEnviar; // devolve para tentar novamente
            return;
        }

        if (data && data.length > 0) {
            estatisticas.val   = Number(data[0].novo_val);
            estatisticas.total = Number(data[0].novo_total);

            // Corrige visual caso servidor esteja à frente (ex.: outra aba aberta)
            if (valorVisual < estatisticas.val) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
            }

            atl();
        }
    } catch (err) {
        console.error("Falha de rede ao enviar idle:", err);
        ganhoIdleAcumulado += ganhoParaEnviar;
    }
}

async function salvarNoSupabase() {
    console.warn("salvarNoSupabase() desativado por segurança.");
}

async function puxarDadosDoSupabase(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error("Erro ao carregar dados:", error.message);
            return;
        }

        if (data) {
            estatisticas.nome   = data.nickname;
            estatisticas.userId = userId;
            estatisticas.val    = Number(data.val);
            estatisticas.inc    = Number(data.inc);
            estatisticas.mul    = Number(data.mul);
            estatisticas.auto   = Number(data.auto);
            estatisticas.total  = Number(data.total);

            valorVisual        = estatisticas.val;
            totalVisual        = estatisticas.total;
            primeiroCarregamento = false;

            // Zera acumulados para não enviar lixo de sessão anterior
            cliquesAcumulados  = 0;
            ganhoIdleAcumulado = 0;

            if (data.upgrades) estatisticas.upgrades = data.upgrades;
            if (data.autos)    estatisticas.autos    = data.autos;
            if (data.multi)    estatisticas.multi    = data.multi;

            if (estatisticas.inc > 1 || estatisticas.mul > 1) estatisticas.verif = 1;

            salvarNoNavegador();
            mostrarTelaJogo();
            mostrarAviso(`🎮 Bem-vindo de volta, ${estatisticas.nome}!`, "sucesso");
        }
    } catch (err) {
        console.error("Erro crítico ao carregar dados:", err);
    }
}