const SLOT_COUNT = 7;

async function getKeyboardShortcuts() {
    return new Promise((resolve) => {
        chrome.commands.getAll((commands) => {
            const shortcuts = {};
            commands.forEach((cmd) => {
                shortcuts[cmd.name] = cmd.shortcut || "Not set";
            });
            resolve(shortcuts);
        });
    });
}

async function buildFields(shortcuts, descriptions) {
    const container = document.getElementById("fields");
    container.innerHTML = "";

    const keys = await getKeyboardShortcuts();

    for (let i = 1; i <= SLOT_COUNT; i++) {
        const key = `shortcut-${i}`;
        const row = document.createElement("tr");
        row.innerHTML = `
      <td><span class="key-display">${keys[key] || "Not set"}</span></td>
      <td><input type="text" id="${key}-desc" placeholder="e.g. Order Admin" value="${descriptions[key] || ""}" size="50"></td>
      <td><input type="text" id="${key}" placeholder="e.g. index.aspx?templ=..." value="${shortcuts[key] || ""}" size="50"></td>
    `;
        container.appendChild(row);
    }
}

function save() {
    const shortcuts = {};
    const descriptions = {};

    for (let i = 1; i <= SLOT_COUNT; i++) {
        const key = `shortcut-${i}`;
        shortcuts[key] = document.getElementById(key).value.trim();
        descriptions[key] = document.getElementById(`${key}-desc`).value.trim();
    }

    chrome.storage.sync.set({ shortcuts, descriptions }, () => {
        const status = document.getElementById("status");
        status.textContent = "Saved!";
        setTimeout(() => (status.textContent = ""), 2000);
    });
}

document.getElementById("save").addEventListener("click", save);

chrome.storage.sync.get(["shortcuts", "descriptions"], (data) => {
    buildFields(data.shortcuts || {}, data.descriptions || {});
});