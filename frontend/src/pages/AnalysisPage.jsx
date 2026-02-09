import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';
import { analyzeService } from '../services/analyzeService';
import LoadingSpinner from '../components/LoadingSpinner';
import InsightCard from '../components/InsightCard';
import { Activity, Brain, CheckCircle } from 'lucide-react';

const AnalysisPage = () => {
    const navigate = useNavigate();
    const { status, statusMessage, jobId, isConnected } = useAnalysisStatus();
    const [hasStarted, setHasStarted] = useState(false);

    // Auto-start analysis if we just landed here from upload
    useEffect(() => {
        const start = async () => {
            if (isConnected && !hasStarted && (status === 'analyzing_pending' || status === 'idle')) {
                setHasStarted(true);
                try {
                    await analyzeService.startAnalysis();
                } catch (e) {
                    console.error("Failed to start analysis", e);
                }
            }
        };
        start();
    }, [hasStarted, status, isConnected]);

    useEffect(() => {
        if (status === 'completed') {
            // Add a small delay so user sees "Complete" before collecting results
            const timer = setTimeout(() => {
                navigate('/chat');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Analyzing Your Digital Footprint</h2>

            <div className="w-full max-w-2xl bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
                <div className="flex flex-col items-center space-y-8">
                    {status === 'completed' ? (
                        <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
                    ) : (
                        <LoadingSpinner />
                    )}

                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-medium">{statusMessage}</h3>
                        <p className="text-muted-foreground text-sm">
                            Constructing behavioral model...
                        </p>
                    </div>

                    {/* Progress Steps Visualization */}
                    <div className="w-full grid grid-cols-3 gap-4 mt-8">
                        <InsightCard
                            title="Sentiment"
                            value={['analyzing', 'completed'].includes(status) ? "Processing" : "Waiting"}
                            icon={Activity}
                            color={['analyzing', 'completed'].includes(status) ? "text-primary" : "text-neutral-600"}
                        />
                        <InsightCard
                            title="Clustering"
                            value={['analyzing', 'completed'].includes(status) ? "Grouping" : "Waiting"}
                            icon={Brain}
                            color={['analyzing', 'completed'].includes(status) ? "text-primary" : "text-neutral-600"}
                        />
                        <InsightCard
                            title="Persona"
                            value={status === 'completed' ? "Ready" : (['analyzing'].includes(status) ? "Generating" : "Waiting")}
                            icon={CheckCircle}
                            color={status === 'completed' ? "text-green-500" : "text-neutral-600"}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
