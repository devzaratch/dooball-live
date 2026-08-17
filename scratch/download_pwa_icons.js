const fs = require('fs');
const path = require('path');

async function downloadIcons() {
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const targets = [
        { name: 'icon-192.png', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=192&h=192&fit=crop&fm=png' },
        { name: 'icon-512.png', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=512&h=512&fit=crop&fm=png' },
    ];

    for (const t of targets) {
        try {
            console.log('Downloading', t.name, '...');
            const res = await fetch(t.url);
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(path.join(iconsDir, t.name), buffer);
                console.log('Saved', t.name, '(' + buffer.length + ' bytes)');
            } else {
                console.error('Failed to download', t.name, res.status);
            }
        } catch (err) {
            console.error('Error downloading', t.name, err.message);
        }
    }
}

downloadIcons();
