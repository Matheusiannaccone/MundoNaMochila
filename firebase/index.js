// header.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔹 Conectar ao emulador se estiver em localhost
if (location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
}

// 🔹 Elementos do DOM
const loginLink = document.querySelector(".login-btn");
const filtroBtn = document.querySelector(".filtro-btn");
const filtroOpcoes = document.querySelector(".filtro-opcoes");
const checkboxes = document.querySelectorAll(".filtro-opcoes input[type='checkbox']");
const destinos = document.querySelectorAll(".destino");

// 🔹 Login / Logout
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Só cria o botão se ainda não existir
    if (!document.querySelector(".logout-btn")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Logout";
      logoutBtn.classList.add("logout-btn"); // diferente de login-btn
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        // Troca de volta para link de login
        logoutBtn.replaceWith(loginLink);
      });

      loginLink.replaceWith(logoutBtn);
    }
  } else {
    // Garante que sempre tenha o link de login
    if (!document.querySelector(".login-btn")) {
      document.querySelector(".logout-btn")?.replaceWith(loginLink);
    }
  }
});

// 🔹 Filtro de destinos
filtroBtn.addEventListener("click", () => {
  filtroOpcoes.classList.toggle("ativo");
});

checkboxes.forEach(cb => {
  cb.addEventListener("change", () => {
    const selecionados = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    destinos.forEach(destino => {
      const pais = destino.getAttribute("data-pais");
      destino.style.display = (selecionados.length === 0 || selecionados.includes(pais)) ? "block" : "none";
    });
  });
});

// Fecha dropdown ao clicar fora
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filtro-container")) {
    filtroOpcoes.classList.remove("ativo");
  }
});

// 🔹 Elementos do painel
const painelBtn = document.getElementById("painelBtn");
const loginBtn = document.getElementById("loginBtn");

// 🔹 Atualizar onAuthStateChanged para mostrar/esconder painel
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário logado
    if (painelBtn) painelBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "none";
    
    // Só cria o botão de logout se ainda não existir
    if (!document.querySelector(".logout-btn")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Logout";
      logoutBtn.classList.add("logout-btn");
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        // Restaurar estado original
        if (painelBtn) painelBtn.style.display = "none";
        if (loginBtn) loginBtn.style.display = "inline-block";
        logoutBtn.remove();
      });

      // Adicionar após o painel btn
      if (painelBtn && painelBtn.parentNode) {
        painelBtn.parentNode.appendChild(logoutBtn);
      }
    }
  } else {
    // Usuário não logado
    if (painelBtn) painelBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
    
    // Remover botão de logout se existir
    const existingLogoutBtn = document.querySelector(".logout-btn");
    if (existingLogoutBtn) {
      existingLogoutBtn.remove();
    }
  }
});
