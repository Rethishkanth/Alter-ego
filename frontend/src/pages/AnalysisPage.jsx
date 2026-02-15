import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';
import { analyzeService } from '../services/analyzeService';

const AnalysisPage = () => {
    const navigate = useNavigate();
    const { status, isConnected } = useAnalysisStatus();
    const [hasStarted, setHasStarted] = useState(false);
    const [typingMessage, setTypingMessage] = useState("");
    const [messageIndex, setMessageIndex] = useState(0);
    const [isExpanding, setIsExpanding] = useState(false);

    const messages = [
        "Quantifying Dopamine Triggers...",
        "Separating Truth from Performance...",
        "Constructing Behavioral Model...",
        "Calibrating Digital Persona..."
    ];

    // Auto-start analysis
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

    // Completion Handler -> CRT Expand Animation
    useEffect(() => {
        if (status === 'completed') {
            setIsExpanding(true); // Trigger CRT animation

            // Wait for animation (0.8s) + slight delay before nav
            const timer = setTimeout(() => {
                navigate('/chat');
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    // Typing Effect Loop
    useEffect(() => {
        if (isExpanding) return; // Stop typing during transition

        let currentMsg = messages[messageIndex % messages.length];
        let charIndex = 0;
        let typeInterval;
        let nextMsgTimeout;

        const typeChar = () => {
            setTypingMessage(currentMsg.substring(0, charIndex + 1));
            charIndex++;
            if (charIndex < currentMsg.length) {
                typeInterval = setTimeout(typeChar, 50); // Typing speed
            } else {
                // Message complete, wait then next message
                nextMsgTimeout = setTimeout(() => {
                    setMessageIndex(prev => prev + 1);
                }, 2000);
            }
        };

        typeChar();

        return () => {
            clearTimeout(typeInterval);
            clearTimeout(nextMsgTimeout);
        };
    }, [messageIndex, isExpanding]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-mono">
            {/* Film Grain Overlay - Reused from global CSS */}
            <div className="film-grain"></div>

            {/* Content Container */}
            <div className={`relative z-10 flex flex-col items-center transition-opacity duration-500 ${isExpanding ? 'opacity-100' : 'opacity-100'}`}>

                {/* The Line */}
                <div
                    className={`bg-white shadow-[0_0_10px_white] transition-all duration-300
                    ${isExpanding ? 'animate-crt-expand' : 'h-[1px] w-64 animate-heartbeat'}
                    `}
                ></div>

                {/* System Text */}
                {!isExpanding && (
                    <div className="mt-8 h-8 text-center">
                        <p className="text-xs tracking-widest text-neutral-400 uppercase">
                            {typingMessage}<span className="animate-pulse">_</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPage;
