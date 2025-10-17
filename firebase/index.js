import { auth, dbFirestore } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { verificarUsuario } from "./verificar-usuario.js";

// Elementos do DOM
const painelBtn = document.getElementById("painelBtn");
const loginBtn = document.getElementById("loginBtn");
const filtroBtn = document.querySelector(".filtro-btn");
const filtroOpcoes = document.querySelector(".filtro-opcoes");
const destinosContainer = document.querySelector(".conteudo");

// 🔹 Observa autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const tipo = await verificarUsuario();
    painelBtn.style.display = "inline-block";
    loginBtn.style.display = "none";

    if (tipo === "admin" || tipo === "superAdmin") {
      if (!document.getElementById("criarPaginaBtn")) {
        const criarPaginaBtn = document.createElement("button");
        criarPaginaBtn.id = "criarPaginaBtn";
        criarPaginaBtn.textContent = "Criar nova página de destino";
        criarPaginaBtn.addEventListener("click", () => {
          window.location.href = "criar-destino.html";
        });
        destinosContainer.prepend(criarPaginaBtn);
      }
    }
  } else {
    painelBtn.style.display = "none";
    loginBtn.style.display = "inline-block";
    document.getElementById("criarPaginaBtn")?.remove();
  }
});

// 🔹 Carregar destinos do Firestore
async function carregarDestinos() {
  destinosContainer.innerHTML = ""; // limpa conteúdo

  const destinosRef = collection(dbFirestore, "destinos");
  const q = query(destinosRef, orderBy("criadoEm", "desc"));
  const snapshot = await getDocs(q);

  // Armazena os países para filtro
  const paisesSet = new Set();

  snapshot.forEach(doc => {
    const data = doc.data();
    paisesSet.add(data.pais);

    const div = document.createElement("div");
    div.classList.add("destino");
    div.setAttribute("data-pais", data.pais);

    div.addEventListener("click", () => {
      window.location.href = `destino.html?id=${doc.id}`;
    });

    div.innerHTML = `
      ${data.imagemURL ? `<img src="${data.imagemURL}" alt="${data.cidade}" />` : ""}
      <h2>${data.cidade} - ${data.pais}</h2>
      <p>${data.introducao || "Conheça este incrível destino!"}</p>
    `;

    destinosContainer.appendChild(div);
  });

  // Preencher opções do filtro
  filtroOpcoes.innerHTML = "";
  paisesSet.forEach(pais => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${pais}"> ${pais}`;
    filtroOpcoes.appendChild(label);
  });

  // Reaplicar eventos do filtro
  const checkboxes = filtroOpcoes.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selecionados = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      document.querySelectorAll(".destino").forEach(destino => {
        const pais = destino.getAttribute("data-pais");
        destino.style.display =
          selecionados.length === 0 || selecionados.includes(pais)
            ? "block"
            : "none";
      });
    });
  });
}

// 🔹 Botão de filtro
filtroBtn.addEventListener("click", () => {
  filtroOpcoes.classList.toggle("ativo");
});

// Fecha dropdown ao clicar fora
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filtro-container")) {
    filtroOpcoes.classList.remove("ativo");
  }
});

// Chama função para carregar destinos
carregarDestinos();