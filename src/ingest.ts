// Ingest: apply the schema, then load the bundled GeoJSON into PostGIS.
// Swap the sample files for real data (US Census cartographic boundaries,
// Natural Earth, a parcel export, GTFS stops, ...) and this step is unchanged.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

type Feature = { properties: Record<string, unknown>; geometry: unknown };

async function loadGeoJSON(path: string): Promise<Feature[]> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw).features as Feature[];
}

async function main() {
  const schema = await readFile(join(here, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("schema applied");

  const regions = await loadGeoJSON(join(root, "data/sample-regions.geojson"));
  for (const f of regions) {
    await pool.query(
      `INSERT INTO regions (name, geom)
       VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))`,
      [f.properties.name, JSON.stringify(f.geometry)]
    );
  }
  console.log(`loaded ${regions.length} regions`);

  const points = await loadGeoJSON(join(root, "data/sample-points.geojson"));
  for (const f of points) {
    await pool.query(
      `INSERT INTO points (name, geom)
       VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))`,
      [f.properties.name, JSON.stringify(f.geometry)]
    );
  }
  console.log(`loaded ${points.length} points`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
