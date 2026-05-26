// JavaS/api.js
async function enviarLoteAoServidor() {
    const cliquesParaEnviar = Math.min(cliquesAcumulados, 50);
    cliquesAcumulados = 0;
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
            atl();
        }
    } catch (err) { 
        console.error("Falha de rede ao enviar cliques:", err); 
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

            valorVisual = estatisticas.val;
            totalVisual = estatisticas.total;
            primeiroCarregamento = false;

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