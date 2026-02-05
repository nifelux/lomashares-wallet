/*****************************************
 * Admin Withdrawal Dashboard Logic
 *****************************************/

const ADMIN_QUEUE_KEY = "admin_withdrawals_queue";

function getAdminQueue() {
  return JSON.parse(localStorage.getItem(ADMIN_QUEUE_KEY)) || [];
}

function renderAdminWithdrawals() {
  const container = document.getElementById("withdrawalList");
  container.innerHTML = "";

  const queue = getAdminQueue().reverse();

  if (queue.length === 0) {
    container.innerHTML = "<p>No withdrawal requests</p>";
    return;
  }

  queue.forEach(req => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="row"><strong>User:</strong> ${req.user}</div>
      <div class="row"><strong>Amount:</strong> ₦${req.amount.toLocaleString()}</div>
      <div class="row"><strong>Bank:</strong> ${req.bank}</div>
      <div class="row"><strong>Account:</strong> ${req.accountName} (${req.accountNumber})</div>
      <div class="row">
        <strong>Status:</strong>
        <span class="badge ${req.status}">
          ${req.status.toUpperCase()}
        </span>
      </div>
      <div class="row">
        ${renderButtons(req)}
      </div>
    `;

    container.appendChild(card);
  });
}

function renderButtons(req) {
  if (req.status === "pending") {
    return `<button class="approve" onclick="approve('${req.id}')">Approve</button>`;
  }
  if (req.status === "approved") {
    return `<button class="pay" onclick="markPaid('${req.id}')">Mark as Paid</button>`;
  }
  return `<button class="disabled">Completed</button>`;
}

function approve(id) {
  if (!confirm("Approve this withdrawal?")) return;
  adminApproveWithdrawal(id);
  renderAdminWithdrawals();
}

function markPaid(id) {
  if (!confirm("Confirm payment sent?")) return;
  adminMarkPaid(id);
  renderAdminWithdrawals();
}

/* Auto refresh every 10 seconds */
setInterval(renderAdminWithdrawals, 10000);

/* Init */
document.addEventListener("DOMContentLoaded", renderAdminWithdrawals);
