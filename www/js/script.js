let expenses = [];
let currentBalance = 0.00; // Saldo inicial do mês atual
let editingItemId = null;
let editingItemType = null;
let currentModalType = null; // 'income' ou 'expense'

// Armazenar dados de cada mês
// A estrutura será: { 'YYYY-MM': { balance: 100.00, expenses: [{...}, {...}] } }
let monthlyData = {};

// Variáveis para controlar o mês exibido
let displayedMonth = new Date(); // Mês atualmente sendo visualizado
const today = new Date(); // Mês atual do calendário

// --- Funções de Inicialização e Salvamento ---

function generateMonthKey(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

function loadDataForMonth(monthKey) {
    const data = localStorage.getItem(`monthlyData_${monthKey}`);
    if (data) {
        return JSON.parse(data);
    }
    return {
        balance: 0.00,
        expenses: []
    }; // Retorna um objeto vazio se não houver dados
}

function saveDataForMonth(monthKey, data) {
    localStorage.setItem(`monthlyData_${monthKey}`, JSON.stringify(data));
}

function loadGlobalData() {
    const globalMonthlyData = localStorage.getItem('monthlyData');
    if (globalMonthlyData) {
        monthlyData = JSON.parse(globalMonthlyData);
    } else {
        monthlyData = {};
    }
}

function saveGlobalData() {
    localStorage.setItem('monthlyData', JSON.stringify(monthlyData));
}

function updateCurrentMonthData() {
    const monthKey = generateMonthKey(displayedMonth);
    const data = monthlyData[monthKey] || {
        balance: 0.00,
        expenses: []
    };
    currentBalance = data.balance;
    expenses = data.expenses;
}

function saveCurrentMonthData() {
    const monthKey = generateMonthKey(displayedMonth);
    monthlyData[monthKey] = {
        balance: currentBalance,
        expenses: expenses
    };
    saveGlobalData();
}

// --- Funções de Atualização da Interface ---

function updateDisplay() {
    updateMonthSelector();
    updateBalance();
    updateExpensesList();
    updateSummary();
    toggleControls();
}

function updateBalance() {
    const balanceElement = document.getElementById('currentBalance');
    balanceElement.textContent = `R$ ${currentBalance.toFixed(2).replace('.', ',')}`;

    if (currentBalance >= 0) {
        balanceElement.className = 'balance positive';
    } else {
        balanceElement.className = 'balance negative';
    }
}

function updateExpensesList() {
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';

    if (expenses.length === 0) {
        expensesList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Nenhuma despesa cadastrada</div>';
        return;
    }

    expenses.forEach(expense => {
        const expenseDiv = document.createElement('div');
        expenseDiv.className = 'item expense-item';
        expenseDiv.dataset.itemId = expense.id; // Adiciona o ID para facilitar a seleção dos botões

        expenseDiv.innerHTML = `
                    <div class="item-name">${expense.name}</div>
                    <div class="item-details">${expense.details || ''}</div>
                    <div class="item-value expense-value">R$ ${expense.value.toFixed(2).replace('.', ',')}</div>
                    <div class="item-actions">
                        <button class="action-btn edit-btn" onclick="editItem('expense', ${expense.id})" title="Editar">✏️</button>
                        <button class="action-btn delete-btn" onclick="deleteItem('expense', ${expense.id})" title="Excluir">🗑️</button>
                    </div>
                `;

        expensesList.appendChild(expenseDiv);
    });
}

function updateSummary() {
    const totalExpenses = expenses.reduce((total, expense) => total + expense.value, 0);
    const finalBalance = currentBalance - totalExpenses; // Saldo inicial - despesas

    document.getElementById('totalExpenses').textContent =
        `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
    // A linha abaixo foi removida conforme a solicitação
    // document.getElementById('accountBalance').textContent = `R$ ${currentBalance.toFixed(2).replace('.', ',')}`;

    const finalBalanceElement = document.getElementById('finalBalance');
    finalBalanceElement.textContent = `Saldo Final: R$ ${finalBalance.toFixed(2).replace('.', ',')}`;

    if (finalBalance >= 0) {
        finalBalanceElement.className = 'final-balance positive';
    } else {
        finalBalanceElement.className = 'final-balance negative';
    }
}

function updateMonthSelector() {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthName = months[displayedMonth.getMonth()];
    const year = displayedMonth.getFullYear();

    document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
}

// --- Funções de Controle de Mês ---

function changeMonth(direction) {
    saveCurrentMonthData(); // Salva os dados do mês atual antes de mudar
    displayedMonth.setMonth(displayedMonth.getMonth() + direction);
    updateCurrentMonthData(); // Carrega os dados do novo mês
    updateDisplay();
}

// Função para habilitar/desabilitar controles com base no mês
function toggleControls() {
    // Ajuste para verificar se o mês exibido é anterior ao mês atual do calendário
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());

    const addButtonIncome = document.querySelector('.add-income-btn');
    const addButtonExpense = document.querySelector('.add-expense-btn');
    const editBalanceBtn = document.getElementById('currentBalance');

    // Seleciona todos os botões de ação DENTRO dos itens da lista de despesas
    const itemActions = document.querySelectorAll('.item-actions');

    if (isPastMonth) {
        addButtonIncome.classList.add('disabled-btn');
        addButtonExpense.classList.add('disabled-btn');
        addButtonIncome.onclick = null;
        addButtonExpense.onclick = null;

        editBalanceBtn.onclick = null; // Não permite editar o saldo diretamente
        editBalanceBtn.style.cursor = 'default';

        itemActions.forEach(actionsDiv => {
            actionsDiv.style.display = 'none'; // Oculta os botões de ação
        });

    } else {
        addButtonIncome.classList.remove('disabled-btn');
        addButtonExpense.classList.remove('disabled-btn');
        addButtonIncome.onclick = () => openModal('income');
        addButtonExpense.onclick = () => openModal('expense');

        editBalanceBtn.onclick = () => openBalanceModal();
        editBalanceBtn.style.cursor = 'pointer';

        itemActions.forEach(actionsDiv => {
            actionsDiv.style.display = 'flex'; // Exibe os botões de ação
        });

        // Reaplica os event listeners para os botões de ação, caso tenham sido removidos
        document.querySelectorAll('.item-actions .action-btn').forEach(btn => {
            btn.classList.remove('disabled-btn');
            const itemId = parseInt(btn.parentElement.parentElement.dataset.itemId);
            if (btn.classList.contains('edit-btn')) {
                btn.onclick = () => editItem('expense', itemId);
            } else if (btn.classList.contains('delete-btn')) {
                btn.onclick = () => deleteItem('expense', itemId);
            }
            btn.style.cursor = 'pointer';
        });
    }
}


// --- Funções de Modal ---

function openModal(type, itemId = null) {
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());
    if (isPastMonth) {
        alert('Não é possível adicionar ou editar itens em meses passados.');
        return;
    }

    const modal = document.getElementById('itemModal');
    const form = document.getElementById('itemForm');
    currentModalType = type;

    if (itemId) {
        const item = expenses.find(i => i.id === itemId);
        if (item) {
            document.getElementById('modalTitle').textContent = 'Editar Despesa';
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemValue').value = item.value;
            document.getElementById('itemDetails').value = item.details || '';
            editingItemId = itemId;
            editingItemType = type;
        }
    } else {
        document.getElementById('modalTitle').textContent =
            type === 'expense' ? 'Adicionar Despesa' : 'Adicionar Receita';
        form.reset();
        editingItemId = null;
        editingItemType = null;
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('itemModal').style.display = 'none';
    document.getElementById('itemForm').reset();
    editingItemId = null;
    editingItemType = null;
    currentModalType = null;
}

function openBalanceModal() {
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());
    if (isPastMonth) {
        alert('Não é possível editar o saldo inicial em meses passados.');
        return;
    }
    document.getElementById('newBalance').value = currentBalance.toFixed(2);
    document.getElementById('balanceModal').style.display = 'block';
}

function closeBalanceModal() {
    document.getElementById('balanceModal').style.display = 'none';
}

// --- Funções de Submissão de Formulário ---

document.getElementById('itemForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('itemName').value;
    let value = parseFloat(document.getElementById('itemValue').value);
    const details = document.getElementById('itemDetails').value;

    if (editingItemId) {
        const oldExpense = expenses.find(e => e.id === editingItemId);
        if (oldExpense) {
            currentBalance += oldExpense.value; // Reverter a despesa antiga do saldo
        }

        const itemIndex = expenses.findIndex(i => i.id === editingItemId);
        if (itemIndex !== -1) {
            expenses[itemIndex] = {
                ...expenses[itemIndex],
                name, value, details
            };
            currentBalance -= value; // Aplicar a nova despesa no saldo
        }
    } else {
        if (currentModalType === 'expense') {
            const item = {
                id: Date.now(),
                name,
                value,
                details
            };
            expenses.push(item);
            currentBalance -= value; // Deduzir do saldo
        } else { // Se for receita
            currentBalance += value; // Adicionar diretamente ao saldo
        }
    }

    saveCurrentMonthData();
    updateDisplay();
    closeModal();
});

document.getElementById('balanceForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const newBalance = parseFloat(document.getElementById('newBalance').value);
    currentBalance = newBalance;

    saveCurrentMonthData();
    updateDisplay();
    closeBalanceModal();
});

// --- Funções de Edição/Exclusão ---

function editItem(type, itemId) {
    openModal(type, itemId);
}

function deleteItem(type, itemId) {
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());
    if (isPastMonth) {
        alert('Não é possível excluir itens em meses passados.');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este item?')) {
        if (type === 'expense') {
            const deletedExpense = expenses.find(e => e.id === itemId);
            if (deletedExpense) {
                currentBalance += deletedExpense.value; // Devolve o valor da despesa ao saldo
            }
            expenses = expenses.filter(e => e.id !== itemId);
        }
        saveCurrentMonthData();
        updateDisplay();
    }
}

// --- Event Listeners ---

window.addEventListener('click', function (e) {
    const itemModal = document.getElementById('itemModal');
    const balanceModal = document.getElementById('balanceModal');

    if (e.target === itemModal) {
        closeModal();
    }
    if (e.target === balanceModal) {
        closeBalanceModal();
    }
});

// --- Inicialização ---

function init() {
    loadGlobalData(); // Carrega todos os dados mensais
    updateCurrentMonthData(); // Define os dados para o mês atual (hoje)
    updateDisplay();
}

window.addEventListener('load', init);