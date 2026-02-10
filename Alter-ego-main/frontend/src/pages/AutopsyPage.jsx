import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import IdentityCard from '../components/IdentityCard';
import BiasChart from '../components/BiasChart';
import DriftScore from '../components/DriftScore';
import { API_BASE_URL } from '../config/api';

const AutopsyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const jobId = searchParams.get('jobId'); // Expect ?jobId=...

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAutopsy = async () => {
            try {
                // If jobId is missing, try to get the latest one by calling generate without ID? 
                // Or proper flow: call generate with whatever we have.
                // Our updated backend handles missing job_id by finding latest.

                const url = jobId
                    ? `${API_BASE_URL}/autopsy/generate?job_id=${jobId}`
                    : `${API_BASE_URL}/autopsy/generate`; // Backend will default to latest

                const response = await fetch(url, { method: 'POST' });

                if (!response.ok) {
                    if (response.status === 404) throw new Error("No analysis history found.");
                    throw new Error("Autopsy generation failed.");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAutopsy();
    }, [jobId]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center space-y-4 text-green-500 font-mono">
                <div className="w-12 h-12 border-4 border-green-900 border-t-green-500 rounded-full animate-spin"></div>
                <div className="animate-pulse">RUNNING PSYCHOLOGICAL EVALUATION...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-red-500 font-mono">
                <div className="text-3xl">AUTOPSY FAILED</div>
                <div className="text-sm mt-2">{error}</div>
                <button onClick={() => navigate('/')} className="mt-8 px-4 py-2 border border-red-900 hover:bg-red-900/20 rounded">
                    RETURN TO SAFETY
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black text-white overflow-y-auto overflow-x-hidden relative p-8 scrollbar-hide">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            <div className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-20 bg-noise animate-noise"></div>

            {/* Header */}
            <header className="relative z-10 flex justify-between items-center mb-12 border-b border-neutral-800 pb-4">
                <h1 className="text-2xl font-mono tracking-widest uppercase text-neutral-400">
                    Phase 4 <span className="text-white mx-2">|</span> The Autopsy
                </h1>
                <button
                    onClick={() => navigate('/chat')}
                    className="text-xs font-mono text-neutral-500 hover:text-white transition-colors"
                >
                    [ RETURN TO INTERVIEW ]
                </button>
            </header>

            {/* Grid Layout */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">

                {/* 1. Identity Card (Centerpiece) - Spans 4 cols */}
                <div className="lg:col-span-4 lg:col-start-5 flex flex-col items-center justify-center">
                    <IdentityCard archetype={data?.archetype} />
                </div>

                {/* 2. Bias Chart - Left Side - Spans 4 cols */}
                <div className="lg:col-span-4 lg:col-start-1 bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm uppercase tracking-widest text-green-500 mb-6 font-mono border-b border-green-900/30 pb-2">
                        Cognitive Bias Map
                    </h3>
                    <BiasChart data={data?.biases || []} />
                </div>

                {/* 3. Drift Score - Right Side - Spans 4 cols */}
                <div className="lg:col-span-4 lg:col-start-9 bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center">
                    <h3 className="text-sm uppercase tracking-widest text-red-500 mb-6 font-mono w-full text-left border-b border-red-900/30 pb-2">
                        Self-Perception Drift
                    </h3>
                    <DriftScore score={data?.drift_score || 0} />
                </div>

                {/* 4. Raw Data / Notes (Optional bottom row) */}
                <div className="lg:col-span-12 mt-8">
                    <div className="p-4 border border-neutral-800 rounded bg-black/50 font-mono text-xs text-neutral-600">
                        <p>AUTOPSY_ID: {jobId}</p>
                        <p>TIMESTAMP: {new Date().toISOString()}</p>
                        <p>STATUS: CASE_CLOSED</p>
                    </div>
                </div>

            </div>

            <style>{`
                .bg-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opactiy='1'/%3E%3C/svg%3E"); }
            `}</style>
        </div>
    );
};

export default AutopsyPage;
