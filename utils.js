function abreviar(n) {
    if (n >= 1e12) return Math.floor(n / 1e11) / 10 + "T";
    if (n >= 1e9)  return Math.floor(n / 1e8)  / 10 + "B";
    if (n >= 1e6)  return Math.floor(n / 1e5)  / 10 + "M";
    if (n >= 1e3)  return Math.floor(n / 1e2)  / 10 + "K";
    return Math.floor(n).toString();
}

function mostrarAviso(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("custom-toast");
    if (!toast) return;
    toast.textContent = mensagem;
    toast.className = `toast-aviso ${tipo} mostrar`;
    setTimeout(() => toast.classList.remove("mostrar"), 3500);
}

function fecharModal() {
    const modal = document.getElementById("custom-modal");
    if (modal) modal.style.display = "none";
}

function salvarNoNavegador() {
    localStorage.setItem("save_clicker_game", JSON.stringify(estatisticas));
}