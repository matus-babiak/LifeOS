// Vygeneruje PNG ikony z src/app/icon.svg (spustiť: node scripts/generate-icons.mjs)
import sharp from "sharp";

const src = "src/app/icon.svg";

await sharp(src).resize(180, 180).png().toFile("src/app/apple-icon.png");
await sharp(src).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(src).resize(512, 512).png().toFile("public/icon-512.png");

console.log("Ikony vygenerované: apple-icon.png, icon-192.png, icon-512.png");
