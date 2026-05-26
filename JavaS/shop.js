// JavaS/shop.js
async function executarCompraSegura(tipo, index) {
    if (!estatisticas.userId || !supabaseClient) return;

    try {
        const { data, error } = await supabaseClient.rpc('comprar_item', {
            p_user_id: estatisticas.userId,
            p_tipo: tipo,
            p_index: index
        });

        if (error) {
            console.error("Erro na compra:", error.message);
            mostrarAviso("Erro ao comprar. Sincronizando...", "erro");
            await recuperarDadosDoServidor();
            return;
        }

        if (data) {
            estatisticas.val = Number(data.novo_val);
            valorVisual = estatisticas.val;

            const campo = tipo === 'upgrade' ? 'inc' : tipo === 'auto' ? 'auto' : 'mul';
            estatisticas[campo] = Number(data.novo_val_num);

            let lista = estatisticas[tipo === 'upgrade' ? 'upgrades' : tipo === 'auto' ? 'autos' : 'multi'];
            if (lista && lista[index]) {
                lista[index].custo = Number(data.novo_custo);
            }

            atl();
            salvarNoNavegador();
            mostrarAviso("Compra realizada com sucesso!", "sucesso");
        }
    } catch (err) {
        console.error("Falha na compra:", err);
        await recuperarDadosDoServidor();
    }
}

async function upgrade(index) {
    await executarCompraSegura('upgrade', index);
}

async function automatizar(index) {
    await executarCompraSegura('auto', index);
}

async function multiplicador(index) {
    await executarCompraSegura('multi', index);
}

async function recuperarDadosDoServidor() {
    if (!estatisticas.userId || !supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('jogadores')
            .select('*')
            .eq('user_id', estatisticas.userId)
            .single();

        if (!error && data) {
            estatisticas.val   = Number(data.val);
            estatisticas.inc   = Number(data.inc);
            estatisticas.mul   = Number(data.mul);
            estatisticas.auto  = Number(data.auto);
            estatisticas.total = Number(data.total);

            valorVisual = estatisticas.val;
            totalVisual = estatisticas.total;

            if (data.upgrades) estatisticas.upgrades = data.upgrades;
            if (data.autos)    estatisticas.autos    = data.autos;
            if (data.multi)    estatisticas.multi    = data.multi;

            atl();
            salvarNoNavegador();
        }
    } catch (err) {
        console.error("Falha ao recuperar dados:", err);
    }
}