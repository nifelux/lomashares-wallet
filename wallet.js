(function () {
  "use strict";

  // ===== GET USERNAME FROM WAPKIZ =====
  const userEl = document.getElementById("userData");
  if (!userEl || !userEl.dataset.username) {
    console.error("LomaShares: User not detected");
    return;
  }

  const USERNAME = userEl.dataset.username;
  const WALLET_KEY = "lomashares_wallet_" + USERNAME;

  // ===== WALLET CORE =====
  function getWallet() {
    return JSON.parse(localStorage.getItem(WALLET_KEY)) || {
      approved: 0,
      pending: 0,
      txs: []
    };
  }

  function saveWallet(wallet) {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    renderWallet();
  }

  // ===== UI RENDER =====
  function renderWallet() {
    const wallet = getWallet();

    const approvedEl = document.getElementById("approved");
    const pendingEl = document.getElementById("pending");
    const withdrawBtn = document.getElementById("withdrawBtn");
    const txList = document.getElementById("transactions");

    if (approvedEl) approvedEl.innerText = wallet.approved.toLocaleString();
    if (pendingEl) pendingEl.innerText = wallet.pending.toLocaleString();

    if (withdrawBtn) {
      withdrawBtn.disabled = wallet.approved < 1000;
    }

    if (txList) {
      if (wallet.txs.length === 0) {
        txList.innerHTML = "<p>No transactions yet</p>";
      } else {
        let html = "";
        wallet.txs.forEach(tx => {
          html += `
            <div class="tx">
              <strong>${tx.type}</strong> ₦${tx.amount.toLocaleString()}<br>
              <small>${tx.ref}</small><br>
              <span class="status ${tx.status.toLowerCase()}">${tx.status}</span>
            </div>
          `;
        });
        txList.innerHTML = html;
      }
    }
  }

  // ===== PAYSTACK DEPOSIT =====
  window.lomaPay = function () {
    const amountInput = document.getElementById("amount");
    if (!amountInput) return;

    const amount = Number(amountInput.value);
    if (!amount || amount < 100) {
      alert("Minimum deposit is ₦100");
      return;
    }

    const ref = "LS-" + Date.now();

    PaystackPop.setup({
      key: "pk_test_pk_test_1234567890abcdef", // 🔴 REPLACE WITH YOUR KEY
      email: USERNAME + "@lomashares.com",
      amount: amount * 100,
      currency: "NGN",
      ref: ref,
      callback: function () {
        const wallet = getWallet();
        wallet.pending += amount;
        wallet.txs.unshift({
          type: "Deposit",
          amount: amount,
          ref: ref,
          status: "Pending"
        });
        saveWallet(wallet);
        alert("Deposit submitted. Awaiting admin approval.");
      }
    }).openIframe();
  };

  // ===== WITHDRAW REQUEST =====
  window.lomaWithdraw = function () {
    const wallet = getWallet();
    const amount = Number(prompt("Enter withdrawal amount (₦)"));

    if (!amount || amount < 1000) {
      alert("Minimum withdrawal is ₦1,000");
      return;
    }

    if (amount > wallet.approved) {
      alert("Insufficient balance");
      return;
    }

    wallet.approved -= amount;
    wallet.txs.unshift({
      type: "Withdrawal",
      amount: amount,
      ref: "WD-" + Date.now(),
      status: "Pending"
    });

    saveWallet(wallet);
    alert("Withdrawal request submitted. Awaiting admin processing.");
  };

  // ===== INITIAL LOAD =====
  document.addEventListener("DOMContentLoaded", renderWallet);

})();
// ===== USER IDENTIFIER =====
const username = document.getElementById("user-name").content || "guest";
document.getElementById("usernameText").innerText = username;

// ===== WALLET KEY =====
const WALLET_KEY = "wallet_" + username;

// ===== CONFIG =====
const SHARE_PRICE = 1000;
const SHARE_RATE = 0.025;
const SHARE_DAYS = 40;

const NIFELUX = {
  1: { cost: 5000, daily: 1000, days: 7 },
  2: { cost: 13000, daily: 1500, days: 12 },
  3: { cost: 21000, daily: 2000, days: 15 }
};

// ===== STORAGE =====
function getWallet() {
  return JSON.parse(localStorage.getItem(WALLET_KEY)) || {
    balance: 0,
    investments: []
  };
}

function saveWallet(w) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  renderWallet();
}

// ===== UI =====
function renderWallet() {
  const w = getWallet();
  document.getElementById("balance").innerText = w.balance.toLocaleString();
}

// ===== LOMASHARES =====
function buyShares() {
  const shares = Number(document.getElementById("shareInput").value);
  if (!shares || shares < 1) return alert("Invalid shares");

  const cost = shares * SHARE_PRICE;
  const w = getWallet();
  if (w.balance < cost) return alert("Insufficient balance");

  w.balance -= cost;

  const now = Date.now();
  w.investments.push({
    id: "LS-" + now,
    type: "LomaShares",
    capital: cost,
    daily: cost * SHARE_RATE,
    start: now,
    end: now + SHARE_DAYS * 86400000,
    completed: false
  });

  saveWallet(w);
  alert("Investment started");
}

// ===== NIFELUX =====
function buyProduct(id) {
  const p = NIFELUX[id];
  const w = getWallet();
  if (w.balance < p.cost) return alert("Insufficient balance");

  w.balance -= p.cost;
  const now = Date.now();

  w.investments.push({
    id: "NF-" + now,
    type: "Nifelux",
    capital: p.cost,
    daily: p.daily,
    start: now,
    lastPaid: now,
    end: now + p.days * 86400000,
    completed: false
  });

  saveWallet(w);
}

// ===== AUTO PROCESS =====
function processInvestments() {
  const w = getWallet();
  const now = Date.now();
  let changed = false;

  w.investments.forEach(inv => {

    if (inv.completed) return;

    // NIFELUX DAILY CREDIT
    if (inv.type === "Nifelux") {
      const days = Math.floor((now - inv.lastPaid) / 86400000);
      if (days > 0) {
        w.balance += days * inv.daily;
        inv.lastPaid += days * 86400000;
        changed = true;
      }
      if (now >= inv.end) inv.completed = true;
    }

    // LOMASHARES MATURITY
    if (inv.type === "LomaShares" && now >= inv.end) {
      const profit = inv.daily * SHARE_DAYS;
      w.balance += inv.capital + profit;
      inv.completed = true;
      changed = true;
    }

  });

  if (changed) saveWallet(w);
}

// ===== RENDER INVESTMENTS =====
function renderInvestments() {
  const w = getWallet();
  const el = document.getElementById("investmentList");
  if (!w.investments.length) {
    el.innerHTML = "<p>No active investments</p>";
    return;
  }

  el.innerHTML = w.investments.map(i => `
    <div class="tx">
      <b>${i.type}</b><br>
      Capital: ₦${i.capital.toLocaleString()}<br>
      Daily: ₦${i.daily.toLocaleString()}<br>
      Status: ${i.completed ? "Completed" : "Running"}
    </div>
  `).join("");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  processInvestments();
  renderWallet();
  renderInvestments();
});
