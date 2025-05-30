// --- Variáveis Globais ---
let expenses = [];
let incomes = [];
// currentNetBalance removido, pois o saldo líquido não será mais exibido no topo.
let editingItemId = null;
let editingItemType = null;
let currentModalType = null;
let monthlyData = {};
let displayedMonth = new Date();
const today = new Date();

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
        expenses: [],
        incomes: []
    };
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
        expenses: [],
        incomes: []
    };
    incomes = data.incomes || [];
    expenses = data.expenses || [];
    // Não é necessário calcular currentNetBalance aqui, pois ele foi removido do topo.
}

// calculateNetBalance e updateBalance (o saldo líquido) foram removidos, pois não serão exibidos no topo.

function saveCurrentMonthData() {
    const monthKey = generateMonthKey(displayedMonth);
    monthlyData[monthKey] = {
        expenses: expenses,
        incomes: incomes
    };
    saveGlobalData();
}

function updateDisplay() {
    updateMonthSelector();
    updateTopIncomeDisplay(); // Atualiza apenas o "Total de Receitas" no topo
    updateIncomesList();
    updateExpensesList();
    updateSummary();
    toggleControls();
}

function updateTopIncomeDisplay() {
    const manualTopIncome = localStorage.getItem('manualTopIncome');
    const totalIncomes = manualTopIncome !== null ? parseFloat(manualTopIncome) : incomes.reduce((total, income) => total + income.value, 0);
    document.getElementById('currentTopIncome').textContent = `R$ ${totalIncomes.toFixed(2).replace('.', ',')}`;
}


function updateIncomesList() {
    const incomesList = document.getElementById('incomesList');
    incomesList.innerHTML = '';

    if (incomes.length === 0) {
        incomesList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Nenhuma receita cadastrada</div>';
        return;
    }

    incomes.forEach(income => {
        const incomeDiv = document.createElement('div');
        incomeDiv.className = 'item income-item';
        incomeDiv.dataset.itemId = income.id;
        incomeDiv.dataset.itemType = 'income'; // Adicionar tipo para click longo

        incomeDiv.innerHTML = `
            <div class="item-name">${income.name}</div>
            <div class="item-details">${income.details || ''}</div>
            <div class="item-value income-value">R$ ${income.value.toFixed(2).replace('.', ',')}</div>
            <div class="item-actions">
                <button class="action-btn edit-btn" onclick="editItem('income', ${income.id})" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#007bff" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                </button>
                <button class="action-btn delete-btn" onclick="deleteItem('income', ${income.id})" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#dc3545" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            </div>
        `;
        incomesList.appendChild(incomeDiv);
    });
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
        expenseDiv.className = `item ${expense.paid ? 'paid-item' : 'expense-item'}`;
        expenseDiv.dataset.itemId = expense.id;
        expenseDiv.dataset.itemType = 'expense';

        expenseDiv.innerHTML = `
            <div class="item-name">${expense.name}</div>
            <div class="item-details">${expense.details || ''}</div>
            <div class="item-value ${expense.paid ? '' : 'expense-value'}">R$ ${expense.value.toFixed(2).replace('.', ',')}</div>
            <div class="item-actions">
                <button class="action-btn payment-status ${expense.paid ? 'status-paid' : 'status-pending'}" onclick="togglePaymentStatus(${expense.id})" title="${expense.paid ? 'Marcar como Pendente' : 'Marcar como Pago'}">
                    ${expense.paid ? `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#28a745" viewBox="0 0 16 16">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    ` : `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ffc107" viewBox="0 0 16 16">
                            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                        </svg>
                    `}
                </button>
                <button class="action-btn edit-btn" onclick="editItem('expense', ${expense.id})" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#007bff" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                </button>
                <button class="action-btn delete-btn" onclick="deleteItem('expense', ${expense.id})" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#dc3545" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            </div>
        `;
        expensesList.appendChild(expenseDiv);
    });
}

function togglePaymentStatus(expenseId) {
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());
    if (isPastMonth) {
        alert('Não é possível alterar o status de pagamento em meses passados.');
        return;
    }

    const expenseIndex = expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex !== -1) {
        expenses[expenseIndex].paid = !expenses[expenseIndex].paid;
        saveCurrentMonthData();
        updateDisplay();
    }
}

function updateSummary() {
    const totalIncomes = incomes.reduce((total, income) => total + income.value, 0);
    const totalExpenses = expenses.reduce((total, expense) => total + expense.value, 0);
    const paidExpenses = expenses.reduce((total, expense) => expense.paid ? total + expense.value : total, 0);
    const pendingExpenses = expenses.reduce((total, expense) => !expense.paid ? total + expense.value : total, 0);
    const finalBalance = totalIncomes - totalExpenses; // Saldo considerando todas as despesas, pagas ou não

    document.getElementById('totalIncomes').textContent =
        `R$ ${totalIncomes.toFixed(2).replace('.', ',')}`;
    document.getElementById('totalExpenses').textContent =
        `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
    document.getElementById('paidExpenses').textContent =
        `R$ ${paidExpenses.toFixed(2).replace('.', ',')}`;
    document.getElementById('pendingExpenses').textContent =
        `R$ ${pendingExpenses.toFixed(2).replace('.', ',')}`;

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
    saveCurrentMonthData();
    displayedMonth.setMonth(displayedMonth.getMonth() + direction);
    updateCurrentMonthData();
    updateDisplay();
}

function toggleControls() {
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());

    const menuButtons = document.querySelectorAll('.menu-btn');
    const bottomMenu = document.querySelector('.bottom-menu');

    if (isPastMonth) {
        menuButtons.forEach(btn => {
            btn.classList.add('disabled-btn');
            btn.onclick = null;
        });
        bottomMenu.classList.add('disabled-menu');
        document.body.classList.add('past-month-controls');
    } else {
        menuButtons.forEach(btn => {
            btn.classList.remove('disabled-btn');
            const menuText = btn.querySelector('.menu-text').textContent;
            if (menuText === 'Receita') {
                btn.onclick = () => openModal('income');
            } else if (menuText === 'Despesa') {
                btn.onclick = () => openModal('expense');
            } else if (menuText === 'Pagas') {
                btn.onclick = () => showPaidBills();
            }
        });
        bottomMenu.classList.remove('disabled-menu');
        document.body.classList.remove('past-month-controls');
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
    const paymentStatusGroup = document.getElementById('paymentStatusGroup');
    currentModalType = type;

    if (type === 'expense') {
        paymentStatusGroup.style.display = 'block';
        if (!itemId) {
            document.getElementById('itemPaidStatus').value = 'pending';
        }
    } else {
        paymentStatusGroup.style.display = 'none';
    }

    if (itemId) {
        let item;
        if (type === 'income') {
            item = incomes.find(i => i.id === itemId);
            document.getElementById('modalTitle').textContent = 'Editar Receita';
        } else {
            item = expenses.find(i => i.id === itemId);
            document.getElementById('modalTitle').textContent = 'Editar Despesa';
            if (item) {
                document.getElementById('itemPaidStatus').value = item.paid ? 'paid' : 'pending';
            }
        }

        if (item) {
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
        if (type === 'expense') {
            document.getElementById('itemPaidStatus').value = 'pending';
        }
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('itemModal').style.display = 'none';
    document.getElementById('itemForm').reset();
    editingItemId = null;
    editingItemType = null;
    currentModalType = null;
    // Esconder todas as ações de item ao fechar o modal
    document.querySelectorAll('.item-actions.show').forEach(actions => {
        actions.classList.remove('show');
    });
}

function editTopIncome() {
    const currentValue = localStorage.getItem('manualTopIncome') || incomes.reduce((total, income) => total + income.value, 0);
    const newValue = prompt('Digite o novo valor para o Total de Receitas (R$):', currentValue.toFixed(2));

    if (newValue !== null && !isNaN(newValue) && newValue.trim() !== '') {
        const parsedValue = parseFloat(newValue);
        if (parsedValue >= 0) {
            localStorage.setItem('manualTopIncome', parsedValue);
            updateTopIncomeDisplay();
        } else {
            alert('Por favor, insira um valor positivo.');
        }
    }
}

// --- Funções para Contas Pagas ---
function showPaidBills() {
    const paidBillsModal = document.getElementById('paidBillsModal');
    const paidBillsList = document.getElementById('paidBillsList');

    paidBillsList.innerHTML = '';

    const paidExpenses = expenses.filter(expense => expense.paid);

    if (paidExpenses.length === 0) {
        paidBillsList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Nenhuma conta paga este mês</div>';
    } else {
        paidExpenses.forEach(expense => {
            const expenseDiv = document.createElement('div');
            expenseDiv.className = 'item paid-item';
            expenseDiv.innerHTML = `
                <div class="item-name">${expense.name} <span class="paid-badge">PAGO</span></div>
                <div class="item-details">${expense.details || ''}</div>
                <div class="item-value">R$ ${expense.value.toFixed(2).replace('.', ',')}</div>
            `;
            paidBillsList.appendChild(expenseDiv);
        });
    }

    paidBillsModal.style.display = 'block';
}

function closePaidBillsModal() {
    document.getElementById('paidBillsModal').style.display = 'none';
}

// --- Funções de Submissão de Formulário ---
document.getElementById('itemForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('itemName').value;
    let value = parseFloat(document.getElementById('itemValue').value);
    const details = document.getElementById('itemDetails').value;
    const paidStatus = currentModalType === 'expense' ?
        document.getElementById('itemPaidStatus').value === 'paid' : false;

    if (editingItemId) {
        if (editingItemType === 'income') {
            const itemIndex = incomes.findIndex(i => i.id === editingItemId);
            if (itemIndex !== -1) {
                incomes[itemIndex] = {
                    ...incomes[itemIndex],
                    name, value, details
                };
            }
        } else { // Editing expense
            const itemIndex = expenses.findIndex(e => e.id === editingItemId);
            if (itemIndex !== -1) {
                expenses[itemIndex] = {
                    ...expenses[itemIndex],
                    name, value, details,
                    paid: paidStatus
                };
            }
        }
    } else {
        const item = {
            id: Date.now(),
            name,
            value,
            details
        };

        if (currentModalType === 'income') {
            incomes.push(item);
        } else {
            expenses.push({
                ...item,
                paid: paidStatus
            });
        }
    }

    // Não recalculamos o saldo do topo aqui, pois ele é só de receitas.
    saveCurrentMonthData();
    updateDisplay(); // Atualiza a exibição, o que inclui o "Total de Receitas" no topo
    closeModal();
});

function editItem(type, itemId) {
    openModal(type, itemId);
}

function deleteItem(type, itemId) {
    executeDeleteItem(type, itemId);
}

function executeDeleteItem(type, itemId) {
    const isPastMonth = (displayedMonth.getFullYear() < today.getFullYear()) ||
        (displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() < today.getMonth());
    if (isPastMonth) {
        alert('Não é possível excluir itens em meses passados.');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este item?')) {
        if (type === 'income') {
            incomes = incomes.filter(i => i.id !== itemId);
        } else {
            expenses = expenses.filter(e => e.id !== itemId);
        }
        // Não recalculamos o saldo do topo aqui, pois ele é só de receitas.
        saveCurrentMonthData();
        updateDisplay();
    }
}


// --- Event Listeners ---
window.addEventListener('click', function (e) {
    const itemModal = document.getElementById('itemModal');
    const paidBillsModal = document.getElementById('paidBillsModal');

    if (e.target === itemModal) {
        closeModal();
    }

    if (e.target === paidBillsModal) {
        closePaidBillsModal();
    }
});

function toggleTheme() {
    const body = document.body;
    const themeSwitch = document.getElementById('themeSwitch');
    const isDarkMode = !body.classList.contains('dark-mode');

    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    themeSwitch.checked = isDarkMode;
}

function updateThemeIcons(isDarkMode) {
    const daymodeIcon = document.getElementById('daymodeIcon');
    const nightmodeIcon = document.getElementById('nightmodeIcon');

    if (isDarkMode) {
        daymodeIcon.style.display = 'none';
        nightmodeIcon.style.display = 'inline-block';
    } else {
        daymodeIcon.style.display = 'inline-block';
        nightmodeIcon.style.display = 'none';
    }
}

function loadTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const body = document.body;
    const themeSwitch = document.getElementById('themeSwitch');
    const themeToggleContainer = document.getElementById('themeToggleContainer');

    if (darkMode) {
        body.classList.add('dark-mode');
        themeSwitch.checked = true;
    } else {
        body.classList.remove('dark-mode');
        themeSwitch.checked = false;
    }

    themeToggleContainer.addEventListener('click', (e) => {
        if (e.target !== themeToggleContainer) return;
        toggleTheme();
    });

    themeSwitch.addEventListener('change', toggleTheme);
}

// --- Inicialização ---
function init() {
    loadGlobalData();
    loadTheme();
    updateCurrentMonthData();
    updateDisplay();
}

window.addEventListener('load', init);