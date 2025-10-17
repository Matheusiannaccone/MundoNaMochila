// firebase/config.js
// Importa módulos principais do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  connectAuthEmulator 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getDatabase, 
  connectDatabaseEmulator 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { 
  getFirestore, 
  connectFirestoreEmulator 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { 
  getStorage,
  connectStorageEmulator
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// 🔹 Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5QDVLvFD3pQNHctIZWLYhc5G5RdOEf08",
  authDomain: "mundo-na-mochila-89257.firebaseapp.com",
  projectId: "mundo-na-mochila-89257",
  storageBucket: "mundo-na-mochila-89257.firebasestorage.app",
  messagingSenderId: "172465630207",
  appId: "1:172465630207:web:1e47669ca76df6044cd5ca",
  measurementId: "G-YBKG3VSW9F",
  databaseURL: "https://mundo-na-mochila-89257-default-rtdb.firebaseio.com"
};

// 🔹 Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Inicializa os serviços
const auth = getAuth(app);
const dbRealtime = getDatabase(app);
const dbFirestore = getFirestore(app);
const dbStorage = getStorage(app);

// 🔹 Conecta aos emuladores se estiver em localhost
if (location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectDatabaseEmulator(dbRealtime, "localhost", 9000);
  connectFirestoreEmulator(dbFirestore, "localhost", 8080);
  connectStorageEmulator(dbStorage, "localhost", 9199);
}

// 🔹 Exporta tudo para ser usado em outros arquivos
export { app, auth, dbRealtime, dbFirestore, dbStorage };