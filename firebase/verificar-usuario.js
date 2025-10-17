import { auth, dbRealtime } from "./config.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

export async function verificarUsuario() {
  const user = auth.currentUser;
  if (!user) return "Desconhecido";

  const userRef = ref(dbRealtime, `usuarios/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    await set(userRef, { email: user.email, tipo: "usuarioPadrao" });
    console.log("Usuário logado:", "usuarioPadrao");
    return "usuarioPadrao"; // ✅ Retornar valor
  }

  const dados = snapshot.val();
  console.log("Usuário logado:", dados.tipo);
  return dados.tipo || "usuarioPadrao";
}
