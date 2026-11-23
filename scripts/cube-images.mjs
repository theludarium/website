// Refreshes src/data/cube-images.json: each Cube's image link and artist from Cube Cobra.
// Images stay on their original host; this file only stores the links.
// Run: node scripts/cube-images.mjs
import { readFile, writeFile } from 'node:fs/promises';

const cubes = JSON.parse(await readFile('src/data/cube-library.json', 'utf8'));
const out = {};
for (const cube of cubes) {
  const id = cube.listUrl.match(/cubecobra\.com\/cube\/overview\/([^/?]+)/)?.[1];
  if (!id) continue;
  try {
    const res = await fetch(`https://cubecobra.com/cube/api/cubeJSON/${encodeURIComponent(id)}`, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheLudarium/1.0)' } });
    if (!res.ok) throw new Error(String(res.status));
    const { image } = await res.json();
    if (image?.uri?.startsWith('https://')) out[cube.listUrl] = { src: image.uri, artist: image.artist ?? null };
  } catch (err) {
    console.error(`No image for ${cube.name}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 800));
}
await writeFile('src/data/cube-images.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(`${Object.keys(out).length} of ${cubes.length} Cubes have an image`);
