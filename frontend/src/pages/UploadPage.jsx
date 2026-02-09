import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadService } from '../services/uploadService';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';

const UploadPage = () => {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // We can use the global status hook to track if backend picked it up, 
    // but for upload initiation we handle it locally first.

    const handleUpload = async (file) => {
        setIsUploading(true);
        setUploadError(null);
        try {
            const response = await uploadService.uploadFile(file);
            if (response.success) {
                // Navigate to analysis page on success
                navigate('/analysis');
            }
        } catch (error) {
            setUploadError('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    ALTER-EGO
                </h1>
                <p className="text-xl text-muted-foreground">
                    Upload your YouTube Watch History to meet your digital twin.
                </p>
            </div>

            <div className="w-full">
                {isUploading ? (
                    <LoadingSpinner message="Uploading and extracting data..." />
                ) : (
                    <FileUpload onUpload={handleUpload} isUploading={isUploading} />
                )}
            </div>

            {uploadError && (
                <p className="text-destructive font-medium">{uploadError}</p>
            )}

            <div className="text-center text-sm text-muted-foreground mt-8 p-6 bg-neutral-900/50 rounded-xl max-w-2xl">
                <p className="mb-2"><strong>Privacy Notice:</strong></p>
                <p>
                    Your data is processed locally and temporarily. We extract behavioral patterns
                    to generate the avatar, then the raw data is discarded.
                    No permanent account is created.
                </p>
            </div>
        </div>
    );
};

export default UploadPage;
