(function () {
  "use strict";

  /* ===== PAYSTACK KEY ===== */
  const PAYSTACK_PUBLIC_KEY =
    "pk_live_cd8547f6b4270551729c247d8d31635691c39a08";

  /* ===== GET USERNAME FROM WAPKIZ ===== */
  const userEl = document.getElementById("userData");
  if (!userEl || !userEl.dataset.username) {
    console.error("LomaShares: User not detected");
    return;
  }

  const USERNAME = userEl.dataset.username;
  const WALLET_KEY = "lomashares_wallet_" + USERNAME;

  /* ===== WALLET CORE ===== */
  function getWallet() {
    return (
      JSON.parse(localStorage.getItem(WALLET_KEY)) || {
        approved: 0,
        pending: 0,
        txs: []
      }
    );
  }

  function saveWallet(wallet) {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    renderWallet();
  }

  /* ===== UI RENDER ===== */
  function renderWallet() {
    const wallet = getWallet();

    const approvedEl = document.getElementById("approved");
    const pendingEl = document.getElementById("pending");
    const withdrawBtn = document.getElementById("withdrawBtn");
    const txList = document.getElementById("transactions");

    if (approvedEl)
      approvedEl.textContent = "₦" + wallet.approved.toLocaleString();

    if (pendingEl)
      pendingEl.textContent = "₦" + wallet.pending.toLocaleString();

    if (withdrawBtn) {
      withdrawBtn.disabled = wallet.approved < 1000;
    }

    if (txList) {
      if (wallet.txs.length === 0) {
        txList.innerHTML = "<p>No transactions yet</p>";
      } else {
        txList.innerHTML = wallet.txs
          .map(
            (tx) => `
            <div class="tx">
              <strong>${tx.type}</strong> — ₦${tx.amount.toLocaleString()}<br>
              <small>${tx.ref}</small><br>
              <span class="status ${tx.status.toLowerCase()}">${tx.status}</span>
            </div>
          `
          )
          .join("");
      }
    }
  }

  /* ===== PAYSTACK DEPOSIT ===== */
  window.lomaPay = function () {
    if (typeof PaystackPop === "undefined") {
      alert("Payment system not loaded. Please refresh the page.");
      return;
    }

    const amountInput = document.getElementById("amount");
    if (!amountInput) return;

    const amount = Number(amountInput.value);
    if (!amount || amount < 100) {
      alert("Minimum deposit is ₦100");
      return;
    }

    const ref = "LS-" + Date.now();

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
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
        alert("Deposit successful. Awaiting admin approval.");
      },
      onClose: function () {
        alert("Payment cancelled");
      }
    });

    handler.openIframe();
  };

  /* ===== WITHDRAW REQUEST ===== */
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
    alert("Withdrawal request submitted.");
  };

  document.addEventListener("DOMContentLoaded", renderWallet);
})();
