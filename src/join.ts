// The spatial work. Three canonical operations, done in the database with
// PostGIS — not in application code — so they stay correct and fast at scale.
//   1. point-in-polygon  (ST_Contains)  -> assign each point its region
//   2. k-nearest          (<-> KNN)      -> nearest points to a location
//   3. distance buffer    (ST_DWithin)   -> points within N km of a location
import { pool } from "./db.ts";

// A reference location to demonstrate nearest / within (Kansas City-ish center).
const REF = { lng: -94.58, lat: 39.1, name: "reference point" };

async function pointInPolygon() {
  const { rowCount } = await pool.query(`
    UPDATE points p
    SET region = r.name
    FROM regions r
    WHERE ST_Contains(r.geom, p.geom)
  `);
  const summary = await pool.query(`
    SELECT COALESCE(region, '(none)') AS region, count(*)::int AS n
    FROM points GROUP BY region ORDER BY n DESC
  `);
  console.log(`\npoint-in-polygon: assigned ${rowCount} points`);
  for (const r of summary.rows) console.log(`  ${r.region.padEnd(10)} ${r.n}`);
}

async function nearest() {
  const res = await pool.query(
    `SELECT name,
            round(ST_Distance(geom::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000) AS km
     FROM points
     ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
     LIMIT 5`,
    [REF.lng, REF.lat]
  );
  console.log(`\n5 nearest points to ${REF.name}:`);
  for (const r of res.rows) console.log(`  ${r.name.padEnd(16)} ${r.km} km`);
}

async function withinRadius(km: number) {
  const res = await pool.query(
    `SELECT name
     FROM points
     WHERE ST_DWithin(geom::geography,
       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
     ORDER BY name`,
    [REF.lng, REF.lat, km * 1000]
  );
  console.log(`\npoints within ${km} km of ${REF.name}: ${res.rows.length}`);
  for (const r of res.rows) console.log(`  ${r.name}`);
}

async function main() {
  await pointInPolygon();
  await nearest();
  await withinRadius(1200);
  console.log("\nDone. Run `npm run serve` to view the result on a map.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
