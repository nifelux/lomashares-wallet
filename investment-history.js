// ===== USER =====
const username = document.getElementById("user-name").content || "guest";
const WALLET_KEY = "wallet_" + username;

// ===== GET WALLET =====
function getWallet() {
  return JSON.parse(localStorage.getItem(WALLET_KEY)) || {
    balance: 0,
    investments: []
  };
}

// ===== FORMAT DATE =====
function formatDate(ts) {
  return new Date(ts).toLocaleDateString() + " " +
         new Date(ts).toLocaleTimeString();
}

// ===== RENDER =====
function renderHistory() {
  const wallet = getWallet();
  const list = document.getElementById("historyList");
  const filter = document.getElementById("typeFilter").value;

  if (!wallet.investments.length) {
    list.innerHTML = "<p>No investment records found.</p>";
    return;
  }

  let html = "";

  wallet.investments.forEach(inv => {

    if (filter !== "all" && !inv.type.includes(filter)) return;

    const status = inv.completed ? "Completed" : "Running";
    const cssClass = inv.completed ? "completed" : "running";

    let extra = "";
    if (inv.type === "LomaShares") {
      extra = `
        Shares Value: ₦${inv.capital.toLocaleString()}<br>
        Daily ROI: ₦${inv.daily.toLocaleString()}<br>
        Total ROI: ₦${(inv.daily * 40).toLocaleString()}
      `;
    } else {
      extra = `
        Daily Earnings: ₦${inv.daily.toLocaleString()}<br>
        Capital: Non-refundable
      `;
    }

    html += `
      <div class="card ${cssClass}">
        <b>${inv.type}</b><br><br>

        Investment ID: ${inv.id}<br>
        Start Date: ${formatDate(inv.start)}<br>
        End Date: ${formatDate(inv.end)}<br>

        ${extra}<br><br>

        Status: <b>${status}</b>
      </div>
    `;
  });

  list.innerHTML = html;
}

// ===== EVENTS =====
document.getElementById("typeFilter").addEventListener("change", renderHistory);

// ===== INIT =====
document.addEventListener("DOMContentLoaded", renderHistory);
