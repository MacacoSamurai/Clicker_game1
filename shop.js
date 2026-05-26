function automatizar(index) { comprarAuto(index); }
function multiplicador(index) { comprarMulti(index); }

// ============================================================
// SISTEMA DE SHOP ULTRA FLUIDO E SEGURO (BETA CONTINUO)
// ============================================================

// Variável de controle para rastrear gastos que estão viajando pela rede
let custoEmTransito = 0;

async function executarCompraSegura(tipo, index, qtd = 1) {
    let campoJson = tipo === 'upgrade' ? 'upgrades' : (tipo === 'auto' ? 'autos' : 'multi');
    let item = estatisticas[campoJson][index];
    
    // 1. CÁLCULO DO CUSTO (Apenas para o visual imediato na tela)
    let custoTotalGasto = 0;
    let custoAtualItem = item.custo;
    let multiplicador = item.multiplicador;

    for (let i = 0; i < qtd; i++) {
        custoTotalGasto += custoAtualItem;
        custoAtualItem = Math.ceil(custoAtualItem * multiplicador);
    }

    // 🔴 TRAVA DE SEGURANÇA LOCAL
    if ((valorVisual - custoEmTransito) < custoTotalGasto) {
        console.warn("Compra bloqueada localmente: Aguardando confirmação do banco de dados.");
        return; 
    }

    custoEmTransito += custoTotalGasto;

    // Aplica imediatamente na tela (Interface instantânea)
    valorVisual      -= custoTotalGasto;
    estatisticas.val -= custoTotalGasto;
    
    if (tipo === 'upgrade')      estatisticas.inc += (item.ganho * qtd);
    else if (tipo === 'auto')    estatisticas.auto += (item.ganho * qtd);
    else if (tipo === 'multi')   estatisticas.mul += (item.ganho * qtd);

    item.custo = custoAtualItem; 
    atl(); 

    // 2. ENVIO PARA O BANCO DE DADOS
    if (estatisticas.userId && supabaseClient) {
        supabaseClient.rpc('comprar_item', {
            p_user_id: estatisticas.userId,
            p_tipo:    tipo,
            p_index:   index
        }).then(({ data, error }) => {
            custoEmTransito -= custoTotalGasto;
            if (custoEmTransito < 0) custoEmTransito = 0;

            if (error) {
                console.error("Erro na validação do servidor, resetando visual...", error.message);
                recuperarDadosDoServidor(); 
            } else if (data) {
                // 🟢 Sincroniza com os dados exatos calculados pelo servidor
                estatisticas.val = Number(data.novo_val);
                item.custo       = Number(data.novo_custo);
                
                if (tipo === 'upgrade')      estatisticas.inc  = Number(data.novo_val_num);
                else if (tipo === 'auto')    estatisticas.auto = Number(data.novo_val_num);
                else if (tipo === 'multi')   estatisticas.mul  = Number(data.novo_val_num);
                
                atl();
                salvarNoNavegador();
            }
        }).catch((err) => {
            console.error("Falha de rede ao comprar:", err);
            custoEmTransito -= custoTotalGasto;
            if (custoEmTransito < 0) custoEmTransito = 0;
            recuperarDadosDoServidor();
        });
    } else {
        custoEmTransito = 0;
    }
    salvarNoNavegador();
}

async function upgrade(index) {
    await executarCompraSegura('upgrade', index, 1);
}

async function automatizar(index) {
    await executarCompraSegura('auto', index, 1);
}

async function multiplicador(index) {
    await executarCompraSegura('multi', index, 1);
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
            // Força todos os estados locais a voltarem exatamente para a realidade da nuvem
            estatisticas.val  = Number(data.val);
            valorVisual       = Number(data.val);
            estatisticas.inc  = Number(data.inc);
            estatisticas.auto = Number(data.auto);
            estatisticas.mul  = Number(data.mul);
            
            // Sincroniza os custos atuais dos itens salvos (com verificações de existência)
            if (data.upgrades && estatisticas.upgrades) {
                estatisticas.upgrades.forEach((u, i) => {
                    if (data.upgrades[i]) u.custo = Number(data.upgrades[i].custo);
                });
            }
            if (data.autos && estatisticas.autos) {
                estatisticas.autos.forEach((a, i) => {
                    if (data.autos[i]) a.custo = Number(data.autos[i].custo);
                });
            }
            if (data.multi && estatisticas.multi) {
                estatisticas.multi.forEach((m, i) => {
                    if (data.multi[i]) m.custo = Number(data.multi[i].custo);
                });
            }
            
            custoEmTransito = 0;
            atl();
            salvarNoNavegador();
            console.log("Jogo sincronizado com sucesso após falha de rede.");
        }
    } catch (err) {
        console.error("Falha crítica ao tentar recuperar dados:", err);
    }
}