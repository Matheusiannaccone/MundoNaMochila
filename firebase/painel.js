// painel.js
import { auth, dbRealtime } from './config.js';
import { 
    onAuthStateChanged,
    signOut,
    updateEmail,
    updatePassword, 
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
    ref,
    get,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Elementos do DOM
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const painelForm = document.getElementById('painelForm');
const welcomeText = document.getElementById('welcomeText');
const accountStats = document.getElementById('accountStats');
const successMessage = document.getElementById('successMessage');
const errorUpdateMessage = document.getElementById('errorUpdateMessage');
const logoutBtn = document.getElementById('logoutBtn');

// Inputs do formulário
const nomeInput = document.getElementById('nome');
const sobrenomeInput = document.getElementById('sobrenome');
const paisInput = document.getElementById('pais');
const emailInput = document.getElementById('email');
const newsletterInput = document.getElementById('newsletter');
const senhaAtualInput = document.getElementById('senhaAtual');
const novaSenhaInput = document.getElementById('novaSenha');
const confirmarSenhaInput = document.getElementById('confirmarSenha');
const saveBtn = document.getElementById('saveBtn');

// Variáveis globais
let currentUser = null;
let originalData = {};

// Verificar autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        welcomeText.textContent = `Olá, ${user.email}!`;
        await loadUserData();
        await loadAccountStats();
        renderAdminButton();
    } else {
        // Redirecionar para login se não autenticado
        window.location.href = "login.html";
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error('Erro no logout:', error);
        showMessage('Erro ao fazer logout', 'error');
    }
});

// Carregar dados do usuário
async function loadUserData() {
    try {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
        painelForm.style.display = 'none';
        
        const userRef = ref(dbRealtime, `usuarios/${currentUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            originalData = { ...userData };
            
            // Preencher formulário com dados existentes
            nomeInput.value = userData.nome || '';
            sobrenomeInput.value = userData.sobrenome || '';
            paisInput.value = userData.pais || '';
            emailInput.value = userData.email || currentUser.email;
            newsletterInput.checked = userData.newsletter || false;
            
            // Limpar campos de senha
            senhaAtualInput.value = '';
            novaSenhaInput.value = '';
            confirmarSenhaInput.value = '';
            
        } else {
            // Usuário não tem dados no Realtime Database, usar dados do Auth
            emailInput.value = currentUser.email;
            originalData = { email: currentUser.email };
        }
        
        loadingIndicator.style.display = 'none';
        painelForm.style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'block';
    }
}

// Carregar estatísticas da conta
async function loadAccountStats() {
  try {
    // Data de criação da conta
    const memberSince = currentUser.metadata.creationTime;
    document.getElementById('memberSince').textContent = 
      new Date(memberSince).toLocaleDateString('pt-BR');

    // Referência para estatísticas do usuário no Realtime Database
    const userStatsRef = ref(dbRealtime, `usuarios/${currentUser.uid}/stats`);
    const snapshot = await get(userStatsRef);

    let totalPosts = 0;
    let totalComments = 0;

    if (snapshot.exists()) {
      const stats = snapshot.val();
      totalPosts = stats.posts || 0;
      totalComments = stats.comments || 0;
    }

    // Atualiza o painel
    document.getElementById('postsCount').textContent = totalPosts;
    document.getElementById('commentsCount').textContent = totalComments;

    accountStats.style.display = 'block';

  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// Salvar alterações
painelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 Salvando...';
        
        // Validar dados
        const nome = nomeInput.value.trim();
        const sobrenome = sobrenomeInput.value.trim();
        const pais = paisInput.value;
        const email = emailInput.value.trim();
        const newsletter = newsletterInput.checked;
        const senhaAtual = senhaAtualInput.value;
        const novaSenha = novaSenhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;
        
        if (!nome || !sobrenome || !pais || !email) {
            throw new Error('Preencha todos os campos obrigatórios');
        }
        
        // Validações
        if (!nome || !sobrenome || !pais || !email)
            throw new Error('Preencha todos os campos obrigatórios');

        if ((novaSenha || confirmarSenha) && !senhaAtual)
            throw new Error('Digite sua senha atual para alterar a senha');

        if (novaSenha !== confirmarSenha)
            throw new Error('As novas senhas não coincidem');

        if (novaSenha && novaSenha.length < 6)
            throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        
        
        // Atualizar email se mudou
        if (email !== currentUser.email) {
            if (!senhaAtual) {
                throw new Error('Digite sua senha atual para alterar o email');
            }
            
            // Reautenticar usuário
            const credential = EmailAuthProvider.credential(currentUser.email, senhaAtual);
            await reauthenticateWithCredential(currentUser, credential);
            
            // Atualizar email
            await updateEmail(currentUser, email);
        }
        
        // Atualizar senha se fornecida
        if (novaSenha) {
            // Se não reautenticou ainda (por causa do email), reautenticar agora
            if (email === currentUser.email) {
                const credential = EmailAuthProvider.credential(currentUser.email, senhaAtual);
                await reauthenticateWithCredential(currentUser, credential);
            }
            
            await updatePassword(currentUser, novaSenha);
        }
        
        // Atualizar dados no Realtime Database
        const userData = {
            nome,
            sobrenome,
            pais,
            email,
            newsletter,
            termos: "true",
            tipo: originalData.tipo,
            updated_at: new Date().toISOString()
        };
        
        await set(ref(dbRealtime, `usuarios/${currentUser.uid}`), userData);
        
        // Limpar campos de senha
        senhaAtualInput.value = '';
        novaSenhaInput.value = '';
        confirmarSenhaInput.value = '';
        
        showMessage('Alterações salvas com sucesso!', 'success');
        
        // Atualizar dados originais
        originalData = { ...userData };
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showMessage(error.message || 'Erro ao salvar alterações', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Salvar Alterações';
    }
});

// Função para mostrar mensagens
function showMessage(text, type) {
    const messageElement = type === 'success' ? successMessage : errorUpdateMessage;
    const otherElement = type === 'success' ? errorUpdateMessage : successMessage;
    
    // Esconder a outra mensagem
    otherElement.style.display = 'none';
    
    // Mostrar mensagem atual
    messageElement.querySelector('p').textContent = text;
    messageElement.style.display = 'block';
    
    // Auto-esconder após 5 segundos
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Confirmar exclusão de conta
window.confirmDeleteAccount = function() {
    const confirmed = confirm(
        '⚠️ ATENÇÃO: Esta ação é irreversível!\n\n' +
        'Ao excluir sua conta:\n' +
        '• Todos os seus dados serão apagados permanentemente\n' +
        '• Seus posts e comentários serão removidos\n' +
        '• Você perderá acesso a todas as funcionalidades\n\n' +
        'Tem certeza que deseja continuar?'
    );
    
    if (confirmed) {
        const doubleConfirm = prompt('Para confirmar, digite "EXCLUIR" (em maiúsculas):');
        if (doubleConfirm === 'EXCLUIR')
            deleteUserAccount();
        else
            alert('Exclusão cancelada. Texto não confere.');
    }
};

// Excluir conta do usuário
async function deleteUserAccount() {
    try {
        saveBtn.disabled = true;
        
        // Pedir senha para reautenticação
        const password = prompt('Digite sua senha para confirmar a exclusão:');
        if (!password)
            throw new Error('Senha necessária para exclusão');
        
        // Reautenticar
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Remover dados do Realtime Database
        await remove(ref(dbRealtime, `usuarios/${currentUser.uid}`));
        
        // Remover posts do usuário (seria ideal ter uma cloud function para isso)
        // Por agora, apenas deletamos o usuário do Auth
        
        // Deletar conta do Authentication
        await deleteUser(currentUser);
        
        alert('Conta excluída com sucesso. Você será redirecionado para a página inicial.');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        
        let errorMsg = 'Erro ao excluir conta';
        if (error.code === 'auth/wrong-password') {
            errorMsg = 'Senha incorreta';
        } else if (error.code === 'auth/requires-recent-login') {
            errorMsg = 'Por segurança, faça login novamente antes de excluir a conta';
        }
        
        showMessage(errorMsg, 'error');
    } finally {
        saveBtn.disabled = false;
    }
}

// Função global para recarregar dados (usada no botão Cancelar)
window.loadUserData = loadUserData;

// Validação em tempo real dos campos de senha
novaSenhaInput.addEventListener('input', validatePasswords);
confirmarSenhaInput.addEventListener('input', validatePasswords);

function validatePasswords() {
    const novaSenha = novaSenhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    
    // Reset styles
    novaSenhaInput.style.borderColor = '';
    confirmarSenhaInput.style.borderColor = '';
    
    if (novaSenha && novaSenha.length < 6) {
        novaSenhaInput.style.borderColor = '#f44336';
    }
    
    if (confirmarSenha && novaSenha !== confirmarSenha) {
        confirmarSenhaInput.style.borderColor = '#f44336';
    } else if (confirmarSenha && novaSenha === confirmarSenha) {
        confirmarSenhaInput.style.borderColor = '#4caf50';
    }
}

// Detectar mudanças não salvas
function hasUnsavedChanges() {
    if (!originalData || !currentUser) return false;
    
    const currentData = {
        nome: nomeInput.value.trim(),
        sobrenome: sobrenomeInput.value.trim(),
        pais: paisInput.value,
        email: emailInput.value.trim(),
        newsletter: newsletterInput.checked
    };
    
    return JSON.stringify(currentData) !== JSON.stringify({
        nome: originalData.nome || '',
        sobrenome: originalData.sobrenome || '',
        pais: originalData.pais || '',
        email: originalData.email || currentUser.email,
        newsletter: originalData.newsletter || false
    });
}

// Avisar sobre mudanças não salvas ao sair da página
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
    }
});

// Melhorar UX com feedback visual para campos modificados
const formInputs = [nomeInput, sobrenomeInput, paisInput, emailInput, newsletterInput];

formInputs.forEach(input => {
    input.addEventListener('input', () => {
        if (hasUnsavedChanges()) {
            saveBtn.style.background = '#ff9800';
            saveBtn.style.animation = 'pulse 2s infinite';
        } else {
            saveBtn.style.background = '#4caf50';
            saveBtn.style.animation = 'none';
        }
    });
});

// CSS para animação do botão
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

async function renderAdminButton() {
    // Remove botão existente, se houver
    const existingBtn = document.getElementById('promoteUserBtn');
    if (existingBtn) existingBtn.remove();

    // Só superAdmin vê o botão
    if (originalData.tipo === 'superAdmin') {
        // Esconder estatísticas para superAdmin
        if (accountStats) accountStats.style.display = 'none';

        // Criar botão Promover usuário
        const promoteBtn = document.createElement('button');
        promoteBtn.id = 'promoteUserBtn';
        promoteBtn.type = 'button';
        promoteBtn.textContent = 'Promover usuário';
        promoteBtn.className = 'save-btn';
        promoteBtn.style.marginLeft = '10px';

        const formActions = document.querySelector('.form-actions');
        if (formActions) formActions.appendChild(promoteBtn);

        // Evento do botão
        promoteBtn.addEventListener('click', async () => {
            const email = prompt('Digite o email do usuário que deseja promover:');
            if (!email) return alert('Email necessário');

            try {
                // Buscar usuário no Realtime Database pelo email
                const usuariosRef = ref(dbRealtime, 'usuarios');
                const snapshot = await get(usuariosRef);
                if (!snapshot.exists()) return alert('Nenhum usuário encontrado.');

                const usuarios = snapshot.val();
                let userToPromote = null;

                // Encontrar usuário pelo email
                for (const uid in usuarios) {
                    if (usuarios[uid].email === email) {
                        userToPromote = { uid, ...usuarios[uid] };
                        break;
                    }
                }

                if (!userToPromote) return alert('Usuário não encontrado.');

                // Atualizar tipo para 'admin'
                await set(ref(dbRealtime, `usuarios/${userToPromote.uid}`), {
                    ...userToPromote,
                    tipo: 'admin',
                    updated_at: new Date().toISOString()
                });

                alert(`Usuário ${email} promovido para admin com sucesso!`);

            } catch (error) {
                console.error('Erro ao promover usuário:', error);
                alert('Erro ao promover usuário. Veja o console para detalhes.');
            }
        });
    }
}