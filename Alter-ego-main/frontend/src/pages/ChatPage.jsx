import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarScene from '../components/AvatarScene';
import ChatWindow from '../components/ChatWindow';
import { useSpeech } from '../hooks/useSpeech';
import { chatService } from '../services/chatService';
import ErrorBoundary from '../components/ErrorBoundary';
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import { lipSyncController } from '../utils/LipSyncController';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';

// Models
const MIRROR_AVATAR_URL = "https://models.readyplayer.me/6989cfc06eb4878bb8782505.glb";
const DEVIL_AVATAR_URL = "https://models.readyplayer.me/698abbdffcad0d2f3346c004.glb";

const ChatPage = () => {
    const [mode, setMode] = useState('mirror'); // 'mirror' | 'devil'
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceError, setVoiceError] = useState(null);
    const [useWebSpeech, setUseWebSpeech] = useState(true);
    const [framing, setFraming] = useState('face');
    const [currentAudioUrl, setCurrentAudioUrl] = useState(null);

    const { jobId } = useAnalysisStatus(); // Get Job ID
    const { isRecording, audioBlob, error: recordingError, toggleRecording, clearAudioBlob } = useSpeech();
    const [shake, setShake] = useState(false);
    const navigate = useNavigate();

    const handleTerminate = () => {
        if (jobId) {
            navigate(`/autopsy?jobId=${jobId}`);
        } else {
            // Fallback if no job ID mostly for testing or if context lost
            navigate('/autopsy');
        }
    };

    // Toggle Mode Handler
    const toggleMode = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500); // Shake duration
        setMode(prev => prev === 'mirror' ? 'devil' : 'mirror');

        // Add a system message indicating the shift
        const newMode = mode === 'mirror' ? "DEVIL'S ADVOCATE" : "MIRROR";
        setMessages(prev => [...prev, {
            role: 'system',
            content: `SWITCHING TO ${newMode} MODE...`
        }]);
    };

    // Voice Effect Hook
    useEffect(() => {
        if (audioBlob && !isLoading) {
            handleVoiceSend(audioBlob);
            clearAudioBlob();
        }
    }, [audioBlob]);

    // Speak Text
    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Lower pitch/rate for Devil mode
        if (mode === 'devil') {
            utterance.pitch = 0.8;
            utterance.rate = 1.1;
        } else {
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Handle Sending Messages
    const handleSend = async (text) => {
        if (!text.trim()) return;

        lipSyncController.init();
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setIsLoading(true);
        setVoiceError(null);
        setCurrentAudioUrl(null);

        try {
            // Pass 'mode' to backend
            const response = await chatService.sendQuestion(text, jobId, mode);

            setMessages(prev => [...prev, { role: 'assistant', content: response.avatar_response }]);

            if (useWebSpeech) {
                speakText(response.avatar_response);
            } else if (response.audio_url) {
                setCurrentAudioUrl(response.audio_url);
                setIsSpeaking(true);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'system', content: "Connection interrupted." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle voice-based send (recording)
    const handleVoiceSend = async (blob) => {
        lipSyncController.init();
        setIsLoading(true);
        setVoiceError(null);
        setCurrentAudioUrl(null);

        try {
            const formData = new FormData();
            formData.append('file', blob, 'recording.webm');
            formData.append('mode', mode); // Pass current mode

            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.VOICE}`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Voice failed');
            const data = await response.json();

            if (data.user_text) setMessages(prev => [...prev, { role: 'user', content: data.user_text }]);
            if (data.avatar_response) setMessages(prev => [...prev, { role: 'assistant', content: data.avatar_response }]);

            if (useWebSpeech) {
                speakText(data.avatar_response);
            } else if (data.audio_url) {
                setCurrentAudioUrl(data.audio_url);
                setIsSpeaking(true);
            }

        } catch (error) {
            console.error('Voice error:', error);
            setVoiceError('Voice processing failed.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className={`h-screen w-full flex overflow-hidden bg-black transition-colors duration-500
            ${shake ? 'animate-shake' : ''}
        `}>
            {/* --- TOP HEADER (Toggle) --- */}

            {/* Terminate Button (Top Left) */}
            <div className="absolute top-6 left-6 z-50 pointer-events-auto">
                <button
                    onClick={handleTerminate}
                    className="group flex items-center gap-2 px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-500 hover:text-red-400 border border-red-900/50 hover:border-red-500/50 rounded-lg text-xs font-mono tracking-widest transition-all backdrop-blur-sm shadow-[0_0_10px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    [ TERMINATE & ANALYZE ]
                </button>
            </div>

            <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
                <div className="bg-neutral-900/80 backdrop-blur-md rounded-full p-1 border border-neutral-700 pointer-events-auto flex items-center gap-2 shadow-2xl">
                    <button
                        onClick={() => mode !== 'mirror' && toggleMode()}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                        ${mode === 'mirror' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Mirror Mode
                    </button>
                    <button
                        onClick={() => mode !== 'devil' && toggleMode()}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                        ${mode === 'devil' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-neutral-400 hover:text-red-400'}`}
                    >
                        Devil's Advocate
                    </button>
                </div>
            </div>

            {/* --- LEFT SPLIT: AVATAR (50%) --- */}
            <div className={`w-1/2 h-full relative transition-all duration-500
                ${mode === 'devil' ? 'border-r-2 border-red-900/30' : 'border-r border-neutral-800'}
            `}>
                <ErrorBoundary>
                    <AvatarScene
                        isSpeaking={isSpeaking}
                        audioUrl={useWebSpeech ? null : currentAudioUrl}
                        onAudioEnd={() => setIsSpeaking(false)}
                        framing={framing}
                        modelUrl={mode === 'mirror' ? MIRROR_AVATAR_URL : DEVIL_AVATAR_URL} // Pass URL to AvatarScene -> Avatar
                    />
                </ErrorBoundary>

                {/* Mode Indicator Overlay */}
                <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                    <p className={`text-xs uppercase tracking-[0.2em] inline-block px-3 py-1 rounded-full backdrop-blur-sm
                        ${mode === 'mirror' ? 'text-white/50 bg-black/50' : 'text-red-500 bg-red-900/20 border border-red-900/50'}
                    `}>
                        {mode === 'mirror' ? "Digital Twin" : "Autonomous Agent"}
                    </p>
                </div>
            </div>

            {/* --- RIGHT SPLIT: CHAT (50%) --- */}
            <div className="w-1/2 h-full bg-black relative flex flex-col">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* DEVIL MODE UI: Terminal Style */}
                            {mode === 'devil' ? (
                                <div className={`relative max-w-[80%] pl-4 border-l-2 
                                    ${msg.role === 'user' ? 'border-neutral-500 text-neutral-400' : 'border-red-600 text-red-100'}
                                `}>
                                    <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            ) : (
                                /* MIRROR MODE UI: Bubbles */
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm
                                    ${msg.role === 'user' ? 'bg-white text-black rounded-tr-sm' : 'bg-neutral-800 text-white rounded-tl-sm'}
                                `}>
                                    <p>{msg.content}</p>
                                </div>
                            )}

                            {/* System Message */}
                            {msg.role === 'system' && (
                                <div className="w-full text-center my-4">
                                    <span className="text-xs font-mono text-neutral-600 border border-neutral-800 px-2 py-1 rounded">
                                        {msg.content}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            {mode === 'devil' ? (
                                <span className="font-mono text-red-500 animate-pulse text-sm ml-4">| THINKING...</span>
                            ) : (
                                <div className="bg-neutral-800 rounded-2xl px-4 py-3 rounded-tl-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-black border-t border-neutral-900">
                    <ChatWindow
                        messages={[]} // Handled above layout
                        onSend={handleSend}
                        isRecording={isRecording}
                        toggleRecording={toggleRecording}
                        isLoading={isLoading}
                        minimized={true} // Custom prop to just show input? 
                    // Actually, reusing ChatWindow might be tricky if it has internal layout. 
                    // Better to extract input or just mask it. 
                    // For MVP: I will just use ChatWindow but hide its message list via CSS or just render a simple input here.
                    />
                </div>
            </div>

            {/* Global Shake Animation Style */}
            <style>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .animate-shake {
                    animation: shake 0.5s;
                    animation-iteration-count: 1;
                }
            `}</style>
        </div>
    );
};

export default ChatPage;
