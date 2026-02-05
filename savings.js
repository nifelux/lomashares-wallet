/********************
 * LomaShares Savings
 ********************/

const username = document.getElementById("user-name").content || "guest";
const WALLET_KEY = "wallet_" + username;
const MIN_DURATION = 1; // months
const EARLY_FEE = 0.1;  // 10%

/* ======== WALLET HELPERS ======== */
function getWallet() {
  const raw = JSON.parse(localStorage.getItem(WALLET_KEY));
  if (!raw) {
    const fresh = { balance: 0, txs: [], investments: [], savings: [] };
    localStorage.setItem(WALLET_KEY, JSON.stringify(fresh));
    return fresh;
  }
  // normalize
  raw.balance = Number(raw.balance) || 0;
  raw.txs = Array.isArray(raw.txs) ? raw.txs : [];
  raw.investments = Array.isArray(raw.investments) ? raw.investments : [];
  raw.savings = Array.isArray(raw.savings) ? raw.savings : [];
  return raw;
}

function saveWallet(w) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  renderWallet();
  renderSavings();
}

function renderWallet() {
  const w = getWallet();
  document.getElementById("balance").innerText = w.balance.toLocaleString();
}

/* ======== CREATE SAVING ======== */
function createSaving() {
  const amount = Number(document.getElementById("saveAmount").value);
  const duration = Number(document.getElementById("saveDuration").value);
  const w = getWallet();

  if (!amount || amount <= 0) return alert("Enter valid amount");
  if (!duration || duration < MIN_DURATION) return alert("Duration min 1 month");
  if (w.balance < amount) return alert("Insufficient balance");

  // Deduct
  w.balance -= amount;

  const now = Date.now();
  const end = now + duration * 30 * 24 * 60 * 60 * 1000; // approx months

  // Add saving
  const saving = {
    id: "SAV-" + now,
    amount,
    start: now,
    end,
    duration,
    completed: false
  };

  w.savings.push(saving);
  w.txs.push({
    id: "SAVTX-" + now,
    type: "saving",
    amount,
    time: now,
    note: "Locked saving for " + duration + " month(s)"
  });

  saveWallet(w);
  alert("Saving created successfully");
}

/* ======== RENDER SAVINGS HISTORY ======== */
function renderSavings() {
  const w = getWallet();
  const list = document.getElementById("savingsList");
  if (!w.savings.length) {
    list.innerHTML = "<p>No savings yet.</p>";
    return;
  }

  let html = "";
  w.savings.slice().reverse().forEach(s => {
    html += `
      <div class="card" data-id="${s.id}">
        <b>₦${s.amount.toLocaleString()}</b> locked for ${s.duration} month(s)<br>
        Status: ${s.completed ? "Matured" : "Running"}
        <div class="card-details">
          Start: ${new Date(s.start).toLocaleDateString()}<br>
          End: ${new Date(s.end).toLocaleDateString()}<br>
          ID: ${s.id}<br>
        </div>
      </div>
    `;
  });

  list.innerHTML = html;

  // Add click to expand
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
      const details = card.querySelector(".card-details");
      if (details.style.display === "block") details.style.display = "none";
      else details.style.display = "block";
    });
  });
}

/* ======== EARLY WITHDRAWAL ======== */
function earlyWithdraw(id) {
  const w = getWallet();
  const s = w.savings.find(x => x.id === id);
  if (!s) return alert("Saving not found");
  if (s.completed) return alert("Already matured, withdraw normally");

  const fee = s.amount * EARLY_FEE;
  const payout = s.amount - fee;

  w.balance += payout;
  s.completed = true;

  w.txs.push({
    id: "EARLY-" + Date.now(),
    type: "withdrawal",
    amount: payout,
    time: Date.now(),
    note: `Early withdrawal from saving ${id}, fee ₦${fee.toLocaleString()}`
  });

  saveWallet(w);
  alert(`Early withdrawal processed. Fee ₦${fee.toLocaleString()}`);
}

/* ======== AUTO CHECK MATURITY ======== */
function checkMaturity() {
  const w = getWallet();
  const now = Date.now();
  let changed = false;

  w.savings.forEach(s => {
    if (!s.completed && now >= s.end) {
      w.balance += s.amount;
      s.completed = true;

      w.txs.push({
        id: "SAVEND-" + Date.now(),
        type: "roi",
        amount: s.amount,
        time: Date.now(),
        note: "Matured savings"
      });
      changed = true;
    }
  });

  if (changed) saveWallet(w);
}

/* ======== EVENT LISTENERS ======== */
document.getElementById("saveBtn").addEventListener("click", createSaving);

/* ======== INIT ======== */
document.addEventListener("DOMContentLoaded", function () {
  checkMaturity();
  renderWallet();
  renderSavings();
});
