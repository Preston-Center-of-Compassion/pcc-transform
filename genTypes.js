const { ParseResult, parse } = require("papaparse");
const fs = require("fs");

const csvFilePath = process.argv[2];

if (!csvFilePath) {
  process.exit(1);
}

const csv = fs.readFileSync(csvFilePath, { encoding: "utf-8" });

const result = parse(csv);

console.log(result.data[0]);

const headers = Array.from(new Set(result.data[0]));

fs.writeFileSync(
  "src/types.ts",
  `export const HEADERS = [${headers
    .map((h) => `"${h}"`)
    .join(", ")}] as const;\n`,
  {
    encoding: "utf-8",
  }
);
