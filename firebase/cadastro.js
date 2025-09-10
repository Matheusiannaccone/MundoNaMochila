// 🔹 Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set, connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🔹 Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5QDVLvFD3pQNHctIZWLYhc5G5RdOEf08",
  authDomain: "mundo-na-mochila-89257.firebaseapp.com",
  databaseURL: "https://mundo-na-mochila-89257-default-rtdb.firebaseio.com",
  projectId: "mundo-na-mochila-89257",
  storageBucket: "mundo-na-mochila-89257.firebasestorage.app",
  messagingSenderId: "172465630207",
  appId: "1:172465630207:web:1e47669ca76df6044cd5ca",
  measurementId: "G-YBKG3VSW9F"
};

// 🔹 Inicialização Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 🔹 Conectar ao emulador se estiver em localhost
if(location.hostname === "localhost"){
    connectAuthEmulator(auth, "http://localhost:9099");
    connectDatabaseEmulator(db, "localhost", 9000);
}

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
        alert("Por favor, preencha todos os campos.");
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
        await set(ref(db, "usuarios/" + userID), {
            nome: nome,
            sobrenome: sobrenome,
            pais: pais,
            email: email,
            termos: termos,
            newsletter: newsletter
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