// ====== Data storage helpers ======
const STORAGE_KEYS = {
  MEMBERS: "pg_members",
  EXPENSES: "pg_expenses",
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
 
function loadData() {
  const m = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS));
  const e = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES));
  members = Array.isArray(m) && m.length ? m : [...DEFAULT_MEMBERS];
  expenses = Array.isArray(e) ? e : [];
}
 
function saveMembers() {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}
 
function saveExpenses() {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}
 
// ====== Utility helpers ======
function formatDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return d.toLocaleDateString();
}
 
function formatCurrency(amount) {
  if (isNaN(amount)) return "₹0";
  return "₹" + amount.toFixed(2);
}
 
// ====== UI: Tabs / Screens ======
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("active");
  });
  const active = document.getElementById(screenId);
  if (active) active.classList.add("active");
 
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.remove("active");
  });
  const navBtn = document.querySelector(`[data-target='${screenId}']`);
  if (navBtn) navBtn.classList.add("active");
}
 
// ====== Rendering: Members in UI ======
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
 
function renderConsumerCheckboxes() {
  const container = document.getElementById("consumerCheckboxes");
  container.innerHTML = "";
  members.forEach((name) => {
    const id = "consumer-" + name.replace(/\s+/g, "-");
    const wrapper = document.createElement("label");
    wrapper.className = "checkbox-pill";
    wrapper.innerHTML = `
      <input type="checkbox" value="${name}" id="${id}">
      <span>${name}</span>
    `;
    container.appendChild(wrapper);
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
 
// ====== Rendering: Expenses ======
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
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="card-title">${ex.item} <span style="float:right; font-weight:600;">${formatCurrency(
          ex.amount
        )}</span></div>
        <div class="card-sub">Paid by <b>${ex.payer}</b> · Shared by ${ex.consumers.join(
        ", "
      )}</div>
        <div class="card-meta">
          <span>${formatDate(ex.date)}</span>
          <span>Split among ${ex.consumers.length} people</span>
        </div>
      `;
      list.appendChild(div);
    });
}
 
// ====== Rendering: Summary ======
function calculateBalances() {
  const balance = {};
  members.forEach((name) => (balance[name] = 0));
 
  expenses.forEach((ex) => {
    if (!ex.consumers || ex.consumers.length === 0) return;
    const share = ex.amount / ex.consumers.length;
 
    // Each consumer owes their share
    ex.consumers.forEach((c) => {
      if (balance[c] === undefined) balance[c] = 0;
      balance[c] -= share;
    });
 
    // Payer gets full amount credited
    if (balance[ex.payer] === undefined) balance[ex.payer] = 0;
    balance[ex.payer] += ex.amount;
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
  expenses.forEach((ex) => (totalSpend += ex.amount));
 
  const header = document.getElementById("summaryHeader");
  header.textContent = `Total group spend: ${formatCurrency(totalSpend)}`;
 
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
  const item = document.getElementById("itemInput").value.trim();
  const amountRaw = document.getElementById("amountInput").value;
  const amount = parseFloat(amountRaw);
 
  const consumerEls = document.querySelectorAll(
    "#consumerCheckboxes input[type='checkbox']:checked"
  );
  const consumers = Array.from(consumerEls).map((el) => el.value);
 
  if (!payer || !item || isNaN(amount) || amount <= 0 || consumers.length === 0) {
    alert("Please fill all fields and select at least one consumer.");
    return;
  }
 
  const expense = {
    id: Date.now(),
    payer,
    item,
    amount,
    consumers,
    date: new Date().toISOString(),
  };
 
  expenses.push(expense);
  saveExpenses();
 
  // Reset form fields
  document.getElementById("itemInput").value = "";
  document.getElementById("amountInput").value = "";
  document
    .querySelectorAll("#consumerCheckboxes input[type='checkbox']")
    .forEach((c) => (c.checked = false));
 
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
  renderConsumerCheckboxes();
 
  alert("Member added!");
}
 
function handleResetAll() {
  if (!confirm("Reset all expenses? This cannot be undone.")) return;
  expenses = [];
  saveExpenses();
  renderExpensesList();
  renderSummary();
}
 
// ====== Init ======
function initApp() {
  loadData();
 
  // Attach handlers
  document
    .getElementById("addExpenseForm")
    .addEventListener("submit", handleAddExpense);
  document
    .getElementById("addMemberForm")
    .addEventListener("submit", handleAddMember);
  document
    .getElementById("resetButton")
    .addEventListener("click", handleResetAll);
 
  // Nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      switchScreen(target);
      if (target === "screen-summary") renderSummary();
      if (target === "screen-expenses") renderExpensesList();
      if (target === "screen-members") renderMembersList();
    });
  });
 
  // Initial renders
  renderPayerSelect();
  renderConsumerCheckboxes();
  renderMembersList();
  renderExpensesList();
  renderSummary();
  switchScreen("screen-add");
}
 
document.addEventListener("DOMContentLoaded", initApp);
 