// Rasterize the design's app-icon.svg into a macOS .iconset (all required
// sizes) + a 1024 master. Run `iconutil -c icns` afterward to make icon.icns.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SVG = "public/assets/app-icon.svg";
const ISET = "build/icon.iconset";
fs.mkdirSync(ISET, { recursive: true });

const variants = [
  [16, "icon_16x16"], [32, "icon_16x16@2x"],
  [32, "icon_32x32"], [64, "icon_32x32@2x"],
  [128, "icon_128x128"], [256, "icon_128x128@2x"],
  [256, "icon_256x256"], [512, "icon_256x256@2x"],
  [512, "icon_512x512"], [1024, "icon_512x512@2x"],
];

for (const [px, name] of variants) {
  await sharp(SVG, { density: 1024 })
    .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ISET, `${name}.png`));
}
await sharp(SVG, { density: 1024 }).resize(1024, 1024).png().toFile("build/icon-1024.png");
console.log("iconset + master rendered (" + variants.length + " sizes)");
