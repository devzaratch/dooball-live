export default function WatchLoading() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-6 p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
            
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block w-full h-[calc(100vh-120px)] bg-[#0B0F17]/90 rounded-2xl animate-pulse border border-white/10" />

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Scoreboard Skeleton */}
                <div className="h-28 w-full rounded-2xl bg-[#0B0F17]/90 animate-pulse border border-white/10 p-6 flex justify-between items-center">
                    <div className="h-16 w-16 bg-white/5 rounded-full"></div>
                    <div className="h-10 w-48 bg-white/5 rounded-lg"></div>
                    <div className="h-16 w-16 bg-white/5 rounded-full"></div>
                </div>

                {/* Video Player Skeleton */}
                <div className="w-full aspect-video bg-[#0B0F17]/90 rounded-2xl animate-pulse border border-white/10 flex items-center justify-center">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#E5B842] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>

            {/* Chat Skeleton */}
            <div className="h-[500px] lg:h-[calc(100vh-120px)] w-full bg-[#0B0F17]/90 rounded-2xl animate-pulse border border-white/10 flex flex-col justify-between p-4">
                <div className="h-12 w-full bg-white/5 rounded-xl"></div>
                <div className="space-y-4 w-full opacity-50">
                    <div className="h-6 w-3/4 bg-white/5 rounded-md"></div>
                    <div className="h-6 w-1/2 bg-white/5 rounded-md"></div>
                    <div className="h-6 w-full bg-white/5 rounded-md"></div>
                </div>
                <div className="h-12 w-full bg-white/5 rounded-xl"></div>
            </div>
            
        </div>
    );
}