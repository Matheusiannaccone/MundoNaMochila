// 🔹 Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 🔹 Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5QDVLvFD3pQNHctIZWLYhc5G5RdOEf08",
  authDomain: "mundo-na-mochila-89257.firebaseapp.com",
  projectId: "mundo-na-mochila-89257",
  storageBucket: "mundo-na-mochila-89257.firebasestorage.app",
  messagingSenderId: "172465630207",
  appId: "1:172465630207:web:1e47669ca76df6044cd5ca",
  measurementId: "G-YBKG3VSW9F"
};

// 🔹 Inicialização Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔹 Conectar ao emulador se estiver em localhost
if (location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
}

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
