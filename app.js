// ====== Storage keys ======
const STORAGE_KEYS = {
  MEMBERS: "pg_members",
  EXPENSES: "pg_expenses_v2", // new key to avoid conflict with old structure
};
 
const DEFAULT_MEMBERS = [
  "Darshan",
  "Pratik",
  "Vaibhav",
  "Shreyas",
  "Ramji",
  "Rajvardhan",
  "Yash",
];
 
let members = [];
let expenses = [];
let currentItems = []; // items being added in current expense
 
// ====== Load / Save ======
function loadData() {
  const m = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS));
  members = Array.isArray(m) && m.length ? m : [...DEFAULT_MEMBERS];
 
  const e = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES));
  expenses = Array.isArray(e) ? e : [];
}
 
function saveMembers() {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}
 
function saveExpenses() {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}
 
// ====== Utils ======
function formatDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return d.toLocaleDateString();
}
 
function formatCurrency(amount) {
  if (isNaN(amount)) return "₹0";
  return "₹" + amount.toFixed(2);
}
 
// ====== Tabs / Screens ======
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const active = document.getElementById(screenId);
  if (active) active.classList.add("active");
 
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const navBtn = document.querySelector(`[data-target='${screenId}']`);
  if (navBtn) navBtn.classList.add("active");
 
  if (screenId === "screen-expenses") renderExpensesList();
  if (screenId === "screen-summary") renderSummary();
  if (screenId === "screen-members") renderMembersList();
}
 
// ====== Render members ======
function renderPayerSelect() {
  const select = document.getElementById("payerSelect");
  select.innerHTML = "";
  members.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}
 
function renderConsumerSelectInSheet() {
  const select = document.getElementById("itemConsumerSelect");
  select.innerHTML = "";
  members.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}
 
function renderMembersList() {
  const list = document.getElementById("membersList");
  list.innerHTML = "";
  members.forEach((name) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-title">${name}</div>
      <div class="card-sub">Group member</div>
    `;
    list.appendChild(div);
  });
}
 
// ====== Items handling for new expense ======
function renderCurrentItems() {
  const container = document.getElementById("currentItemsList");
  const totalLabel = document.getElementById("currentItemsTotal");
  container.innerHTML = "";
 
  if (!currentItems.length) {
    container.innerHTML = `<div class="helper-text">No items added yet. Use "Add item" to add dosa, poha, chai, etc.</div>`;
    totalLabel.textContent = "Total: ₹0.00";
    return;
  }
 
  let total = 0;
  currentItems.forEach((it, idx) => {
    total += it.amount;
    const pill = document.createElement("div");
    pill.className = "item-pill";
    pill.innerHTML = `
      <span>${it.name} · ${formatCurrency(it.amount)} · ${it.consumer}</span>
      <button class="item-remove-btn" onclick="removeCurrentItem(${idx})">✕</button>
    `;
    container.appendChild(pill);
  });
 
  totalLabel.textContent = `Total: ${formatCurrency(total)}`;
}
 
function removeCurrentItem(index) {
  currentItems.splice(index, 1);
  renderCurrentItems();
}
 
// ====== Bottom sheet controls ======
function openBottomSheet() {
  const backdrop = document.getElementById("bottomSheetBackdrop");
  backdrop.classList.add("open");
  document.getElementById("itemNameInput").value = "";
  document.getElementById("itemAmountInput").value = "";
}
 
function closeBottomSheet() {
  const backdrop = document.getElementById("bottomSheetBackdrop");
  backdrop.classList.remove("open");
}
 
function handleAddItemToCurrent() {
  const name = document.getElementById("itemNameInput").value.trim();
  const amountRaw = document.getElementById("itemAmountInput").value;
  const consumer = document.getElementById("itemConsumerSelect").value;
  const amount = parseFloat(amountRaw);
 
  if (!name || isNaN(amount) || amount <= 0 || !consumer) {
    alert("Please fill item name, amount and consumer.");
    return;
  }
 
  currentItems.push({ name, amount, consumer });
  renderCurrentItems();
  closeBottomSheet();
}
 
// ====== Expenses rendering ======
function renderExpensesList() {
  const list = document.getElementById("expensesList");
  list.innerHTML = "";
 
  if (!expenses.length) {
    list.innerHTML = `<div class="helper-text">No expenses added yet. Add the first one from the "Add" tab.</div>`;
    return;
  }
 
  expenses
    .slice()
    .reverse()
    .forEach((ex) => {
      const total = ex.items.reduce((sum, it) => sum + it.amount, 0);
      const statusBadgeClass =
        ex.status === "settled" ? "badge-status-settled" : "badge-status-pending";
      const statusLabel = ex.status === "settled" ? "Settled" : "Pending";
 
      const card = document.createElement("div");
      card.className = "card";
 
      const itemsHtml = ex.items
        .map(
          (it) =>
            `<div>• ${it.name} ${formatCurrency(it.amount)} — <b>${it.consumer}</b></div>`
        )
        .join("");
 
      card.innerHTML = `
        <div class="card-title">
          ${ex.payer} paid <span style="float:right;">${formatCurrency(total)}</span>
        </div>
        <div class="card-sub">
          <span class="badge ${statusBadgeClass}">${statusLabel}</span>
        </div>
        <div class="card-items">
          ${itemsHtml}
        </div>
        <div class="card-meta">
          <span>${formatDate(ex.date)}</span>
          <span>${ex.items.length} item(s)</span>
        </div>
        <div class="card-actions">
          <button class="button-ghost" onclick="shareExpense(${ex.id})">Share</button>
          <button class="button-ghost" onclick="toggleExpenseStatus(${ex.id})">
            ${ex.status === "settled" ? "Mark Pending" : "Mark Settled"}
          </button>
        </div>
      `;
      list.appendChild(card);
    });
}
 
// ====== Balances / Summary ======
function calculateBalances() {
  const balance = {};
  members.forEach((name) => (balance[name] = 0));
 
  expenses.forEach((ex) => {
    if (ex.status === "settled") return; // ignore settled ones
    ex.items.forEach((it) => {
      if (balance[it.consumer] === undefined) balance[it.consumer] = 0;
      if (balance[ex.payer] === undefined) balance[ex.payer] = 0;
 
      balance[it.consumer] -= it.amount;
      balance[ex.payer] += it.amount;
    });
  });
 
  return balance;
}
 
function renderSummary() {
  const balance = calculateBalances();
  const list = document.getElementById("summaryList");
  list.innerHTML = "";
 
  if (members.length === 0) {
    list.innerHTML = `<div class="helper-text">No members yet. Add members first.</div>`;
    return;
  }
 
  let totalSpend = 0;
  expenses.forEach((ex) => {
    if (ex.status === "settled") return;
    totalSpend += ex.items.reduce((sum, it) => sum + it.amount, 0);
  });
 
  const header = document.getElementById("summaryHeader");
  header.textContent = `Total pending group spend: ${formatCurrency(totalSpend)}`;
 
  members.forEach((name) => {
    const amt = balance[name] || 0;
    let badgeClass = "badge-neutral";
    let label = "Settled";
 
    if (amt > 0.01) {
      badgeClass = "badge-positive";
      label = "Should receive";
    } else if (amt < -0.01) {
      badgeClass = "badge-negative";
      label = "Should pay";
    }
 
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-title">${name}</div>
      <div class="card-meta">
        <span class="badge ${badgeClass}">${label}</span>
        <span>${formatCurrency(amt)}</span>
      </div>
    `;
    list.appendChild(div);
  });
}
 
// ====== Actions ======
function handleAddExpense(event) {
  event.preventDefault();
  const payer = document.getElementById("payerSelect").value;
 
  if (!payer) {
    alert("Please select payer.");
    return;
  }
  if (!currentItems.length) {
    alert("Please add at least one item.");
    return;
  }
 
  const expense = {
    id: Date.now(),
    payer,
    items: currentItems.map((it) => ({ ...it })), // clone
    status: "pending",
    date: new Date().toISOString(),
  };
 
  expenses.push(expense);
  saveExpenses();
 
  currentItems = [];
  renderCurrentItems();
  renderExpensesList();
  renderSummary();
 
  alert("Expense added!");
}
 
function handleAddMember(event) {
  event.preventDefault();
  const input = document.getElementById("newMemberInput");
  const name = input.value.trim();
  if (!name) {
    alert("Enter a member name.");
    return;
  }
  if (members.includes(name)) {
    alert("This member already exists.");
    return;
  }
  members.push(name);
  saveMembers();
  input.value = "";
 
  renderMembersList();
  renderPayerSelect();
  renderConsumerSelectInSheet();
  alert("Member added!");
}
 
function handleResetAll() {
  if (!confirm("Reset all expenses? This cannot be undone.")) return;
  expenses = [];
  saveExpenses();
  renderExpensesList();
  renderSummary();
}
 
// Toggle status
function toggleExpenseStatus(id) {
  const ex = expenses.find((e) => e.id === id);
  if (!ex) return;
  ex.status = ex.status === "settled" ? "pending" : "settled";
  saveExpenses();
  renderExpensesList();
  renderSummary();
}
 
// Share to WhatsApp (or any share target)
function shareExpense(id) {
  const ex = expenses.find((e) => e.id === id);
  if (!ex) return;
 
  const total = ex.items.reduce((sum, it) => sum + it.amount, 0);
  let msg = `Expense Summary\n\nPayer: ${ex.payer}\nItems:\n`;
 
  ex.items.forEach((it) => {
    msg += `- ${it.name} ${formatCurrency(it.amount)} (${it.consumer})\n`;
  });
 
  msg += `\nTotal: ${formatCurrency(total)}\nStatus: ${
    ex.status === "settled" ? "Settled" : "Pending"
  }`;
 
  const url = "https://wa.me/?text=" + encodeURIComponent(msg);
  window.open(url, "_blank");
}
 
// ====== Init ======
function initApp() {
  loadData();
 
  // Form handlers
  document
    .getElementById("addExpenseForm")
    .addEventListener("submit", handleAddExpense);
  document
    .getElementById("addMemberForm")
    .addEventListener("submit", handleAddMember);
  document
    .getElementById("resetButton")
    .addEventListener("click", handleResetAll);
 
  // Bottom sheet handlers
  document
    .getElementById("openItemSheetBtn")
    .addEventListener("click", openBottomSheet);
  document
    .getElementById("bottomSheetCloseBtn")
    .addEventListener("click", closeBottomSheet);
  document
    .getElementById("addItemToCurrentBtn")
    .addEventListener("click", handleAddItemToCurrent);
  document
    .getElementById("bottomSheetBackdrop")
    .addEventListener("click", (e) => {
      if (e.target.id === "bottomSheetBackdrop") closeBottomSheet();
    });
 
  // Nav buttons
 
document.querySelectorAll(".nav-btn").forEach ((btn) => {
 
btn.addEventListener("click", () => { const target =
 
btn.getAttribute("data-target"); switchScreen(target);
 
});
 
});
 
// Initial renders
 
renderPayerSelect();
 
renderConsumerSelectInSheet();
 
renderMembersList();
 
renderCurrentItems();
 
renderExpensesList();
 
renderSummary();
 
switchScreen("screen-add");
 
}
 
document.addEventListener ("DOMContentLoaded", initApp);
 
