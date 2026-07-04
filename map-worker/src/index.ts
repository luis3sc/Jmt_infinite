import { PMTiles, ResolvedValueCache } from "pmtiles";

interface Env {
  BUCKET: R2Bucket;
  ALLOWED_ORIGINS?: string;
}

class R2Source {
  bucket: R2Bucket;
  key: string;

  constructor(bucket: R2Bucket, key: string) {
    this.bucket = bucket;
    this.key = key;
  }

  async getBytes(offset: number, length: number) {
    const obj = await this.bucket.get(this.key, {
      range: { offset, length }
    });
    if (!obj) {
      throw new Error(`R2 Object not found: ${this.key}`);
    }
    const buffer = await obj.arrayBuffer();
    return { data: buffer };
  }

  getKey() {
    return this.key;
  }
}

const cache = new ResolvedValueCache();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const allowedOrigin = env.ALLOWED_ORIGINS || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Match /peru/14/4192/9021.pbf or /peru/14/4192/9021.mvt
    const match = url.pathname.match(/^\/([a-zA-Z0-9_\-\.]+)\/(\d+)\/(\d+)\/(\d+)\.(pbf|mvt)$/);

    if (match) {
      const [_, filename, zStr, xStr, yStr] = match;
      const z = parseInt(zStr);
      const x = parseInt(xStr);
      const y = parseInt(yStr);

      const key = filename.endsWith(".pmtiles") ? filename : `${filename}.pmtiles`;
      const source = new R2Source(env.BUCKET, key);
      const pmtiles = new PMTiles(source, cache);

      try {
        const tile = await pmtiles.getZxy(z, x, y);
        if (tile) {
          return new Response(tile.data, {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/x-protobuf",
              "Content-Encoding": "gzip",
              "Cache-Control": "public, max-age=31536000, immutable",
            }
          });
        }
        // No Content (blank tile)
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch (err: any) {
        return new Response(err.message, { status: 500, headers: corsHeaders });
      }
    }

    // Support TileJSON: /peru.json
    const jsonMatch = url.pathname.match(/^\/([a-zA-Z0-9_\-\.]+)\.json$/);
    if (jsonMatch) {
      const [_, filename] = jsonMatch;
      const key = filename.endsWith(".pmtiles") ? filename : `${filename}.pmtiles`;
      const source = new R2Source(env.BUCKET, key);
      const pmtiles = new PMTiles(source, cache);

      try {
        const header = await pmtiles.getHeader();
        const tilejson = {
          tilejson: "3.0.0",
          scheme: "xyz",
          tiles: [`${url.origin}/${filename}/{z}/{x}/{y}.pbf`],
          vector_layers: [],
          bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
          center: [header.centerLon, header.centerLat, header.centerZoom],
          minzoom: header.minZoom,
          maxzoom: header.maxZoom,
        };
        return new Response(JSON.stringify(tilejson), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          }
        });
      } catch (err: any) {
        return new Response(err.message, { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
