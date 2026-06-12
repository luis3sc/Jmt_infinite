export const MAP_PROVIDER = (process.env.NEXT_PUBLIC_MAP_PROVIDER || "mapbox") as "mapbox" | "maplibre";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export const MAPBOX_STYLE = "mapbox://styles/luis3sc/cmkew1btx007x01qq60hf55ok";

// CartoDB Positron is a clean, open-source style suitable for commercial DOOH maps
export const MAPLIBRE_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const DEFAULT_MAP_STYLE = MAP_PROVIDER === "maplibre" ? MAPLIBRE_STYLE : MAPBOX_STYLE;
