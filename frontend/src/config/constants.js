export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const SUPPORTED_PLATFORMS = ['youtube'];

export const ANALYSIS_STEPS = [
    'upload_complete',
    'parsing_complete',
    'sentiment_analysis',
    'embeddings_generation',
    'clustering',
    'summarization',
    'completed'
];

export const VOICE_OPTIONS = {
    lang: 'en-US',
    pitch: 1,
    rate: 1
};
