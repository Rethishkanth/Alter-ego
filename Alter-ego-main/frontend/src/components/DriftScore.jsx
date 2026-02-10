import React from 'react';

const DriftScore = ({ score }) => {
    // score 0-100
    // 0 = perfectly aligned (silhouettes overlap)
    // 100 = massive drift (silhouettes far apart)

    // Calculate separation based on score
    // Max separation maybe 50px?
    const separation = Math.min(score, 100) * 0.8;

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="relative h-40 w-24 flex items-center justify-center">

                {/* Real Self (Ghostly) */}
                <div
                    className="absolute w-20 h-32 bg-neutral-800 rounded-full blur-[2px] opacity-50 transition-all duration-1000 ease-out"
                    style={{ transform: `translateX(-${separation}px)` }}
                >
                    <div className="absolute top-2 left-5 w-10 h-10 bg-black/20 rounded-full"></div>
                </div>

                {/* Presented Self (Solid) */}
                <div
                    className="absolute w-20 h-32 bg-white rounded-full mix-blend-screen transition-all duration-1000 ease-out z-10"
                    style={{ transform: `translateX(${separation}px)` }}
                >
                    <div className="absolute top-2 left-5 w-10 h-10 bg-black/10 rounded-full"></div>
                </div>

                {/* Connection Line */}
                <div
                    className="absolute h-[1px] bg-red-500/50 top-1/2 left-1/2 -translate-x-1/2 w-0 transition-all duration-1000"
                    style={{ width: `${separation * 2}px` }}
                ></div>

            </div>

            <div className="text-center">
                <div className="text-4xl font-bold text-white font-mono">{score.toFixed(1)}%</div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mt-2">Identity Drift</div>
            </div>
        </div>
    );
};

export default DriftScore;
