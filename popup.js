function getISOFromDatetimeLocal(value) {
  // datetime-local gives "YYYY-MM-DDTHH:mm"
  // Convert to ISO using local time
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function saveTab({ remindAtISO }) {
  const note = document.getElementById("note").value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    const tabData = {
      url: currentTab.url,
      title: currentTab.title,
      note,
      createdAt: new Date().toISOString(),
      remindAt: remindAtISO,   // null if no reminder
      status: "active"
    };

    chrome.storage.local.get(["tabs"], (result) => {
      const savedTabs = result.tabs || [];
      savedTabs.push(tabData);

      chrome.storage.local.set({ tabs: savedTabs }, () => {
        document.getElementById("status").textContent = remindAtISO
          ? "Saved with reminder!"
          : "Tab saved!";
        document.getElementById("note").value = "";
        document.getElementById("remindAt").value = "";
      });
    });
  });
}

document.getElementById("saveBtn").addEventListener("click", () => {
  saveTab({ remindAtISO: null });
});

document.getElementById("saveWithReminderBtn").addEventListener("click", () => {
  const dtValue = document.getElementById("remindAt").value;
  const remindAtISO = getISOFromDatetimeLocal(dtValue);

  if (!remindAtISO) {
    document.getElementById("status").textContent =
      "Pick a valid date & time first (or use Save No Reminder).";
    return;
  }

  // Basic validation: don’t allow past times
  if (new Date(remindAtISO).getTime() <= Date.now()) {
    document.getElementById("status").textContent =
      "Reminder time must be in the future.";
    return;
  }

  saveTab({ remindAtISO });
});