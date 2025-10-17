// 🔹 Importações Firebase
import { auth } from "./config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const loginForm = document.getElementById("loginForm");

async function loginUsuario(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) {
    alert("Por favor, preencha email e senha.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    alert(`Login realizado com sucesso! Bem-vindo(a), ${userCredential.user.nome}`);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    alert("Erro ao fazer login: " + error.message);
  }
}

// 🔹 Vincular evento submit do formulário
loginForm?.addEventListener("submit", loginUsuario);
