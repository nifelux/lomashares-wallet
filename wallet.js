/*************************************************
 * LomaShares Wallet Engine (Frontend)
 * Paystack Enabled
 *************************************************/

const PAYSTACK_PUBLIC_KEY = "pk_live_cd8547f6b4270551729c247d8d31635691c39a08";

/* STORAGE KEYS */
const WALLET_KEY = "lomashares_wallet_balance";
const TX_KEY = "lomashares_wallet_transactions";

/* INITIALIZE */
if (!localStorage.getItem(WALLET_KEY)) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(0));
}
if (!localStorage.getItem(TX_KEY)) {
  localStorage.setItem(TX_KEY, JSON.stringify([]));
}

/* HELPERS */
function getWalletBalance() {
  return JSON.parse(localStorage.getItem(WALLET_KEY)) || 0;
}

function setWalletBalance(amount) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(amount));
}

function getTransactions() {
  return JSON.parse(localStorage.getItem(TX_KEY)) || [];
}

function saveTransaction(tx) {
  const txs = getTransactions();
  txs.push(tx);
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
}

/* FORMAT */
function formatNaira(amount) {
  return "₦" + amount.toLocaleString();
}

/*************************************************
 * PAYSTACK DEPOSIT
 *************************************************/
function fundWallet(amount, email = "user@lomashares.com") {
  amount = Number(amount);

  if (amount < 100) {
    alert("Minimum deposit is ₦100");
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: email,
    amount: amount * 100,
    currency: "NGN",
    ref: "LS_" + Date.now(),
    callback: function (response) {
      creditWallet(amount, response.reference);
      alert("Deposit successful");
    },
    onClose: function () {
      alert("Payment cancelled");
    }
  });

  handler.openIframe();
}

/*************************************************
 * WALLET CREDIT
 *************************************************/
function creditWallet(amount, ref = "SYSTEM") {
  const balance = getWalletBalance();
  const newBalance = balance + amount;

  setWalletBalance(newBalance);

  saveTransaction({
    type: "credit",
    amount: amount,
    reference: ref,
    balance: newBalance,
    date: new Date().toISOString()
  });

  updateWalletUI();
}

/*************************************************
 * WALLET DEBIT (USED BY SAVINGS / WITHDRAWAL)
 *************************************************/
function debitWallet(amount, reason = "Debit") {
  const balance = getWalletBalance();

  if (amount > balance) {
    alert("Insufficient wallet balance");
    return false;
  }

  const newBalance = balance - amount;
  setWalletBalance(newBalance);

  saveTransaction({
    type: "debit",
    amount: amount,
    reference: reason,
    balance: newBalance,
    date: new Date().toISOString()
  });

  updateWalletUI();
  return true;
}

/*************************************************
 * UI BINDING (OPTIONAL)
 *************************************************/
function updateWalletUI() {
  const el = document.getElementById("walletBalance");
  if (el) el.textContent = formatNaira(getWalletBalance());
}

/* AUTO INIT */
document.addEventListener("DOMContentLoaded", updateWalletUI);
