// A tiny read API + static host for the map. Serves points and regions as
// GeoJSON straight from PostGIS (ST_AsGeoJSON), so the browser never touches
// the database directly.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { pool } from "./db.ts";

const app = new Hono();

async function asFeatureCollection(table: "points" | "regions") {
  const extra = table === "points" ? ", 'region', region" : "";
  const { rows } = await pool.query(`
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(geom)::json,
        'properties', json_build_object('name', name${extra})
      )), '[]'::json)
    ) AS fc
    FROM ${table}
  `);
  return rows[0].fc;
}

app.get("/api/points", async (c) => c.json(await asFeatureCollection("points")));
app.get("/api/regions", async (c) => c.json(await asFeatureCollection("regions")));
app.use("/*", serveStatic({ root: "./web" }));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`map + API on http://localhost:${port}`);
