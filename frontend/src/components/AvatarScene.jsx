import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { useAvatar } from '../hooks/useAvatar';

const Model = ({ url, isSpeaking }) => {
    const { scene, speak, stopSpeaking } = useAvatar(url);

    useEffect(() => {
        if (isSpeaking) speak();
        else stopSpeaking();
    }, [isSpeaking, speak, stopSpeaking]);

    return <primitive object={scene} position={[0, -1.5, 0]} scale={1.2} />;
};

const AvatarScene = ({ isSpeaking }) => {
    // Default Ready Player Me avatar (Standard Demo)
    const avatarUrl = "https://models.readyplayer.me/63484501fd63914a1e941193.glb";

    return (
        <div className="w-full h-full min-h-[400px] relative rounded-xl overflow-hidden bg-gradient-to-b from-neutral-900 to-black">
            <Canvas camera={{ position: [0, 0, 1.5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Environment preset="city" />

                <Suspense fallback={null}>
                    <Model url={avatarUrl} isSpeaking={isSpeaking} />
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 2.5}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className="text-xs text-white/50 bg-black/50 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                    Interactive AI Twin
                </p>
            </div>
        </div>
    );
};

export default AvatarScene;
