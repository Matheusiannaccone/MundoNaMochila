import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  connectAuthEmulator 
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { 
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  connectFirestoreEmulator,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";


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

// 🔹 Conecta no emulador se estiver em localhost
if(location.hostname === "localhost"){
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);
}

// 🔹 Elementos HTML
const registerForm = document.querySelector("form"); // formulário de cadastro
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const postBtn = document.getElementById("postBtn");
const postsDiv = document.getElementById("posts");

let currentUser = null;

// 🔹 Cadastro com email/senha
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Pega valores do formulário
  const nome = document.getElementById("nome").value.trim();
  const sobrenome = document.getElementById("sobrenome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  const pais = document.getElementById("pais").value;

  if (!nome || !sobrenome || !email || !senha || !pais) {
    return alert("Por favor, preencha todos os campos obrigatórios!");
  }

  try{
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    currentUser = userCredential.user;

    await setDoc(doc(db,"users", currentUser.uid),{
      uid: currentUser.uid,
      nome,
      sobrenome,
      email,
      pais,
      created_at: serverTimestamp()
    });

    console.log("Documento salvo no Firestore:", currentUser.uid);

  alert(`Cadastro realizado com sucesso! Bem-vindo(a), ${nome}`);
  window.location.href = "index.html";
}catch(error){
  console.error("Erro no cadastro:", error);
  alert(error.message);
}
});

// 🔹 Login com email/senha
const loginForm = document.getElementById("loginForm");
if(loginForm){
  loginForm.addEventListener("submit", async (e) =>{
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");

    if(!emailInput || !senhaInput){
      return alert("Campos de login não encontrados!");
    }

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if(!email || !senha) return alert("Preencha email e senha");

    try{
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      currentUser = userCredential.user;

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let nome = currentUser.email;
      if(userDocSnap.exists()){
        nome = userDocSnap.data().nome || nome;
      }

      alert(`Login realizado com sucesso! Bem-vindo(a), ${currentUser.email}`);
      window.location.href = "index.html";
    }catch (error){
      console.error(error);
      alert(`Erro ao fazer login: ${error.message}`);
    }
  });
}

// 🔹 Logout
logoutBtn?.addEventListener("click", () => signOut(auth));

// 🔹 Detecta usuário logado
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    console.log("Usuário logado:", user.email);
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline";
  } else {
    console.log("Nenhum usuário logado");
    if (loginBtn) loginBtn.style.display = "inline";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// 🔹 Criar post
postBtn?.addEventListener("click", async () => {
  if (!currentUser) return alert("Faça login para postar!");
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!title || !content) return alert("Preencha título e conteúdo!");

  try {
    await addDoc(collection(db, "posts"), {
      title,
      content,
      author: currentUser.email,
      uid: currentUser.uid,
    });

    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
  } catch (error) {
    console.error(error);
    alert("Erro ao criar post!");
  }
});

// 🔹 Renderizar posts e comentários
function renderPosts() {
  const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
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

// 🔹 Adicionar comentário
async function addComment(postId) {
  if (!currentUser) return alert("Faça login para comentar!");
  const input = document.getElementById(`commentInput-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "posts", postId, "comments"), {
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

// 🔹 Carregar comentários
function loadComments(postId) {
  const q = query(collection(db, "posts", postId, "comments"), orderBy("created_at", "asc"));
  const commentsDiv = document.getElementById(`comments-${postId}`);

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
