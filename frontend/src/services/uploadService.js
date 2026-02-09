import apiClient from './apiClient';
import { ENDPOINTS } from '../config/api';

export const uploadService = {
    uploadFile: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(ENDPOINTS.UPLOAD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    }
};
