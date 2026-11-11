// Loads the pipeline output (regions + points, each tagged with its region by
// the PostGIS spatial join) and renders it. OSM raster basemap = no API key.
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  },
  center: [-96, 38],
  zoom: 3.3,
});

const REGION_COLORS = [
  "match", ["get", "region"],
  "West", "#e6194b",
  "Central", "#3cb44b",
  "East", "#4363d8",
  "#999999",
];

map.on("load", async () => {
  const [regions, points] = await Promise.all([
    fetch("/api/regions").then((r) => r.json()),
    fetch("/api/points").then((r) => r.json()),
  ]);

  map.addSource("regions", { type: "geojson", data: regions });
  map.addLayer({
    id: "regions-fill", type: "fill", source: "regions",
    paint: { "fill-color": REGION_COLORS, "fill-opacity": 0.08 },
  });
  map.addLayer({
    id: "regions-line", type: "line", source: "regions",
    paint: { "line-color": "#666", "line-dasharray": [2, 2] },
  });

  map.addSource("points", { type: "geojson", data: points });
  map.addLayer({
    id: "points", type: "circle", source: "points",
    paint: {
      "circle-radius": 6,
      "circle-color": REGION_COLORS,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#fff",
    },
  });

  map.on("click", "points", (e) => {
    const p = e.features[0].properties;
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${p.name}</strong><br/>region: ${p.region ?? "(none)"}`)
      .addTo(map);
  });
  map.on("mouseenter", "points", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "points", () => (map.getCanvas().style.cursor = ""));
});
