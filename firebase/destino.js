// 🔹 Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
const db = getFirestore(app);

// 🔹 Conectar ao emulador se estiver em localhost
if (location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

// 🔹 Detecta usuário logado
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// 🔹 Define destino da página e coleção de posts
const pageDestino = document.body.dataset.destino || "geral";
const postsCollection = `posts_${pageDestino}`;

// 🔹 Elementos do DOM
const postBtn = document.getElementById("postBtn");
const postsDiv = document.getElementById("posts");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");

// 🔹 Criar post
postBtn?.addEventListener("click", async () => {
  if (!currentUser) return alert("Faça login para postar!");

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return alert("Preencha título e conteúdo!");

  try {
    await addDoc(collection(db, postsCollection), {
      title,
      content,
      author: currentUser.email,
      uid: currentUser.uid,
      created_at: serverTimestamp()
    });

    titleInput.value = "";
    contentInput.value = "";
  } catch (error) {
    console.error(error);
    alert("Erro ao criar post!");
  }
});

// 🔹 Renderizar posts e comentários
function renderPosts() {
  if (!postsDiv) return;

  const q = query(collection(db, postsCollection), orderBy("created_at", "desc"));
  onSnapshot(q, (snapshot) => {
    postsDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const post = doc.data();
      const postId = doc.id;

      const postEl = document.createElement("div");
      postEl.classList.add("post");

      postEl.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <small>Por ${post.author || "Anônimo"}</small>
        <div id="comments-${postId}"></div>
      `;

      const commentInput = document.createElement("textarea");
      commentInput.id = `commentInput-${postId}`;
      commentInput.placeholder = "Escreva um comentário...";
      postEl.appendChild(commentInput);

      const commentBtn = document.createElement("button");
      commentBtn.textContent = "Comentar";
      commentBtn.onclick = () => addComment(postId);
      postEl.appendChild(commentBtn);

      postsDiv.appendChild(postEl);

      loadComments(postId);
    });
  });
}
renderPosts();

// 🔹 Função para adicionar comentário
async function addComment(postId) {
  if (!currentUser) return alert("Faça login para comentar!");

  const input = document.getElementById(`commentInput-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, postsCollection, postId, "comments"), {
      text,
      author: currentUser.email,
      uid: currentUser.uid,
      created_at: serverTimestamp()
    });
    input.value = "";
  } catch (error) {
    console.error(error);
    alert("Erro ao adicionar comentário!");
  }
}

// 🔹 Função para carregar comentários
function loadComments(postId) {
  const commentsDiv = document.getElementById(`comments-${postId}`);
  if (!commentsDiv) return;

  const q = query(collection(db, postsCollection, postId, "comments"), orderBy("created_at", "asc"));
  onSnapshot(q, (snapshot) => {
    commentsDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const c = doc.data();
      const p = document.createElement("p");
      p.classList.add("comment");
      p.innerHTML = `<b>${c.author}:</b> ${c.text}`;
      commentsDiv.appendChild(p);
    });
  });
}
