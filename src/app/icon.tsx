import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const size = {
    width: 64,
    height: 64,
};

export const contentType = 'image/png';

export default async function Icon() {
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
        const logoBuffer = fs.readFileSync(logoPath);
        const base64Image = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        overflow: 'hidden',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={base64Image}
                        alt="DoBallLaos Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </div>
            ),
            {
                ...size,
            }
        );
    } catch {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 32,
                        background: '#0B0F17',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#E5B842',
                        borderRadius: '50%',
                    }}
                >
                    ⚽
                </div>
            ),
            { ...size }
        );
    }
}
