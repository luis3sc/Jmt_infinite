
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  console.error("Please set MAPBOX_TOKEN environment variable");
  process.exit(1);
}
const query = "provincia de lima";
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&bbox=-77.21,-12.35,-76.65,-11.70&language=es&types=place,locality,district,address`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error(err));
