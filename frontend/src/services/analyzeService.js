import apiClient from './apiClient';
import { ENDPOINTS } from '../config/api';

export const analyzeService = {
    startAnalysis: async () => {
        const response = await apiClient.post(ENDPOINTS.ANALYZE);
        return response.data;
    },

    getResults: async (jobId) => {
        const response = await apiClient.get(`${ENDPOINTS.ANALYZE}/${jobId}`);
        return response.data;
    }
};
