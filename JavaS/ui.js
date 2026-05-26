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

function mostrarTelaJogo() {
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("tela-jogo").style.display  = "flex";
    document.getElementById("area-reset").style.display = "flex";
    document.getElementById("navbar").style.display     = "flex"; 
    document.getElementById("exibir-nick").textContent  = `Jogador: ${estatisticas.nome}`;
    atl();
    atualizarLeaderboard();
}

function toggleLeaderboard() {
    const sidebar = document.getElementById("aba-leaderboard");
    const overlay = document.getElementById("leaderboard-overlay");
    const botao = document.querySelector(".leaderboard-toggle-btn");
    const aberto = sidebar.classList.contains("aberto");

    sidebar.classList.toggle("aberto", !aberto);
    overlay.classList.toggle("aberto", !aberto);
    botao.classList.toggle("ativo", !aberto);

    if (!aberto) atualizarLeaderboard();
}

function fecharLeaderboard() {
    document.getElementById("aba-leaderboard").classList.remove("aberto");
    document.getElementById("leaderboard-overlay").classList.remove("aberto");
    document.querySelector(".leaderboard-toggle-btn").classList.remove("ativo");
}   