/************************************
 * LomaShares Withdrawal Logic
 * Frontend-safe | Wapkiz Compatible
 ************************************/

/* ========= USER IDENTIFIER ========= */
const username = document.getElementById("user-name")?.content || "guest";
const WALLET_KEY = "wallet_" + username;
const ADMIN_QUEUE_KEY = "admin_withdrawals_queue";

const MIN_WITHDRAWAL = 1000;

/* ========= WALLET HELPERS ========= */
function getWallet() {
  const raw = JSON.parse(localStorage.getItem(WALLET_KEY));
  if (!raw) {
    const fresh = { balance: 0, txs: [], investments: [], savings: [] };
    localStorage.setItem(WALLET_KEY, JSON.stringify(fresh));
    return fresh;
  }
  raw.balance = Number(raw.balance) || 0;
  raw.txs = Array.isArray(raw.txs) ? raw.txs : [];
  raw.investments = Array.isArray(raw.investments) ? raw.investments : [];
  raw.savings = Array.isArray(raw.savings) ? raw.savings : [];
  return raw;
}

function saveWallet(w) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(w));
}

/* ========= ADMIN QUEUE ========= */
function getAdminQueue() {
  return JSON.parse(localStorage.getItem(ADMIN_QUEUE_KEY)) || [];
}

function saveAdminQueue(q) {
  localStorage.setItem(ADMIN_QUEUE_KEY, JSON.stringify(q));
}

/* ========= UI HELPERS ========= */
function renderBalance() {
  const w = getWallet();
  const el = document.getElementById("walletBalance");
  if (el) el.innerText = w.balance.toLocaleString();
}

/* ========= WITHDRAWAL ========= */
function submitWithdrawal() {
  const bank = document.getElementById("bankName").value;
  const acctNum = document.getElementById("accountNumber").value;
  const acctName = document.getElementById("accountName").value;
  const amount = Number(document.getElementById("withdrawAmount").value);

  if (!bank || !acctNum || !acctName) {
    alert("Please complete bank details");
    return;
  }

  if (acctNum.length !== 10) {
    alert("Account number must be 10 digits");
    return;
  }

  if (!amount || amount < MIN_WITHDRAWAL) {
    alert("Minimum withdrawal is ₦1,000");
    return;
  }

  const wallet = getWallet();

  if (wallet.balance < amount) {
    alert("Insufficient wallet balance");
    return;
  }

  /* Deduct immediately (held by admin) */
  wallet.balance -= amount;

  const withdrawalId = "WD-" + Date.now();

  /* Log user transaction */
  wallet.txs.push({
    id: withdrawalId,
    type: "withdrawal",
    amount: amount,
    status: "pending",
    time: Date.now(),
    note: "Withdrawal request submitted"
  });

  saveWallet(wallet);

  /* Add to admin approval queue */
  const adminQueue = getAdminQueue();

  adminQueue.push({
    id: withdrawalId,
    user: username,
    amount: amount,
    bank: bank,
    accountNumber: acctNum,
    accountName: acctName,
    status: "pending",
    requestedAt: Date.now(),
    site: "lomashares.wapaxo.com"
  });

  saveAdminQueue(adminQueue);

  /* UI feedback */
  const statusBox = document.getElementById("withdrawStatus");
  if (statusBox) statusBox.style.display = "block";

  renderBalance();
  alert("Withdrawal request submitted successfully");
}

/* ========= ADMIN APPROVAL HOOK ========= */
/*
  Admin dashboard should call this function
  when admin clicks APPROVE
*/
function adminApproveWithdrawal(withdrawalId) {
  const adminQueue = getAdminQueue();
  const req = adminQueue.find(x => x.id === withdrawalId);

  if (!req || req.status !== "pending") return;

  req.status = "approved";
  req.approvedAt = Date.now();

  saveAdminQueue(adminQueue);
}

/*
  Admin clicks MARK AS PAID
  (after manual Paystack transfer)
*/
function adminMarkPaid(withdrawalId) {
  const adminQueue = getAdminQueue();
  const req = adminQueue.find(x => x.id === withdrawalId);

  if (!req) return;

  req.status = "paid";
  req.paidAt = Date.now();
  saveAdminQueue(adminQueue);

  /* Update user wallet transaction */
  const userWalletKey = "wallet_" + req.user;
  const wallet = JSON.parse(localStorage.getItem(userWalletKey));
  if (wallet) {
    const tx = wallet.txs.find(t => t.id === withdrawalId);
    if (tx) tx.status = "paid";
    localStorage.setItem(userWalletKey, JSON.stringify(wallet));
  }
}

/* ========= INIT ========= */
document.addEventListener("DOMContentLoaded", () => {
  renderBalance();
  const btn = document.getElementById("withdrawBtn");
  if (btn) btn.addEventListener("click", submitWithdrawal);
});
