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

            if (estatisticas.val > valorVisual + (estatisticas.inc * estatisticas.mul * 10)) {
                valorVisual = estatisticas.val;
                totalVisual = estatisticas.total;
            }
            atl();
        }
    } catch (err) { console.error("Falha de rede ao enviar cliques:", err); }
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

async function puxarDadosDoSupabase(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) { console.error("Erro ao carregar dados:", error.message); return; }

        if (data) {
            // 1. Mapeia o progresso essencial salvo do jogador
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

            // 🌟 2. Busca o balanceamento dinâmico (se existir)
            const { data: bal, error: errBal } = await supabaseClient.rpc('obter_balanceamento');

            if (!errBal && bal) {
                // Injeta multiplicadores apenas se os arrays existirem
                if (estatisticas.upgrades) {
                    estatisticas.upgrades.forEach(u => u.multiplicador = Number(bal.up_mult));
                }
                if (estatisticas.autos) {
                    estatisticas.autos.forEach(a => a.multiplicador = Number(bal.au_mult));
                }
                if (estatisticas.multi) {
                    estatisticas.multi.forEach((m, i) => {
                        if (bal.mu_mult && i < bal.mu_mult.length) {
                            m.multiplicador = Number(bal.mu_mult[i]);
                        }
                    });
                }
            } else if (errBal) {
                console.error("Erro ao obter parâmetros de balanceamento do banco:", errBal.message);
            }

            // 3. Mantém as validações originais intactas
            if (estatisticas.inc > 1 || estatisticas.mul > 1) estatisticas.verif = 1;

            // 4. Salva o estado atualizado e aciona a interface gráfica original
            salvarNoNavegador();
            mostrarTelaJogo();
            mostrarAviso(`🎮 Bem-vindo de volta, ${estatisticas.nome}!`, "sucesso");
        }
    } catch (err) { console.error("Erro crítico ao carregar dados:", err); }
}