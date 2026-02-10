import * as THREE from 'three';
import { API_BASE_URL } from '../config/api';

/**
 * Manages audio context and analyzes frequency data to estimate visomes.
 * This is a simplified "puppet" approach mapping volume to jaw openness.
 */
class LipSyncController {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.onAudioEnd = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    async playAudio(url, onEndCallback) {
        this.init();
        this.onAudioEnd = onEndCallback;

        try {
            if (this.source) {
                try {
                    this.source.stop();
                } catch (e) {
                    // Ignore
                }
                this.source.disconnect();
            }

            // Use proxy to bypass CORS if it's a remote URL
            let fetchUrl = url;
            if (url.startsWith('http') && !url.includes(API_BASE_URL)) {
                fetchUrl = `${API_BASE_URL}/proxy_audio?url=${encodeURIComponent(url)}`;
            }

            console.log("Fetching audio from:", fetchUrl);
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.source.onended = () => {
                this.isPlaying = false;
                if (this.onAudioEnd) this.onAudioEnd();
            };

            this.source.start(0);
            this.isPlaying = true;

        } catch (error) {
            console.error("Error playing audio via Web Audio API:", error);
            this.isPlaying = false;
            // Fallback: Try playing via standard Audio element if Web Audio fails (decoding error)
            // But we can't extract lip sync data easily from standard Audio without CORS.
            // At least the user hears sound.
            const audio = new Audio(url);
            audio.play().catch(e => console.error("Fallback audio failed:", e));
            if (this.onAudioEnd) {
                audio.onended = this.onAudioEnd;
            }
        }
    }

    stop() {
        if (this.source) {
            try {
                this.source.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            this.source.disconnect();
        }
        this.isPlaying = false;
    }

    getLipSyncValues() {
        if (!this.isPlaying || !this.analyser) {
            return {
                jawOpen: 0,
                mouthSmile: 0,
                mouthPucker: 0
            };
        }

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate average volume (RMS)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // Normalize volume (0-1)
        // Adjust sensitivity
        const normalizedVolume = Math.min(Math.max((average - 10) / 50, 0), 1);
        const noise = normalizedVolume > 0.1 ? (Math.random() * 0.1) : 0;

        return {
            jawOpen: normalizedVolume + noise,
            mouthSmile: (normalizedVolume > 0.2 ? 0.1 : 0),
            mouthPucker: (normalizedVolume > 0.4 ? 0.2 : 0)
        };
    }
}

export const lipSyncController = new LipSyncController();
