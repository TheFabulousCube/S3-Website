import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.resolve(
  __dirname,
  "../website/scripts/games/data/overrated-underrated-data.js",
);
const preferredPort = 3001;

function escapeJsString(value) {
  return JSON.stringify(value);
}

async function loadTopics() {
  const file = await fs.readFile(dataFilePath, "utf8");
  const match = file.match(
    /export\s+const\s+ouTopics\s*=\s*(\[[\s\S]*?\])\s*;?/m,
  );
  if (!match) {
    throw new Error("Unable to parse ouTopics array from data file.");
  }
  const arrayText = match[1];
  const sandbox = {};
  return vm.runInNewContext(`(${arrayText})`, sandbox);
}

function serializeTopics(topics) {
  const body = topics
    .map((entry) => {
      const topic = escapeJsString(entry.topic ?? "");
      const verdict = escapeJsString(entry.verdict ?? "");
      const note = escapeJsString(entry.note ?? "");
      return `  { topic: ${topic}, verdict: ${verdict}, note: ${note} }`;
    })
    .join(",\n");

  return `export const ouTopics = [\n${body}\n];\n`;
}

async function saveTopics(topics) {
  if (!Array.isArray(topics)) {
    throw new Error("Submitted payload must be an array.");
  }
  const normalized = topics.map((entry) => ({
    topic: String(entry.topic ?? ""),
    verdict: String(entry.verdict ?? ""),
    note: String(entry.note ?? ""),
  }));
  const content = serializeTopics(normalized);
  await fs.writeFile(dataFilePath, content, "utf8");
}

function sendJson(res, data, status = 200) {
  const payload = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload, "utf8"),
  });
  res.end(payload);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html, "utf8"),
  });
  res.end(html);
}

function getEditorPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Overrated / Underrated Editor</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 1rem;
      background: #111;
      color: #f0f0f0;
    }
    header {
      text-align: center;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.8rem, 2.4vw, 2.6rem);
    }
    .notice {
      margin: 0.5rem auto 1.5rem;
      max-width: 40rem;
      color: #bbb;
    }
    .toolbar {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .toolbar button {
      border: none;
      background: #1f8fff;
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.6rem;
      cursor: pointer;
      font-size: 1rem;
    }
    .toolbar button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .summary-card {
      background: #101025;
      border: 1px solid #3d3d6d;
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 1rem;
      max-width: 52rem;
      margin-left: auto;
      margin-right: auto;
    }
    .summary-card h2 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
    }
    .summary-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.4rem;
    }
    .summary-card li {
      padding: 0.6rem 0.75rem;
      background: #11112e;
      border-radius: 0.75rem;
      border: 1px solid #2c2c5a;
      font-size: 0.95rem;
      color: #ddd;
    }
    .editor-grid {
      display: grid;
      gap: 1rem;
      max-width: 52rem;
      margin: 0 auto;
    }
    .card {
      background: #14142c;
      border: 1px solid #2e2e54;
      border-radius: 0.9rem;
      padding: 0.95rem;
      box-shadow: 0 0 0.8rem rgba(0, 0, 0, 0.25);
    }
    .card h2 {
      margin: 0 0 0.6rem;
      font-size: 1rem;
    }
    .field {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .field label {
      font-size: 0.88rem;
      color: #ccc;
    }
    .field input[type=text],
    .field textarea,
    .field select {
      width: 100%;
      padding: 0.6rem;
      border-radius: 0.7rem;
      border: 1px solid #44456f;
      background: #11112a;
      color: #f5f5f5;
      font-size: 0.92rem;
      resize: vertical;
    }
    .field textarea {
      min-height: 4.5rem;
    }
    .row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
    }
    .small-button {
      border: none;
      background: #3c3cff;
      color: white;
      border-radius: 0.65rem;
      padding: 0.55rem 0.8rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .small-button.danger {
      background: #c23a3a;
    }
    .status {
      text-align: center;
      color: #a8ff9b;
      min-height: 1.4rem;
    }
    .error {
      color: #ff8b8b;
    }
    .hint {
      color: #8fa3ff;
    }
  </style>
</head>
<body>
  <header>
    <h1>Overrated / Underrated Editor</h1>
    <p class="notice">Edit entries and save them directly back to <code>website/scripts/games/data/overrated-underrated-data.js</code>.</p>
  </header>

  <div class="toolbar">
    <button id="reload-btn">Reload from file</button>
    <button id="save-btn">Save changes</button>
  </div>

  <div class="status" id="status"></div>

  <div class="summary-card">
    <h2>Topic summary</h2>
    <p class="hint">Current list of topics for quick reference.</p>
    <ul id="summary-list"></ul>
  </div>

  <div class="editor-grid" id="editor-grid"></div>

  <div class="card">
    <h2>Add new entry</h2>
    <div class="field">
      <label for="new-topic">Topic</label>
      <input type="text" id="new-topic" placeholder="French Fries" />
    </div>
    <div class="field">
      <label for="new-verdict">Verdict</label>
      <select id="new-verdict">
        <option value="Overrated">Overrated</option>
        <option value="Underrated">Underrated</option>
      </select>
    </div>
    <div class="field">
      <label for="new-note">Note</label>
      <textarea id="new-note" placeholder="Add a short note..."></textarea>
    </div>
    <button class="small-button" id="add-btn">Add entry</button>
  </div>

  <script>
    const editorGrid = document.getElementById("editor-grid");
    const statusEl = document.getElementById("status");
    const saveBtn = document.getElementById("save-btn");
    const reloadBtn = document.getElementById("reload-btn");
    const addBtn = document.getElementById("add-btn");
    const newTopic = document.getElementById("new-topic");
    const newVerdict = document.getElementById("new-verdict");
    const newNote = document.getElementById("new-note");

    let topics = [];

    function setStatus(message, isError = false) {
      statusEl.textContent = message;
      statusEl.className = isError ? "status error" : "status";
    }

    function createEntryCard(entry, index) {
      const card = document.createElement("div");
      card.className = "card";

      const title = document.createElement("h2");
      title.textContent = "Entry " + (index + 1);
      card.appendChild(title);

      const topicField = createField("Topic", "text", entry.topic);
      const verdictField = createSelectField("Verdict", entry.verdict);
      const noteField = createTextareaField("Note", entry.note);

      card.append(topicField.container, verdictField.container, noteField.container);

      const actions = document.createElement("div");
      actions.className = "row";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "small-button danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        topics.splice(index, 1);
        renderEntries();
        setStatus("Entry deleted.");
      });

      actions.appendChild(deleteBtn);
      card.appendChild(actions);

      topicField.input.addEventListener("input", () => {
        topics[index].topic = topicField.input.value;
      });
      verdictField.select.addEventListener("change", () => {
        topics[index].verdict = verdictField.select.value;
      });
      noteField.textarea.addEventListener("input", () => {
        topics[index].note = noteField.textarea.value;
      });

      return card;
    }

    function createField(labelText, type, value) {
      const container = document.createElement("div");
      container.className = "field";
      const label = document.createElement("label");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = type;
      input.value = value;
      container.append(label, input);
      return { container, input };
    }

    function createTextareaField(labelText, value) {
      const container = document.createElement("div");
      container.className = "field";
      const label = document.createElement("label");
      label.textContent = labelText;
      const textarea = document.createElement("textarea");
      textarea.value = value;
      container.append(label, textarea);
      return { container, textarea };
    }

    function createSelectField(labelText, selectedValue) {
      const container = document.createElement("div");
      container.className = "field";
      const label = document.createElement("label");
      label.textContent = labelText;
      const select = document.createElement("select");
      const optionOver = document.createElement("option");
      optionOver.value = "Overrated";
      optionOver.textContent = "Overrated";
      const optionUnder = document.createElement("option");
      optionUnder.value = "Underrated";
      optionUnder.textContent = "Underrated";
      select.append(optionOver, optionUnder);
      select.value = selectedValue || "Overrated";
      container.append(label, select);
      return { container, select };
    }

    function renderSummary() {
      const summaryList = document.getElementById("summary-list");
      summaryList.innerHTML = "";
      topics.forEach((entry, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = (index + 1) + ". " + entry.topic;
        summaryList.appendChild(listItem);
      });
      if (topics.length === 0) {
        const listItem = document.createElement("li");
        listItem.textContent = "No topics loaded.";
        summaryList.appendChild(listItem);
      }
    }

    function renderEntries() {
      editorGrid.innerHTML = "";
      if (topics.length === 0) {
        const emptyCard = document.createElement("div");
        emptyCard.className = "card";
        emptyCard.innerHTML = "<p class='hint'>No entries loaded. Add one and save.</p>";
        editorGrid.appendChild(emptyCard);
        renderSummary();
        return;
      }
      topics.forEach((entry, index) => {
        editorGrid.appendChild(createEntryCard(entry, index));
      });
      renderSummary();
    }

    async function fetchData() {
      setStatus("Loading data...");
      try {
        const response = await fetch("/api/data");
        if (!response.ok) throw new Error("Failed to load data: " + response.status);
        topics = await response.json();
        renderEntries();
        setStatus("Loaded " + topics.length + " entries.");
      } catch (error) {
        setStatus(error.message, true);
      }
    }

    async function saveData() {
      setStatus("Saving data...");
      saveBtn.disabled = true;
      reloadBtn.disabled = true;
      try {
        const response = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(topics),
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error("Save failed: " + response.status + " " + body);
        }
        setStatus("Saved successfully.");
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        saveBtn.disabled = false;
        reloadBtn.disabled = false;
      }
    }

    addBtn.addEventListener("click", () => {
      const entry = {
        topic: newTopic.value.trim(),
        verdict: newVerdict.value,
        note: newNote.value.trim(),
      };
      if (!entry.topic) {
        setStatus("Topic is required.", true);
        return;
      }
      topics.push(entry);
      newTopic.value = "";
      newNote.value = "";
      newVerdict.value = "Overrated";
      renderEntries();
      setStatus("New entry added.");
    });

    saveBtn.addEventListener("click", saveData);
    reloadBtn.addEventListener("click", fetchData);

    fetchData();
  </script>
</body>
</html>`;
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/") {
      sendHtml(res, getEditorPage());
      return;
    }

    if (url.pathname === "/api/data") {
      if (req.method === "GET") {
        const topics = await loadTopics();
        sendJson(res, topics);
        return;
      }
      if (req.method === "POST") {
        const payload = await parseRequestBody(req);
        if (!Array.isArray(payload)) {
          sendJson(res, { error: "Expected JSON array." }, 400);
          return;
        }
        await saveTopics(payload);
        sendJson(res, { success: true });
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.on("error", (error) => {
  if (error.code !== "EADDRINUSE" && error.code !== "EACCES") {
    throw error;
  }
  console.warn(
    `Port ${preferredPort} unavailable (${error.code}); falling back to a random free port.`,
  );
  server.listen(0);
});

server.listen(preferredPort, () => {
  const address = server.address();
  const port =
    address && typeof address === "object" ? address.port : preferredPort;
  console.log(
    `Overrated/Underrated editor running at http://localhost:${port}/`,
  );
  console.log(`Editing file: ${dataFilePath}`);
});
