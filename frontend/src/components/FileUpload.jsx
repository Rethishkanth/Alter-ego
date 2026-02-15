import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

const FileUpload = ({ onUpload, isUploading }) => {
    const [error, setError] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        setError(null);
        if (acceptedFiles?.length > 0) {
            const file = acceptedFiles[0];
            if (!file.name.endsWith('.zip')) {
                setError('Please upload a ZIP file.');
                return;
            }
            onUpload(file);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip']
        }
    });

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-neutral-700 hover:border-primary/50'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-neutral-800">
                        <UploadCloud className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="text-lg font-medium">
                            {isDragActive ? "Drop file here" : "Drag & drop your Takeout ZIP"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Supports YouTube Watch History exports
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
