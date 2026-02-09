import apiClient from './apiClient';
import { ENDPOINTS } from '../config/api';

export const chatService = {
    sendQuestion: async (question, jobId) => {
        const response = await apiClient.post(ENDPOINTS.ASK, {
            question,
            analysis_job_id: jobId
        });
        return response.data;
    }
};
