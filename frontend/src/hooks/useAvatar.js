import { useRef, useEffect, useState } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';

export const useAvatar = (url) => {
    const { scene, animations } = useGLTF(url);
    const { actions } = useAnimations(animations, scene);
    const [currentAnimation, setCurrentAnimation] = useState('Idle');

    useEffect(() => {
        // Fade into new animation
        const action = actions?.[currentAnimation];
        if (action) {
            action.reset().fadeIn(0.5).play();
            return () => action.fadeOut(0.5);
        }
    }, [currentAnimation, actions]);

    const speak = () => {
        // Simple mock logic for MVP: Switch to talking animation if available
        // In a real RPM setup, we'd use Viseme mappings
        if (actions['Talking']) {
            setCurrentAnimation('Talking');
        }
    };

    const stopSpeaking = () => {
        setCurrentAnimation('Idle');
    };

    return { scene, setAnimation: setCurrentAnimation, speak, stopSpeaking };
};
