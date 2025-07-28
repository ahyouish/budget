let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || {};
let editingId = null;

function openForm(id = null) {
  document.getElementById("formModal").style.display = "flex";
  if (id !== null) {
    editingId = id;
    const t = transactions.find(tr => tr.id === id);
    document.getElementById("formTitle").innerText = "Edit Transaction";
    document.getElementById("typeInput").value = t.type;
    document.getElementById("amountInput").value = t.amount;
    document.getElementById("categoryInput").value = t.category;
    document.getElementById("descriptionInput").value = t.description;
    document.getElementById("dateInput").value = t.date;
  } else {
    editingId = null;
    document.getElementById("formTitle").innerText = "Add Transaction";
    document.querySelectorAll("#formModal input").forEach(i => i.value = "");
    document.getElementById("typeInput").value = "expense";
  }
}

function closeForm() {
  document.getElementById("formModal").style.display = "none";
}

function openBudgetForm() {
  document.getElementById("budgetModal").style.display = "flex";
}

function closeBudgetForm() {
  document.getElementById("budgetModal").style.display = "none";
}

function submitTransaction() {
  const type = document.getElementById("typeInput").value;
  const amount = parseFloat(document.getElementById("amountInput").value);
  const category = document.getElementById("categoryInput").value.trim();
  const description = document.getElementById("descriptionInput").value.trim();
  const date = document.getElementById("dateInput").value;

  if (!amount || !category || !date) return alert("Please fill all required fields.");

  const transaction = { id: editingId ?? Date.now(), type, amount, category, description, date };

  if (editingId !== null) {
    const index = transactions.findIndex(t => t.id === editingId);
    transactions[index] = transaction;
  } else {
    transactions.push(transaction);
  }

  localStorage.setItem("transactions", JSON.stringify(transactions));
  closeForm();
  updateUI();
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateUI();
}

function submitBudget() {
  const category = document.getElementById("budgetCategory").value.trim();
  const limit = parseFloat(document.getElementById("budgetLimit").value);
  if (!category || !limit) return alert("Please fill both fields.");

  budgets[category] = limit;
  localStorage.setItem("budgets", JSON.stringify(budgets));
  closeBudgetForm();
  updateUI();
}

function applyFilters() {
  updateUI();
}

function updateUI() {
  let totalIncome = 0, totalExpenses = 0;
  const filterType = document.getElementById("filterType").value;
  const filterCategory = document.getElementById("filterCategory").value;
  const search = document.getElementById("searchInput").value.toLowerCase();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const filtered = transactions.filter(t => {
    const matchType = filterType === "all" || t.type === filterType;
    const matchCategory = filterCategory === "all" || t.category === filterCategory;
    const matchSearch = t.description.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
    const matchStart = !start || new Date(t.date) >= new Date(start);
    const matchEnd = !end || new Date(t.date) <= new Date(end);
    return matchType && matchCategory && matchSearch && matchStart && matchEnd;
  });

  const list = document.getElementById("transactionList");
  list.innerHTML = "";
  const catSet = new Set();

  filtered.forEach(t => {
    catSet.add(t.category);
    const div = document.createElement("div");
    div.className = t.type;
    div.innerHTML = `
      <strong>${t.description || "(no description)"}</strong><br/>
      <span>${t.category} | ${t.date} | ₹${t.amount.toFixed(2)}</span>
      <br/>
      <button onclick="openForm(${t.id})">✏️</button>
      <button onclick="deleteTransaction(${t.id})">🗑️</button>
    `;
    list.appendChild(div);

    if (t.type === "income") totalIncome += t.amount;
    else totalExpenses += t.amount;
  });

  document.getElementById("totalIncome").innerText = `₹${totalIncome.toFixed(2)}`;
  document.getElementById("totalExpenses").innerText = `₹${totalExpenses.toFixed(2)}`;
  document.getElementById("balance").innerText = `₹${(totalIncome - totalExpenses).toFixed(2)}`;

  // Budget overview
  const budgetList = document.getElementById("budgetCards");
  budgetList.innerHTML = "";
  Object.entries(budgets).forEach(([cat, limit]) => {
    const spent = transactions.filter(t => t.type === "expense" && t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    const percent = Math.min((spent / limit) * 100, 100);
    const card = document.createElement("div");
    card.innerHTML = `
      <h4>${cat}</h4>
      <div style="background:#eee;border-radius:5px;height:10px;overflow:hidden">
        <div style="width:${percent}%;background:${percent >= 100 ? 'red' : 'green'};height:10px"></div>
      </div>
      <small>₹${spent.toFixed(2)} of ₹${limit}</small>
    `;
    budgetList.appendChild(card);
  });

  // Category filter options
  const filterCategoryEl = document.getElementById("filterCategory");
  const categories = [...new Set(transactions.map(t => t.category))];
  filterCategoryEl.innerHTML = `<option value="all">All Categories</option>` +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

updateUI();
