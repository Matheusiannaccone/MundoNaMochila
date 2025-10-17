import { auth, dbFirestore } from "./config.js";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔹 Elementos do DOM
const form = document.getElementById("formDestino");
const mensagem = document.getElementById("mensagem");
const voltarBtn = document.getElementById("voltarBtn");
const imagemCapaInput = document.getElementById("imagemCapa");
const previewImagem = document.getElementById("previewImagem");
const introducaoInput = document.getElementById("introducao");

const pontosContainer = document.getElementById("pontosTuristicosContainer");
const alimentacaoContainer = document.getElementById("alimentacaoContainer");
const transporteContainer = document.getElementById("transporteContainer");

// 🔹 Capturar ID da URL (modo edição)
const urlParams = new URLSearchParams(window.location.search);
const destinoId = urlParams.get("id");
let modoEdicao = false;

if (destinoId) {
  modoEdicao = true;
  carregarDestinoParaEdicao(destinoId);
}

// 🔹 Pré-visualização da imagem
imagemCapaInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImagem.src = e.target.result;
      previewImagem.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewImagem.src = "";
    previewImagem.style.display = "none";
  }
});

// 🔹 Botão voltar
voltarBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// 🔹 Funções para adicionar campos dinâmicos
document.getElementById("addPontoTuristico").addEventListener("click", () => {
  const div = document.createElement("div");
  div.classList.add("subform");
  div.innerHTML = `
    <input type="text" placeholder="Nome do ponto turístico" class="ponto-nome" required>
    <input type="text" placeholder="Preço/Entrada (ex: R$50)" class="ponto-preco">
    <textarea placeholder="Descrição" class="ponto-descricao" rows="2"></textarea>
  `;
  pontosContainer.appendChild(div);
});

document.getElementById("addAlimentacao").addEventListener("click", () => {
  const div = document.createElement("div");
  div.classList.add("subform");
  div.innerHTML = `
    <input type="text" placeholder="Tipo de alimentação (ex: Restaurante local)" class="ali-tipo" required>
    <input type="text" placeholder="Preço médio (ex: R$40)" class="ali-preco">
  `;
  alimentacaoContainer.appendChild(div);
});

document.getElementById("addTransporte").addEventListener("click", () => {
  const div = document.createElement("div");
  div.classList.add("subform");
  div.innerHTML = `
    <input type="text" placeholder="Meio de transporte (ex: Metrô)" class="transp-meio" required>
    <input type="text" placeholder="Preço (ex: R$6,50)" class="transp-preco">
  `;
  transporteContainer.appendChild(div);
});

// 🔹 Carregar destino para edição
async function carregarDestinoParaEdicao(id) {
  const docRef = doc(dbFirestore, "destinos", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    // Campos principais
    document.getElementById("cidade").value = data.cidade || "";
    document.getElementById("pais").value = data.pais || "";
    document.getElementById("moeda").value = data.moeda || "";
    introducaoInput.value = data.introducao || "";

    // Pré-visualizar imagem
    if (data.imagemURL) {
      previewImagem.src = data.imagemURL;
      previewImagem.style.display = "block";
    }

    // Subcoleções
    preencherSubform(pontosContainer, data.pontosTuristicos, "ponto");
    preencherSubform(alimentacaoContainer, data.alimentacao, "ali");
    preencherSubform(transporteContainer, data.transporte, "transp");
  } else {
    mensagem.textContent = "Destino não encontrado para edição!";
    mensagem.className = "error";
    mensagem.style.display = "block";
  }
}

// 🔹 Função auxiliar para preencher subformulários
function preencherSubform(container, itens = [], tipo) {
  container.innerHTML = "";
  itens.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("subform");

    if (tipo === "ponto") {
      div.innerHTML = `
        <input type="text" placeholder="Nome do ponto turístico" class="ponto-nome" required value="${item.nome || ""}">
        <input type="text" placeholder="Preço/Entrada (ex: R$50)" class="ponto-preco" value="${item.preco || ""}">
        <textarea placeholder="Descrição" class="ponto-descricao" rows="2">${item.descricao || ""}</textarea>
      `;
    } else if (tipo === "ali") {
      div.innerHTML = `
        <input type="text" placeholder="Tipo de alimentação (ex: Restaurante local)" class="ali-tipo" required value="${item.tipo || ""}">
        <input type="text" placeholder="Preço médio (ex: R$40)" class="ali-preco" value="${item.precoMedio || ""}">
      `;
    } else if (tipo === "transp") {
      div.innerHTML = `
        <input type="text" placeholder="Meio de transporte (ex: Metrô)" class="transp-meio" required value="${item.meio || ""}">
        <input type="text" placeholder="Preço (ex: R$6,50)" class="transp-preco" value="${item.preco || ""}">
      `;
    }

    container.appendChild(div);
  });
}

// 🔹 Salvando ou atualizando no Firestore
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cidade = document.getElementById("cidade").value.trim();
  const pais = document.getElementById("pais").value.trim();
  const moeda = document.getElementById("moeda").value.trim();
  const introducao = introducaoInput.value.trim();

  const pontosTuristicos = Array.from(document.querySelectorAll(".ponto-nome")).map((el, i) => ({
    nome: el.value,
    preco: document.querySelectorAll(".ponto-preco")[i].value,
    descricao: document.querySelectorAll(".ponto-descricao")[i].value,
  }));

  const alimentacao = Array.from(document.querySelectorAll(".ali-tipo")).map((el, i) => ({
    tipo: el.value,
    precoMedio: document.querySelectorAll(".ali-preco")[i].value,
  }));

  const transporte = Array.from(document.querySelectorAll(".transp-meio")).map((el, i) => ({
    meio: el.value,
    preco: document.querySelectorAll(".transp-preco")[i].value,
  }));

  const imagemURL = previewImagem.src || "";

  try {
    if (modoEdicao) {
      const docRef = doc(dbFirestore, "destinos", destinoId);
      await updateDoc(docRef, {
        cidade,
        pais,
        moeda,
        introducao,
        imagemURL,
        pontosTuristicos,
        alimentacao,
        transporte,
        atualizadoEm: serverTimestamp(),
      });
      mensagem.textContent = "Destino atualizado com sucesso!";
    } else {
      await addDoc(collection(dbFirestore, "destinos"), {
        cidade,
        pais,
        moeda,
        introducao,
        imagemURL,
        pontosTuristicos,
        alimentacao,
        transporte,
        criadoEm: serverTimestamp(),
        uid: auth.currentUser.uid
      });
      mensagem.textContent = "Destino salvo com sucesso!";
    }

    mensagem.className = "success";
    mensagem.style.display = "block";
    mensagem.style.opacity = "1";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (error) {
    mensagem.textContent = `Erro ao salvar destino: ${error.code || error.message}`;
    mensagem.className = "error";
    mensagem.style.display = "block";
    console.error(error);
  }
});