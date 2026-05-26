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
                <td>${jogador.nickname.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
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