// Renders developer_report.md into index.html using template.html.
// Run: npm install && npm run build
import { readFileSync, writeFileSync } from "node:fs";
import { marked } from "marked";

const md = readFileSync("developer_report.md", "utf8");
const template = readFileSync("template.html", "utf8");
const html = marked.parse(md, { gfm: true });
writeFileSync("index.html", template.replace("<!--REPORT-->", () => html));
console.log("index.html written");
