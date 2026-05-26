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
    const erroContaNaoExiste =
        msgErro.includes("invalid login credentials") ||
        msgErro.includes("invalid_credentials") ||
        msgErro.includes("user not found") ||
        msgErro.includes("no user found");

    if (erroContaNaoExiste) {
        // Pergunta se deseja criar uma nova conta
        document.getElementById("modal-mensagem").textContent =
            `Email ou senha incorretos. Se você não possui uma conta, deseja criar uma nova?`;
        const modal = document.getElementById("custom-modal");
        if (modal) modal.style.display = "flex";

        document.getElementById("btn-modal-confirmar").onclick = async function() {
            fecharModal();
            await criarContaNova(emailInput, senhaInput);
        };
    } else {
        mostrarAviso("Erro ao conectar: " + (loginError?.message || "Tente novamente."), "erro");
    }
}

async function criarContaNova(email, senha) {
    // Substitui o prompt() por um modal customizado para melhor experiência em mobile
    const nick = await obterNicknameViaModal();
    if (!nick) return;

    const { data: nickExiste } = await supabaseClient
        .from('jogadores')
        .select('nickname')
        .eq('nickname', nick.trim())
        .maybeSingle();

    if (nickExiste) {
        mostrarAviso("Este nickname já está em uso! Escolha outro.", "erro"); return;
    }

    const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
        email: email,
        password: senha
    });

    if (signupError) { mostrarAviso("Erro ao criar conta: " + signupError.message, "erro"); return; }

    const userId = signupData.user.id;

    const { error: insertError } = await supabaseClient
        .from('jogadores')
        .insert({
            user_id:  userId,
            nickname: nick.trim(),
            val: 0, inc: 1, mul: 1, auto: 0, total: 0,
            upgrades: estatisticas.upgrades,
            autos:    estatisticas.autos,
            multi:    estatisticas.multi
        });

    if (insertError) { mostrarAviso("Erro ao salvar conta: " + insertError.message, "erro"); return; }

    estatisticas.nome   = nick.trim();
    estatisticas.userId = userId;
    salvarNoNavegador();
    mostrarTelaJogo();
    mostrarAviso("Conta criada com sucesso! Bem-vindo, " + nick.trim() + "!", "sucesso");
}

// Função auxiliar para obter nickname via modal
function obterNicknameViaModal() {
    return new Promise((resolve) => {
        // Reutiliza o modal existente
        const modal = document.getElementById("custom-modal");
        const mensagem = document.getElementById("modal-mensagem");
        const btnConfirmar = document.getElementById("btn-modal-confirmar");
        const btnCancelar = document.querySelector(".btn-cancelar");

        // Cria um campo de input para o nickname
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Digite seu Nickname (mínimo 3 letras)";
        input.style.padding = "8px";
        input.style.marginTop = "10px";
        input.style.width = "80%";
        input.style.borderRadius = "5px";
        input.style.border = "none";

        // Adiciona ao modal
        mensagem.textContent = "Escolha seu Nickname (mínimo 3 letras):";
        mensagem.appendChild(input);

        // Define as ações dos botões
        btnConfirmar.onclick = function() {
            const nick = input.value.trim();
            if (nick.length < 3) {
                mostrarAviso("Nickname inválido! Mínimo 3 caracteres.", "erro");
                return;
            }
            fecharModal();
            // Remove o input para não poluir o modal
            input.remove();
            resolve(nick);
        };

        btnCancelar.onclick = function() {
            fecharModal();
            input.remove();
            resolve(null);
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