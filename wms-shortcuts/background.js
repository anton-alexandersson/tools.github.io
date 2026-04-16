
// Default shortcuts — editable via the options page
const DEFAULT_SHORTCUTS = {
    "shortcut-1": "index.aspx?templ=AdminTempl/AdminViewOrder.ascx&H",
    "shortcut-2": "",
    "shortcut-3": "",
    "shortcut-4": "",
    "shortcut-5": "", 
    "shortcut-6": "",
    "shortcut-7": ""

};

// Initialise storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get("shortcuts", (data) => {
        if (!data.shortcuts) {
        chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS });
        }
    });
});

// Parse the current URL and determine the database name and base URL pattern
function parseWmsUrl(url) {
    try {
        const u = new URL(url);
        const hostname = u.hostname;

        // Pattern 1: https://wms1.ongoingsystems.se/{dbName}/...
        if (hostname === "wms1.ongoingsystems.se") {
            const path = u.pathname.replace(/^\//, "");
            const parts = path.split("/");
            const dbName = parts.length > 0 ? parts[0] : null;
            if (!dbName) return null;

            return {
                dbName,
                baseUrl: "https://wms1.ongoingsystems.se/"
            };
        }

        // Pattern 2: https://{dbName}.ongoingsystems.se/{dbName}/...
        if (hostname.endsWith(".ongoingsystems.se")) {
            const dbName = hostname.split(".")[0];
            if (!dbName) return null;

            return {
                dbName,
                baseUrl: `https://${dbName}.ongoingsystems.se/`
            };
        }

        return null;
    } catch {
        return null;
    }
}

// Listen for every registered command
chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.url) return;

        const parsed = parseWmsUrl(tab.url);
        if (!parsed) return; // not on a WMS site

        chrome.storage.sync.get("shortcuts", (data) => {
            const path = data.shortcuts?.[command];
            if (!path) return;

            const target = `${parsed.baseUrl}${parsed.dbName}/index.aspx?templ=${path}`;
            chrome.tabs.update(tab.id, { url: target });
        });
    });
});