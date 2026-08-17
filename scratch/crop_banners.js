const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function cropBanners() {
    const srcPath = 'C:\\Users\\offie\\.gemini\\antigravity-ide\\brain\\411965cf-ae5f-4d42-821d-c3512ad488d4\\media__1786875730036.png';
    const adsDir = path.join(__dirname, '..', 'public', 'ads');

    if (!fs.existsSync(adsDir)) {
        fs.mkdirSync(adsDir, { recursive: true });
    }

    const inputBuffer = fs.readFileSync(srcPath);

    // Save main grid image
    await sharp(inputBuffer).toFile(path.join(adsDir, 'banners_grid.png'));

    // Image size: 1024 x 316
    // Row height ~ 98, Col width ~ 500, Gap ~ 14

    const coords = [
        { name: 'banner_1.png', left: 5, top: 10, width: 495, height: 92 },
        { name: 'banner_2.png', left: 512, top: 10, width: 495, height: 92 },
        { name: 'banner_3.png', left: 5, top: 112, width: 495, height: 92 },
        { name: 'banner_4.png', left: 512, top: 112, width: 495, height: 92 },
        { name: 'banner_5.png', left: 5, top: 214, width: 495, height: 92 },
        { name: 'banner_6.png', left: 512, top: 214, width: 495, height: 92 },
    ];

    for (const c of coords) {
        await sharp(inputBuffer)
            .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
            .toFile(path.join(adsDir, c.name));
        console.log(`Cropped ${c.name}`);
    }
}

cropBanners().catch(console.error);
