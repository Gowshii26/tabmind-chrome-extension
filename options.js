const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const statusFilterEl = document.getElementById("statusFilter");

let allTabs = [];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function isOverdue(remindAtISO) {
  if (!remindAtISO) return false;
  const t = new Date(remindAtISO).getTime();
  return !isNaN(t) && t <= Date.now();
}

function snoozeISO(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function render(tabs) {
  listEl.innerHTML = "";

  if (!tabs.length) {
    listEl.innerHTML = `<div class="empty">No tabs found for this filter/search.</div>`;
    return;
  }

  tabs.forEach((t) => {
    const idx = allTabs.indexOf(t); // reference back to master list
    const overdue = isOverdue(t.remindAt);

    const div = document.createElement("div");
    div.className = "tab";

    const reminderPill = t.remindAt
      ? `<span class="pill ${overdue ? "warn" : "ok"}">Remind: ${formatDate(t.remindAt)}${overdue ? " (overdue)" : ""}</span>`
      : `<span class="pill">No reminder</span>`;

    div.innerHTML = `
      <div class="title">${t.title || "Untitled"}</div>
      <div class="meta">${t.url || ""}</div>
      <div class="meta">
        <span class="pill">Status: ${t.status}</span>
        ${reminderPill}
        <span class="pill">Saved: ${formatDate(t.createdAt)}</span>
      </div>

      <div class="note"><b>Why:</b> ${t.note ? t.note : "<i>(no note)</i>"}</div>

      <div class="btns">
        <button class="open">Open</button>
        <button class="snooze">Snooze 30m</button>
        <button class="clear">Clear Reminder</button>
        <button class="done">Mark Done</button>
        <button class="del">Delete</button>
      </div>
    `;

    div.querySelector(".open").addEventListener("click", () => {
      chrome.tabs.create({ url: t.url });
    });

    div.querySelector(".snooze").addEventListener("click", async () => {
      allTabs[idx].remindAt = snoozeISO(30);
      await saveAll();
      load();
    });

    div.querySelector(".clear").addEventListener("click", async () => {
      allTabs[idx].remindAt = null;
      await saveAll();
      load();
    });

    div.querySelector(".done").addEventListener("click", async () => {
      allTabs[idx].status = "done";
      await saveAll();
      load();
    });

    div.querySelector(".del").addEventListener("click", async () => {
      allTabs.splice(idx, 1);
      await saveAll();
      load();
    });

    listEl.appendChild(div);
  });
}

function saveAll() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ tabs: allTabs }, resolve);
  });
}

function applyFilters() {
  const q = (searchEl.value || "").toLowerCase().trim();
  const status = statusFilterEl.value;

  let filtered = allTabs;

  if (status !== "all") {
    filtered = filtered.filter(t => (t.status || "active") === status);
  }

  if (q) {
    filtered = filtered.filter((t) =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.url || "").toLowerCase().includes(q) ||
      (t.note || "").toLowerCase().includes(q)
    );
  }

  render(filtered);
}

function load() {
  chrome.storage.local.get(["tabs"], (result) => {
    allTabs = result.tabs || [];
    applyFilters();
  });
}

searchEl.addEventListener("input", applyFilters);
statusFilterEl.addEventListener("change", applyFilters);

load();