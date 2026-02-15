import React, { useEffect, useRef, useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

const ChatWindow = ({ messages, onSend, isRecording, toggleRecording, isLoading }) => {
    const bottomRef = useRef(null);
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput("");
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-60">
                        <p>Ask anything about your data.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-neutral-800 text-neutral-100 rounded-bl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-neutral-800 rounded-2xl px-4 py-3 rounded-bl-none flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className={`p-3 rounded-full transition-colors ${isRecording ? 'bg-destructive text-white animate-pulse' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                    >
                        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-1 bg-neutral-800 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-neutral-500"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ChatWindow;
