const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processLogo() {
    const srcPath = path.join(__dirname, '..', 'public', 'logo.jpg');
    const publicDir = path.join(__dirname, '..', 'public');
    const iconsDir = path.join(publicDir, 'icons');

    if (!fs.existsSync(srcPath)) {
        console.error('public/logo.jpg not found!');
        return;
    }

    const inputBuffer = fs.readFileSync(srcPath);

    // Save main logo PNG
    await sharp(inputBuffer)
        .png()
        .toFile(path.join(publicDir, 'logo.png'));
    console.log('Generated public/logo.png');

    // Generate 192x192 PNG Icon for PWA
    await sharp(inputBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(iconsDir, 'icon-192.png'));
    console.log('Generated public/icons/icon-192.png');

    // Generate 512x512 PNG Icon for PWA
    await sharp(inputBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(iconsDir, 'icon-512.png'));
    console.log('Generated public/icons/icon-512.png');

    // Generate 32x32 Favicon PNG
    await sharp(inputBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon.png'));
    console.log('Generated public/favicon.png');
}

processLogo().catch(console.error);
