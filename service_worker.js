chrome.alarms.create("checkReminders", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkReminders") {
    chrome.storage.local.get(["tabs"], (result) => {
      const tabs = result.tabs || [];
      const now = new Date();

      tabs.forEach((t, index) => {
        if (t.remindAt && t.status === "active") {
          const remindTime = new Date(t.remindAt);

          if (remindTime <= now) {
            const notificationId = "tabmind_" + index;

            chrome.notifications.create(notificationId, {
              type: "basic",
              iconUrl: "icon.png",
              title: "TabMind Reminder",
              message: `You saved: ${t.title}`
            });

            tabs[index].remindAt = null;
          }
        }
      });

      chrome.storage.local.set({ tabs });
    });
  }
});

// 🔥 NEW PART — Notification Click Handler
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith("tabmind_")) {
    const index = parseInt(notificationId.replace("tabmind_", ""));

    chrome.storage.local.get(["tabs"], (result) => {
      const tabs = result.tabs || [];
      const tab = tabs[index];

      if (tab && tab.url) {
        chrome.tabs.create({ url: tab.url });
      }
    });
  }
});