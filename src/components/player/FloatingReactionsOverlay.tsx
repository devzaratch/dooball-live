'use client';

import { ReactionEvent } from '@/hooks/useLiveReactions';

interface FloatingReactionsOverlayProps {
    reactions: ReactionEvent[];
}

export default function FloatingReactionsOverlay({ reactions }: FloatingReactionsOverlayProps) {
    if (!reactions || reactions.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <style jsx>{`
                @keyframes floatUpAndFade {
                    0% {
                        opacity: 0;
                        transform: translateY(20px) scale(0.5) rotate(0deg);
                    }
                    15% {
                        opacity: 1;
                        transform: translateY(0px) scale(1.3) rotate(-10deg);
                    }
                    40% {
                        transform: translateY(-80px) scale(1.1) rotate(10deg);
                    }
                    80% {
                        opacity: 0.8;
                        transform: translateY(-180px) scale(1) rotate(-5deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-240px) scale(0.8) rotate(15deg);
                    }
                }
                .floating-emoji {
                    animation: floatUpAndFade 2.5s ease-out forwards;
                }
            `}</style>

            {reactions.map((item) => (
                <div
                    key={item.id}
                    className="absolute bottom-6 floating-emoji text-3xl sm:text-4xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] select-none"
                    style={{ left: `${item.xPercent}%` }}
                >
                    {item.emoji}
                </div>
            ))}
        </div>
    );
}
