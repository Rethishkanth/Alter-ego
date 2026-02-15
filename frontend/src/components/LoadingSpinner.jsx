import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            {message && <p className="text-muted-foreground animate-pulse">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
