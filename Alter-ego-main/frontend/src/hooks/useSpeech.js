import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for audio recording using MediaRecorder API.
 * Returns recording state and audio blob for sending to backend.
 */
export const useSpeech = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = useCallback(async () => {
        setError(null);
        setAudioBlob(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Use webm for best browser support
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
                ? 'audio/webm' 
                : 'audio/mp4';
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                
                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                setError('Recording failed. Please try again.');
                setIsRecording(false);
            };

            mediaRecorder.start();
            setIsRecording(true);
            
        } catch (err) {
            console.error('Microphone access error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
            } else {
                setError('Could not start recording. Please try again.');
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const clearAudioBlob = useCallback(() => {
        setAudioBlob(null);
    }, []);

    return {
        isRecording,
        audioBlob,
        error,
        startRecording,
        stopRecording,
        toggleRecording,
        clearAudioBlob
    };
};
