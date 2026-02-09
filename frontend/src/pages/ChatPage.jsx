import React, { useState, useEffect, useRef } from 'react';
import AvatarScene from '../components/AvatarScene';
import ChatWindow from '../components/ChatWindow';
import { useSpeech } from '../hooks/useSpeech';
import { chatService } from '../services/chatService';
import ErrorBoundary from '../components/ErrorBoundary';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceError, setVoiceError] = useState(null);

    const { isRecording, audioBlob, error: recordingError, toggleRecording, clearAudioBlob } = useSpeech();
    const audioRef = useRef(null);

    // Handle voice recording completion
    useEffect(() => {
        if (audioBlob && !isLoading) {
            handleVoiceSend(audioBlob);
            clearAudioBlob();
        }
    }, [audioBlob]);

    // Show recording errors
    useEffect(() => {
        if (recordingError) {
            setVoiceError(recordingError);
            setTimeout(() => setVoiceError(null), 5000);
        }
    }, [recordingError]);

    // Handle text-based send (typing)
    const handleSend = async (text) => {
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setIsLoading(true);
        setVoiceError(null);

        try {
            const response = await chatService.sendQuestion(text);
            setMessages(prev => [...prev, { role: 'assistant', content: response.avatar_response }]);

            // No audio for text-based chat (keep it simple)
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'system', content: "I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle voice-based send (recording)
    const handleVoiceSend = async (blob) => {
        setIsLoading(true);
        setVoiceError(null);

        try {
            // Create FormData with audio file
            const formData = new FormData();
            formData.append('file', blob, 'recording.webm');

            // Send to /voice endpoint
            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.VOICE}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Voice processing failed');
            }

            const data = await response.json();

            // Add user's transcribed text to chat
            if (data.user_text) {
                setMessages(prev => [...prev, { role: 'user', content: data.user_text }]);
            }

            // Add avatar response to chat
            if (data.avatar_response) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.avatar_response }]);
            }

            // Play audio response if available
            if (data.audio_url) {
                playAudio(data.audio_url);
            }

        } catch (error) {
            console.error('Voice send error:', error);
            setVoiceError(error.message || 'Voice processing failed. Please try again.');
            setMessages(prev => [...prev, { role: 'system', content: "Voice processing failed. Please try again or type your message." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Play audio from URL
    const playAudio = (url) => {
        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.onplay = () => setIsSpeaking(true);
            audioRef.current.onended = () => setIsSpeaking(false);
            audioRef.current.onerror = () => {
                console.error('Audio playback error');
                setIsSpeaking(false);
            };
            audioRef.current.play().catch(err => {
                console.error('Audio play failed:', err);
                setIsSpeaking(false);
            });
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-background">
            {/* Hidden audio element for TTS playback */}
            <audio ref={audioRef} style={{ display: 'none' }} />

            {/* Voice Error Toast */}
            {voiceError && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                    {voiceError}
                </div>
            )}

            {/* Left Panel: Avatar (60%) */}
            <div className="w-3/5 h-full p-4 relative">
                <ErrorBoundary>
                    <AvatarScene isSpeaking={isSpeaking} />
                </ErrorBoundary>
            </div>

            {/* Right Panel: Chat (40%) */}
            <div className="w-2/5 h-full p-4 pl-0">
                <ChatWindow
                    messages={messages}
                    onSend={handleSend}
                    isRecording={isRecording}
                    toggleRecording={toggleRecording}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default ChatPage;
