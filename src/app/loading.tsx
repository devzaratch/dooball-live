export default function Loading() {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen animate-pulse">
            {/* Hero skeleton */}
            <div className="h-48 sm:h-56 rounded-3xl bg-white/5 border border-white/10" />

            {/* Controls skeleton */}
            <div className="h-16 rounded-2xl bg-white/5 border border-white/10" />

            {/* Match list skeleton */}
            <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/10" />
                ))}
            </div>
        </div>
    );
}
