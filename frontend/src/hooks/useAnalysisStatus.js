import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export const useAnalysisStatus = () => {
    const { isConnected, lastMessage } = useWebSocket();
    const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, completed, failed
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [jobId, setJobId] = useState(null);

    useEffect(() => {
        if (!lastMessage) return;

        const { type, data, message } = lastMessage;

        switch (type) {
            case 'upload_started':
                setStatus('uploading');
                setStatusMessage('Upload started...');
                break;
            case 'upload_complete':
                setStatus('analyzing_pending'); // Ready to analyze
                setStatusMessage('Upload complete. Ready to analyze.');
                break;
            case 'analysis_started':
                setStatus('analyzing');
                setJobId(data?.job_id);
                setStatusMessage('Analysis started...');
                break;
            case 'analysis_progress':
                setStatusMessage(message || 'Analyzing...');
                break;
            case 'analysis_complete':
                setStatus('completed');
                setJobId(data?.job_id);
                setStatusMessage('Analysis complete!');
                break;
            default:
                break;
        }
    }, [lastMessage]);

    return { status, progress, statusMessage, jobId, isConnected };
};
