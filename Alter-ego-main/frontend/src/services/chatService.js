import apiClient from './apiClient';
import { ENDPOINTS } from '../config/api';

export const chatService = {
    sendQuestion: async (question, jobId, mode = 'mirror') => {
        const response = await apiClient.post(ENDPOINTS.ASK, {
            question,
            analysis_job_id: jobId,
            mode
        });
        return response.data;
    }
};
