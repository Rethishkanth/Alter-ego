import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadService } from '../services/uploadService';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';

const UploadPage = () => {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [glitchState, setGlitchState] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [binaryText, setBinaryText] = useState("");
    const fileInputRef = useRef(null);

    // Glitch Effect Loop
    useEffect(() => {
        let timeoutId;
        const triggerGlitch = () => {
            setGlitchState(true);
            setTimeout(() => setGlitchState(false), 200); // Glitch lasts 200ms

            // Random next interval between 4s and 6s
            const nextInterval = Math.random() * (2000) + 4000;
            timeoutId = setTimeout(triggerGlitch, nextInterval);
        };

        timeoutId = setTimeout(triggerGlitch, 4000);
        return () => clearTimeout(timeoutId);
    }, []);

    // Handle File Selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setTransitioning(true);
        setUploadError(null);

        // Simulate "Binary Dissolve" effect
        const filename = file.name;
        let binaryStr = "";
        for (let i = 0; i < filename.length; i++) {
            binaryStr += filename.charCodeAt(i).toString(2) + " ";
        }
        setBinaryText(binaryStr.substring(0, 50) + "..."); // Show binary representation

        // Short delay for effect before actual upload
        setTimeout(async () => {
            await handleUpload(file);
        }, 1500);
    };

    const handleUpload = async (file) => {
        setIsUploading(true);
        try {
            const response = await uploadService.uploadFile(file);
            if (response.success) {
                // Fade out transition
                setTimeout(() => navigate('/analysis'), 500);
            }
        } catch (error) {
            setUploadError('Upload failed. Connection severed.');
            setTransitioning(false); // Reset on error
            setBinaryText("");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Film Grain Overlay */}
            <div className="film-grain"></div>

            {/* Main Content */}
            <div className={`z-10 flex flex-col items-center transition-opacity duration-1000 ${transitioning && !uploadError ? 'opacity-0' : 'opacity-100'}`}>

                {/* Title Section */}
                <div className="mb-20 relative">
                    <h1
                        className={`text-6xl md:text-8xl font-thin tracking-[0.5em] text-center transition-all duration-100
                        ${glitchState ? 'text-red-500 translate-x-1' : 'text-white animate-breathe'}
                        `}
                    >
                        {glitchState ? "TRUE SELF" : "A L T E R E G O"}
                    </h1>
                    {/* Glitch Layer (Blue Offset) */}
                    {glitchState && (
                        <h1 className="absolute top-0 left-0 text-6xl md:text-8xl font-thin tracking-[0.5em] text-blue-500 -translate-x-1 opacity-70">
                            TRUE SELF
                        </h1>
                    )}
                </div>

                {/* Upload Box */}
                <div
                    className="group relative w-full max-w-lg cursor-pointer transition-all duration-500 hover:scale-105"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {/* Frosted Glass Card */}
                    <div className="frosted-glass rounded-sm p-12 text-center relative overflow-hidden">

                        {/* Ripple/Glow Effect on Hover */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10 space-y-4">
                            <p className="text-sm font-light tracking-widest text-neutral-400 uppercase">
                                Access Terminal
                            </p>
                            <div className="h-px w-12 bg-white/20 mx-auto"></div>
                            <p className="text-xl font-light tracking-wider text-white group-hover:text-white/90 transition-colors">
                                {binaryText ? (
                                    <span className="font-mono text-xs text-green-500 animate-pulse">{binaryText}</span>
                                ) : (
                                    "Drop your data file here"
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Hidden Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".zip"
                    />
                </div>

                {/* Error Message */}
                {uploadError && (
                    <p className="mt-8 text-red-500 font-mono text-sm tracking-widest animate-pulse">
                        {"> ERROR: " + uploadError}
                    </p>
                )}
            </div>

            {/* Creating the fade-out effect for transition */}
            {transitioning && !uploadError && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <p className="font-mono text-green-500 text-xs opacity-50 animate-pulse">
                        {binaryText || "INITIALIZING UPLOAD..."}
                    </p>
                </div>
            )}

        </div>
    );
};

export default UploadPage;
