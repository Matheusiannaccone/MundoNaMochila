// 🔹 Importações Firebase
import { dbRealtime, auth } from "./config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const cadastroForm = document.getElementById("cadastroForm");

// 🔹 Função de cadastro
async function cadastrarUsuario(event) {
    event.preventDefault();

    // 🔹 Obter valores do formulário
    const nome = document.getElementById('nome').value;
    const sobrenome = document.getElementById('sobrenome').value;
    const pais = document.getElementById('pais').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const termos = document.getElementById('termos').checked;
    const newsletter = document.getElementById('newsletter').checked;

    if (!nome || !sobrenome|| !pais || !email || !senha) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    if (!termos) {
        alert("Você deve aceitar os termos e condições.");
        return;
    }

    try {
        // 🔹 Criar usuário no Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const userID = userCredential.user.uid;

        // 🔹 Salvar dados no Realtime Database
        await set(ref(dbRealtime, "usuarios/" + userID), {
            nome: nome,
            sobrenome: sobrenome,
            pais: pais,
            email: email,
            termos: termos,
            newsletter: newsletter,
            tipo: "usuarioPadrao",
            create_at: new Date().toISOString()
        });

        console.log("Usuário cadastrado com sucesso!");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
    } catch (error) {
        console.error("Erro:", error.message);
    }
}

cadastroForm?.addEventListener("submit", cadastrarUsuario);