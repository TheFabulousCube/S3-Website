import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve(process.argv[2] || "website/config/contact.json");
const endpoint = process.env.CONTACT_API_ENDPOINT || "";
const apiKey = process.env.CONTACT_API_KEY || "";

if (!endpoint) {
  console.error("CONTACT_API_ENDPOINT is required.");
  process.exit(1);
}

const config = {
  endpoint,
};

if (apiKey) {
  config.apiKey = apiKey;
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
