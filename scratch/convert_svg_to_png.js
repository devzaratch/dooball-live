const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertIcons() {
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    const svgPath = path.join(iconsDir, 'icon.svg');

    if (!fs.existsSync(svgPath)) {
        console.error('icon.svg not found!');
        return;
    }

    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 192x192 PNG
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(iconsDir, 'icon-192.png'));
    console.log('Generated public/icons/icon-192.png');

    // Generate 512x512 PNG
    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(iconsDir, 'icon-512.png'));
    console.log('Generated public/icons/icon-512.png');
}

convertIcons().catch(console.error);
