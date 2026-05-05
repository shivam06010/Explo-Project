import { promises as fs } from "fs";
import path from "path";

function parseCsv(raw) {
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
}

export async function GET() {
  try {
    const datasetPath = path.join(process.cwd(), "dataset.csv");
    const raw = await fs.readFile(datasetPath, "utf8");
    const rows = parseCsv(raw);
    return Response.json({ rows });
  } catch (error) {
    return Response.json(
      { error: "Unable to load dataset.csv", details: String(error) },
      { status: 500 }
    );
  }
}
