import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const IdentityCard = ({ archetype }) => {
    const cardRef = useRef(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { backgroundColor: null });
        const link = document.createElement('a');
        link.download = 'my-archetype.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="relative group perspective-1000 w-full max-w-md mx-auto">
            <div
                ref={cardRef}
                className="relative bg-gradient-to-br from-neutral-900 to-black border border-neutral-700 rounded-xl p-8 overflow-hidden shadow-2xl transition-transform duration-500 hover:rotate-y-12 hover:rotate-x-12 preserve-3d"
            >
                {/* Holographic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-shimmer"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">Subject Identity</div>

                    <h2 className="text-3xl font-bold text-white tracking-tight font-mono glow-text">
                        {archetype?.name || "UNKNOWN SUBJECT"}
                    </h2>

                    <div className="w-16 h-1 bg-red-600 rounded-full"></div>

                    <p className="text-neutral-400 text-sm leading-relaxed font-mono">
                        {archetype?.description || "Data insufficiency preventing profile generation."}
                    </p>

                    <div className="mt-6 pt-6 border-t border-neutral-800 w-full flex justify-between items-end">
                        <div className="text-[10px] text-neutral-600 font-mono">
                            ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br />
                            CAT: PSYCH_EVAL_04
                        </div>
                        <div className="h-8 w-8 bg-white/10 rounded-sm"></div>
                    </div>
                </div>

                {/* Scanlines */}
                <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>
            </div>

            <button
                onClick={handleDownload}
                className="mt-4 w-full py-2 text-xs font-mono text-neutral-500 hover:text-white transition-colors border border-transparent hover:border-neutral-700 rounded"
            >
                [ DOWNLOAD EVIDENCE ]
            </button>

            <style>{`
                .preserve-3d { transform-style: preserve-3d; }
                .glow-text { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                @keyframes shimmer {
                    0% { transform: translateX(-100%) translateY(-100%); }
                    100% { transform: translateX(100%) translateY(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2.5s infinite linear;
                }
            `}</style>
        </div>
    );
};

export default IdentityCard;
