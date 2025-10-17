// destino.js
import { dbFirestore, dbRealtime, auth } from "./config.js";
import { doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 🔹 Elementos do DOM
const titulo = document.getElementById("tituloDestino");
const tituloLink = document.getElementById("tituloLink");
const imagem = document.getElementById("imagemDestino");
const descricao = document.getElementById("descricaoDestino");
const pontosContainer = document.getElementById("pontosTuristicos");
const alimentacaoContainer = document.getElementById("alimentacao");
const transporteContainer = document.getElementById("transporte");
const postBtn = document.getElementById("postBtn");
const postsDiv = document.getElementById("posts");

const adminControls = document.getElementById("adminControls");
const editarBtn = document.getElementById("editarDestinoBtn");

let currentUser = null;

// 🔹 Função para pegar o ID da URL
function pegarId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const destinoId = pegarId();

// 🔹 Carrega os dados do Firestore
async function carregarDestino() {
  if (!destinoId) return;

  const docRef = doc(dbFirestore, "destinos", destinoId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    tituloLink.textContent = `${data.cidade} - ${data.pais}`;
    imagem.src = data.imagemURL || "placeholder.jpg";

    // 🔹 Introdução
    const introEl = document.getElementById("textoIntroducao");
    introEl.textContent = data.introducao || "Explore o destino e descubra tudo sobre ele.";

    // 🔹 Pontos Turísticos
    pontosContainer.innerHTML = "<h2>Pontos Turísticos</h2>";
    if (data.pontosTuristicos?.length) {
      data.pontosTuristicos.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("item-bloco");
        div.innerHTML = `
          <strong>${p.nome}</strong><br>
          ${p.preco ? `<em>Preço:</em> ${p.preco}<br>` : `<em>Gratuito</em><br>`}
          ${p.descricao ? `<span>${p.descricao}</span>` : ""}
          <hr>
        `;
        pontosContainer.appendChild(div);
      });
    } else {
      pontosContainer.innerHTML += "<p>Nenhum ponto turístico registrado.</p>";
    }

    // 🔹 Alimentação
    alimentacaoContainer.innerHTML = "<h2>Alimentação</h2>";
    if (data.alimentacao?.length) {
      data.alimentacao.forEach(a => {
        const div = document.createElement("div");
        div.classList.add("item-bloco");
        div.innerHTML = `
          <strong>${a.tipo}</strong><br>
          ${a.precoMedio ? `<em>Preço médio:</em> ${a.precoMedio}<br>` : ""}
          ${a.descricao ? `<span>${a.descricao}</span>` : ""}
          <hr>
        `;
        alimentacaoContainer.appendChild(div);
      });
    } else {
      alimentacaoContainer.innerHTML += "<p>Nenhuma informação de alimentação registrada.</p>";
    }

    // 🔹 Transporte
    transporteContainer.innerHTML = "<h2>Transporte</h2>";
    if (data.transporte?.length) {
      data.transporte.forEach(t => {
        const div = document.createElement("div");
        div.classList.add("item-bloco");
        div.innerHTML = `
          <strong>${t.meio}</strong><br>
          ${t.preco ? `<em>Preço:</em> ${t.preco}<br>` : ""}
          ${t.detalhes ? `<span>${t.detalhes}</span>` : ""}
          <hr>
        `;
        transporteContainer.appendChild(div);
      });
    } else {
      transporteContainer.innerHTML += "<p>Nenhuma opção de transporte registrada.</p>";
    }

  } else {
    titulo.textContent = "Destino não encontrado";
    descricao.textContent = "O destino que você procura não existe ou foi removido.";
  }
}

// 🔹 Conversão de moedas
window.converterMoeda = async function() {
  const valor = parseFloat(document.getElementById("valor").value);
  const de = document.getElementById("de").value;
  const para = document.getElementById("para").value;
  const resultadoEl = document.getElementById("resultado");

  if (isNaN(valor)) {
    resultadoEl.textContent = "Digite um valor válido!";
    return;
  }

  if (de === para) {
    resultadoEl.textContent = `Valor convertido: ${valor.toFixed(2)} ${para}`;
    return;
  }

  try {
    const res = await fetch(`https://api.exchangerate.host/convert?from=${de}&to=${para}&amount=${valor}`);
    const data = await res.json();
    resultadoEl.textContent = `Valor convertido: ${data.result.toFixed(2)} ${para}`;
  } catch (err) {
    resultadoEl.textContent = "Erro ao converter moeda.";
    console.error(err);
  }
};

// 🔹 Login / painel
onAuthStateChanged(auth, async (user) => {
  const loginBtn = document.getElementById("loginBtn");
  const painelBtn = document.getElementById("painelBtn");

  currentUser = user;

  if (user) {
    loginBtn.style.display = "none";
    painelBtn.style.display = "inline-block";

    // Listener em tempo real para o tipo do usuário
    const userRef = ref(dbRealtime, `usuarios/${user.uid}/tipo`);
    onValue(userRef, (snapshot) => {
      const tipo = snapshot.val();
      if (tipo === "admin" || tipo === "superAdmin") {
        adminControls.style.display = "block";
      } else {
        adminControls.style.display = "none";
      }
    }, (error) => {
      console.warn("Não foi possível ler o tipo do usuário:", error);
      adminControls.style.display = "none";
    });

  } else {
    loginBtn.style.display = "inline-block";
    painelBtn.style.display = "none";
    adminControls.style.display = "none";
  }
});

// Redireciona para edição do destino
editarBtn.addEventListener("click", () => {
  if (destinoId) {
    window.location.href = `../criar-destino.html?id=${destinoId}`;
  } else {
    alert("ID do destino não definido.");
  }
});

// 🔹 Funções para atualizar contagens no Realtime Database
async function incrementUserPosts(uid, increment = 1) {
  const userStatsRef = ref(dbRealtime, `usuarios/${uid}/stats`);
  const snap = await get(userStatsRef);
  const current = snap.exists() ? snap.val().posts || 0 : 0;
  await update(userStatsRef, { posts: current + increment });
}

async function decrementUserPosts(uid, decrement = 1) {
  const userStatsRef = ref(dbRealtime, `usuarios/${uid}/stats`);
  const snap = await get(userStatsRef);
  const current = snap.exists() ? snap.val().posts || 0 : 0;
  const newCount = Math.max(0, current - decrement);
  await update(userStatsRef, { posts: newCount });
}

async function incrementUserComments(uid, increment = 1) {
  const userStatsRef = ref(dbRealtime, `usuarios/${uid}/stats`);
  const snap = await get(userStatsRef);
  const current = snap.exists() ? snap.val().comments || 0 : 0;
  await update(userStatsRef, { comments: current + increment });
}

async function decrementUserComments(uid, decrement = 1) {
  const userStatsRef = ref(dbRealtime, `usuarios/${uid}/stats`);
  const snap = await get(userStatsRef);
  const current = snap.exists() ? snap.val().comments || 0 : 0;
  const newCount = Math.max(0, current - decrement);
  await update(userStatsRef, { comments: newCount });
}

// 🔹 Blog dos Viajantes com comentários
if (destinoId) {
  const postsCollection = `destinos/${destinoId}/posts`;

  // Publicar novo post
  postBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Faça login para publicar!");

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!title || !content) return alert("Preencha título e conteúdo!");

    try {
      await addDoc(collection(dbFirestore, postsCollection), {
        title,
        content,
        author: currentUser.email,
        uid: currentUser.uid,
        created_at: serverTimestamp()
      });

      await incrementUserPosts(currentUser.uid, +1);

      document.getElementById("title").value = "";
      document.getElementById("content").value = "";
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar post.");
    }
  });

  // Renderizar posts e comentários
  function renderPosts() {
    if (!postsDiv) return;

    const q = query(collection(dbFirestore, postsCollection), orderBy("created_at", "desc"));
    onSnapshot(q, (snapshot) => {
      postsDiv.innerHTML = "";

      snapshot.forEach(docSnap => {
        const post = docSnap.data();
        const postId = docSnap.id;

        const postEl = document.createElement("div");
        postEl.classList.add("post");

        postEl.innerHTML = `
          <h3>${post.title}</h3>
          <p>${post.content}</p>
          <small>Por ${post.author || "Anônimo"}</small>
          <div id="comments-${postId}" class="comments"></div>
        `;

        // 🔹 Campo de comentário (somente se logado)
        if (currentUser) {
          const commentInput = document.createElement("textarea");
          commentInput.id = `commentInput-${postId}`;
          commentInput.placeholder = "Escreva um comentário...";
          postEl.appendChild(commentInput);

          const commentBtn = document.createElement("button");
          commentBtn.textContent = "Comentar";
          commentBtn.onclick = () => addComment(postId);
          postEl.appendChild(commentBtn);
        }

        postsDiv.appendChild(postEl);
        loadComments(postId);
      });
    });
  }

  // 🔹 Adicionar comentário
  async function addComment(postId) {
    if (!currentUser) return alert("Faça login para comentar!");

    const input = document.getElementById(`commentInput-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    try {
      await addDoc(collection(dbFirestore, postsCollection, postId, "comments"), {
        text,
        author: currentUser.email,
        uid: currentUser.uid,
        created_at: serverTimestamp()
      });

      await incrementUserComments(currentUser.uid, +1);
      input.value = "";
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar comentário!");
    }
  }

  // 🔹 Excluir comentário
  async function deleteComment(postId, commentId, uid) {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;

    try {
      await deleteDoc(doc(dbFirestore, `destinos/${destinoId}/posts/${postId}/comments`, commentId));
      await decrementUserComments(uid, 1);
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      alert("Erro ao excluir comentário.");
    }
  }

  // 🔹 Carregar comentários
  function loadComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (!commentsDiv) return;

    const q = query(collection(dbFirestore, postsCollection, postId, "comments"), orderBy("created_at", "asc"));
    onSnapshot(q, (snapshot) => {
      commentsDiv.innerHTML = "";

      snapshot.forEach(docSnap => {
        const c = docSnap.data();
        const commentId = docSnap.id;

        const p = document.createElement("p");
        p.classList.add("comment");
        p.innerHTML = `<b>${c.author}:</b> ${c.text}`;

        // 🔹 Botão de exclusão (somente para o autor)
        if (currentUser && currentUser.uid === c.uid) {
          const delBtn = document.createElement("button");
          delBtn.textContent = "Excluir";
          delBtn.classList.add("delete-btn");
          delBtn.onclick = async () => await deleteComment(postId, commentId, c.uid);
          p.appendChild(delBtn);
        }

        commentsDiv.appendChild(p);
      });
    });
  }

  renderPosts();
}


// 🔹 Executa ao carregar a página
carregarDestino();
