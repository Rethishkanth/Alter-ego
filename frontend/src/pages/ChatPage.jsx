import React, { useState } from 'react';
import AvatarScene from '../components/AvatarScene';
import ChatWindow from '../components/ChatWindow';
import { useSpeech } from '../hooks/useSpeech';
import { chatService } from '../services/chatService';
import ErrorBoundary from '../components/ErrorBoundary';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isListening, transcript, startListening, speak, isSpeaking } = useSpeech();

    // If transcript updates (from speech), auto-fill or send? 
    // For MVP, let's just use it to populate input in ChatWindow (passed via prop if we refactored, 
    // but simpler to just auto-send for "voice mode" or simple logging for now)
    // Actually, let's just handle text for stability first.

    const handleSend = async (text) => {
        // Add user message
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // 1. Send to backend
            const response = await chatService.sendQuestion(text);

            // 2. Add avatar response
            setMessages(prev => [...prev, { role: 'assistant', content: response.avatar_response }]);

            // 3. Speak response
            speak(response.avatar_response);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'system', content: "I'm having trouble connecting to my brain right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-background">
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
                    isRecording={isListening}
                    toggleRecording={startListening} // Simple toggle for now
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default ChatPage;
