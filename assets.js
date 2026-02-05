/************************************************************
 * LOMASHARES WALLET SYSTEM (ENFORCED & FINAL)
 * Platform: Wapkiz (JS-only)
 ************************************************************/

/* ================= USER IDENTIFIER ================= */
const username =
  document.getElementById("user-name")?.content ||
  "guest";

const WALLET_KEY = "wallet_" + username;

/* ================= CONFIG ================= */
const SHARE_PRICE = 1000;
const SHARE_RATE = 0.025; // 2.5%
const SHARE_DAYS = 40;

const NIFELUX = {
  1: { cost: 5000, daily: 1000, days: 7 },
  2: { cost: 13000, daily: 1500, days: 12 },
  3: { cost: 21000, daily: 2000, days: 15 }
};

const MIN_WITHDRAW_BALANCE = 1000;
const DAY = 86400000;

/* ================= WALLET NORMALIZER ================= */
function normalizeWallet(w) {
  return {
    balance: Number(w?.balance) || 0,
    txs: Array.isArray(w?.txs) ? w.txs : [],
    investments: Array.isArray(w?.investments) ? w.investments : []
  };
}

/* ================= STORAGE ================= */
function getWallet() {
  const raw = JSON.parse(localStorage.getItem(WALLET_KEY));
  if (!raw) {
    const fresh = normalizeWallet({});
    localStorage.setItem(WALLET_KEY, JSON.stringify(fresh));
    return fresh;
  }
  return normalizeWallet(raw);
}

function saveWallet(wallet) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  if (typeof renderWallet === "function") renderWallet();
}

/* ================= UI ================= */
function renderWallet() {
  const w = getWallet();
  const el = document.getElementById("balance");
  if (el) el.innerText = w.balance.toLocaleString();
}

/* ================= TRANSACTION HELPERS ================= */
function addTx(wallet, type, amount, note) {
  wallet.txs.push({
    id: type.toUpperCase() + "-" + Date.now(),
    type,
    amount,
    time: Date.now(),
    note
  });
}

/* ================= DEPOSIT ================= */
function recordDeposit(amount, source = "manual") {
  const w = getWallet();
  const amt = Number(amount);
  if (!amt || amt <= 0) return false;

  w.balance += amt;
  addTx(w, "deposit", amt, "Deposit via " + source);
  saveWallet(w);
  return true;
}

/* ================= WITHDRAWAL ================= */
function recordWithdrawal(amount) {
  const w = getWallet();
  const amt = Number(amount);

  if (!amt || amt <= 0) return alert("Invalid amount");
  if (w.balance < amt) return alert("Insufficient balance");
  if (w.balance - amt < MIN_WITHDRAW_BALANCE)
    return alert("Minimum balance ₦1,000 required");

  w.balance -= amt;
  addTx(w, "withdrawal", amt, "User withdrawal");
  saveWallet(w);
}

/* ================= LOMASHARES INVESTMENT ================= */
function buyShares() {
  const shares = Number(document.getElementById("shareInput")?.value);
  if (!shares || shares < 1) return alert("Invalid share amount");

  const cost = shares * SHARE_PRICE;
  const w = getWallet();
  if (w.balance < cost) return alert("Insufficient balance");

  w.balance -= cost;
  addTx(w, "investment", cost, "LomaShares investment");

  const now = Date.now();

  w.investments.push({
    id: "LS-" + now,
    type: "LomaShares",
    capital: cost,
    daily: cost * SHARE_RATE,
    start: now,
    end: now + SHARE_DAYS * DAY,
    completed: false
  });

  saveWallet(w);
  alert("LomaShares investment activated");
}

/* ================= NIFELUX INVESTMENT ================= */
function buyProduct(id) {
  const p = NIFELUX[id];
  if (!p) return;

  const w = getWallet();
  if (w.balance < p.cost) return alert("Insufficient balance");

  w.balance -= p.cost;
  addTx(w, "investment", p.cost, "Nifelux product " + id);

  const now = Date.now();

  w.investments.push({
    id: "NF-" + now,
    type: "Nifelux",
    capital: p.cost,
    daily: p.daily,
    start: now,
    lastPaid: now,
    end: now + p.days * DAY,
    completed: false
  });

  saveWallet(w);
}

/* ================= AUTO INVESTMENT PROCESSOR ================= */
function processInvestments() {
  const w = getWallet();
  const now = Date.now();
  let changed = false;

  w.investments.forEach(inv => {
    if (inv.completed) return;

    // NIFELUX DAILY CREDIT
    if (inv.type === "Nifelux") {
      const daysPassed = Math.floor((now - inv.lastPaid) / DAY);
      if (daysPassed > 0) {
        const payableDays = Math.min(
          daysPassed,
          Math.floor((inv.end - inv.lastPaid) / DAY)
        );

        if (payableDays > 0) {
          const roi = payableDays * inv.daily;
          w.balance += roi;
          addTx(w, "roi", roi, "Nifelux daily earnings");
          inv.lastPaid += payableDays * DAY;
          changed = true;
        }
      }

      if (now >= inv.end) {
        inv.completed = true;
        changed = true;
      }
    }

    // LOMASHARES MATURITY
    if (inv.type === "LomaShares" && now >= inv.end) {
      const totalRoi = inv.daily * SHARE_DAYS;
      w.balance += inv.capital + totalRoi;

      addTx(w, "roi", totalRoi, "LomaShares ROI");
      addTx(w, "deposit", inv.capital, "LomaShares capital return");

      inv.completed = true;
      changed = true;
    }
  });

  if (changed) saveWallet(w);
}

/* ================= INVESTMENT RENDER ================= */
function renderInvestments() {
  const w = getWallet();
  const el = document.getElementById("investmentList");
  if (!el) return;

  if (!w.investments.length) {
    el.innerHTML = "<p>No active investments</p>";
    return;
  }

  el.innerHTML = w.investments.map(inv => `
    <div class="tx">
      <b>${inv.type}</b><br>
      Capital: ₦${inv.capital.toLocaleString()}<br>
      Daily: ₦${inv.daily.toLocaleString()}<br>
      Status: ${inv.completed ? "Completed" : "Running"}
    </div>
  `).join("");
}

/* ================= AUTO INIT ================= */
document.addEventListener("DOMContentLoaded", function () {
  processInvestments();
  renderWallet();
  renderInvestments();
});
