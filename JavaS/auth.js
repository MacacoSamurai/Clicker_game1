async function iniciarJogo() {
    const emailInput = document.getElementById("nick-input").value.trim();
    const senhaInput = document.getElementById("senha-input").value.trim();

    if (emailInput.length < 5 || !emailInput.includes("@")) {
        mostrarAviso("Digite um email válido!", "erro"); return;
    }
    if (senhaInput.length < 6) {
        mostrarAviso("A senha precisa de pelo menos 6 caracteres!", "erro"); return;
    }

    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: emailInput,
        password: senhaInput
    });

    if (!loginError && loginData.user) {
        await puxarDadosDoSupabase(loginData.user.id);
        return;
    }

    const msgErro = loginError?.message?.toLowerCase() || "";
    if (msgErro.includes("invalid") || msgErro.includes("not found")) {
        document.getElementById("modal-mensagem").textContent = 
            `Email ou senha incorretos. Deseja criar uma nova conta?`;
        document.getElementById("custom-modal").style.display = "flex";

        document.getElementById("btn-modal-confirmar").onclick = async () => {
            fecharModal();
            await criarContaNova(emailInput, senhaInput);
        };
    } else {
        mostrarAviso("Erro ao conectar: " + (loginError?.message || "Tente novamente."), "erro");
    }
}

async function criarContaNova(email, senha) {
    const nick = await obterNicknameViaModal();
    if (!nick) return;

    const nickLimpo = nick.trim().replace(/[^a-zA-Z0-9_ ]/g, '').substring(0, 20);
    if (nickLimpo.length < 3) {
        mostrarAviso("Nickname inválido! Mínimo 3 caracteres.", "erro"); return;
    }

    const { data: nickExiste } = await supabaseClient
        .from('jogadores')
        .select('nickname')
        .eq('nickname', nickLimpo)
        .maybeSingle();

    if (nickExiste) {
        mostrarAviso("Este nickname já está em uso!", "erro"); return;
    }

    const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
        email: email,
        password: senha
    });

    if (signupError) {
        mostrarAviso("Erro ao criar conta: " + signupError.message, "erro"); return;
    }

    const userId = signupData.user.id;

    const { error: insertError } = await supabaseClient
        .from('jogadores')
        .insert({
            user_id: userId,
            nickname: nickLimpo,
            val: 0, inc: 1, mul: 1, auto: 0, total: 0,
            upgrades: estatisticas.upgrades,
            autos: estatisticas.autos,
            multi: estatisticas.multi
        });

    if (insertError) {
        mostrarAviso("Erro ao salvar conta: " + insertError.message, "erro"); return;
    }

    estatisticas.nome = nickLimpo;
    estatisticas.userId = userId;
    salvarNoNavegador();
    mostrarTelaJogo();
    mostrarAviso(`Conta criada com sucesso! Bem-vindo, ${nickLimpo}!`, "sucesso");
}

function obterNicknameViaModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById("custom-modal");
        const mensagem = document.getElementById("modal-mensagem");
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Digite seu Nickname (3-20 caracteres)";
        input.style.padding = "8px";
        input.style.marginTop = "10px";
        input.style.width = "80%";

        mensagem.textContent = "Escolha seu Nickname:";
        mensagem.appendChild(input);

        document.getElementById("btn-modal-confirmar").onclick = () => {
            fecharModal();
            resolve(input.value);
            input.remove();
        };

        document.querySelector(".btn-cancelar").onclick = () => {
            fecharModal();
            resolve(null);
            input.remove();
        };

        modal.style.display = "flex";
        input.focus();
    });
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        localStorage.removeItem("save_clicker_game");
        location.reload();
    } catch (err) {
        console.error("Erro ao fazer logout:", err);
        location.reload();
    }
}