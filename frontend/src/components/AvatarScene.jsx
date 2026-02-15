import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Avatar } from './3d/Avatar';

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CameraRig = ({ framing }) => {
    const { camera } = useThree();
    const vec = new THREE.Vector3();

    useFrame((state) => {
        // Face: Camera close, looking at head. Z=1.5 to include forehead/hair.
        // Body: Camera back and slightly down to see torso.
        const targetPos = framing === 'face'
            ? new THREE.Vector3(0, 0.1, 1.3)  // Adjusted: Higher Y, Further Z
            : new THREE.Vector3(0, -0.4, 3.5); // Adjusted: Lower Y, Further Z

        // Smoothly interpolate camera position
        state.camera.position.lerp(targetPos, 0.05);

        // Look slightly above center to frame head well
        state.camera.lookAt(0, 0.1, 0);
    });
    return null;
};

const AvatarScene = ({ isSpeaking, audioUrl, onAudioEnd, framing, modelUrl }) => {
    return (
        <div className="w-full h-full min-h-[400px] relative rounded-xl overflow-hidden bg-gradient-to-b from-neutral-900 to-black">
            <Canvas camera={{ position: [0, 0, 1.3], fov: 30 }}>
                <CameraRig framing={framing} />
                {/* Lighting for face */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <directionalLight position={[-5, 0, -5]} intensity={0.3} color="#aaccff" />
                <Environment preset="city" />

                <Suspense fallback={null}>
                    <Avatar
                        key={modelUrl} // Force remount on model change
                        isSpeaking={isSpeaking}
                        audioUrl={audioUrl}
                        onAudioEnd={onAudioEnd}
                        framing={framing}
                        modelUrl={modelUrl}
                    />
                </Suspense>

                {/* No OrbitControls - Avatar is stationary */}
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
