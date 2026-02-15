import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { lipSyncController } from '../../utils/LipSyncController';

export function Avatar({ audioUrl, isSpeaking, onAudioEnd, framing = 'face', modelUrl = "https://models.readyplayer.me/6989cfc06eb4878bb8782505.glb" }) {
    const group = useRef();
    const { scene } = useGLTF(modelUrl);

    // References for animation
    const headMeshRef = useRef(null);
    // Arm references
    const leftArmRef = useRef(null);
    const rightArmRef = useRef(null);

    // Blink state
    const lastBlinkTime = useRef(0);
    const blinkDuration = useRef(0);
    const isBlinking = useRef(false);

    useEffect(() => {
        // Find meshes with morph targets and bones
        scene.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary) {
                if (child.name.includes("Head") || child.name.includes("EyeLeft") || child.name.includes("EyeRight")) {
                    headMeshRef.current = child;
                }
            }
            // Bones (Arms)
            if (child.isBone) {
                if (child.name.includes("LeftArm")) leftArmRef.current = child;
                if (child.name.includes("RightArm")) rightArmRef.current = child;
            }
        });
    }, [scene]);

    // Animation Loop
    useFrame((state) => {
        const t = state.clock.elapsedTime;

        // --- Lip Sync Logic ---
        let values = lipSyncController.getLipSyncValues();

        // Fallback: Procedural Lip Sync for Web Speech API (no audio analysis)
        if (isSpeaking && !audioUrl) {
            values = {
                jawOpen: (Math.sin(t * 15) * 0.5 + 0.5) * 0.4 * (0.5 + Math.random() * 0.5),
                mouthSmile: 0.1,
                mouthPucker: Math.random() * 0.1
            };
        }

        if (headMeshRef.current) {
            const head = headMeshRef.current;
            const dict = head.morphTargetDictionary;
            const influences = head.morphTargetInfluences;

            const targetOpen = values.jawOpen;

            const jawIdx = dict['jawOpen'];
            const mouthIdx = dict['mouthOpen'];

            if (jawIdx !== undefined) influences[jawIdx] = THREE.MathUtils.lerp(influences[jawIdx], targetOpen, 0.3);
            if (mouthIdx !== undefined) influences[mouthIdx] = THREE.MathUtils.lerp(influences[mouthIdx], targetOpen, 0.3);

            // --- Eye Blinking ---
            if (t - lastBlinkTime.current > 3 + Math.random() * 3) {
                isBlinking.current = true;
                blinkDuration.current = 0;
                lastBlinkTime.current = t;
            }

            const blinkLeftIdx = dict['eyeBlinkLeft'];
            const blinkRightIdx = dict['eyeBlinkRight'];

            if (isBlinking.current) {
                blinkDuration.current += 0.1;
                const blinkValue = Math.sin(blinkDuration.current * Math.PI);

                if (blinkLeftIdx !== undefined) influences[blinkLeftIdx] = blinkValue;
                if (blinkRightIdx !== undefined) influences[blinkRightIdx] = blinkValue;

                if (blinkDuration.current >= 1) {
                    isBlinking.current = false;
                    if (blinkLeftIdx !== undefined) influences[blinkLeftIdx] = 0;
                    if (blinkRightIdx !== undefined) influences[blinkRightIdx] = 0;
                }
            }

            // --- Eye Saccades ---
            const lookLeftIdx = dict['eyeLookOutLeft'];
            const lookRightIdx = dict['eyeLookOutRight'];
            const lookUpLeftIdx = dict['eyeLookUpLeft'];
            const lookUpRightIdx = dict['eyeLookUpRight'];

            const eyeX = Math.sin(t * 0.5) * 0.05;
            const eyeY = Math.cos(t * 0.7) * 0.03;

            if (lookLeftIdx !== undefined) influences[lookLeftIdx] = Math.max(0, eyeX);
            if (lookRightIdx !== undefined) influences[lookRightIdx] = Math.max(0, -eyeX);
            if (lookUpLeftIdx !== undefined) influences[lookUpLeftIdx] = Math.max(0, eyeY);
            if (lookUpRightIdx !== undefined) influences[lookUpRightIdx] = Math.max(0, eyeY);
        }

        // --- Procedural Body Animation (Arms) ---
        if (leftArmRef.current && rightArmRef.current) {
            if (isSpeaking) {
                const gestureSpeed = 4;
                const gestureAmp = 0.15;
                leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 1.2 + Math.sin(t * gestureSpeed) * gestureAmp, 0.1);
                rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -1.2 - Math.sin(t * gestureSpeed * 0.8) * gestureAmp, 0.1);
            } else {
                const breathe = Math.sin(t) * 0.05;
                leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 1.1 + breathe, 0.05);
                rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -1.1 - breathe, 0.05);
            }
        }

        // --- Gentle Breathing (Stationary) ---
        // Removed position breathing to prevent fighting with CameraRig
        // Could change to rotation breathing if needed

    });

    // Audio Playback Hook
    useEffect(() => {
        if (audioUrl && isSpeaking) {
            console.log("Avatar: Playing audio:", audioUrl);
            lipSyncController.playAudio(audioUrl, onAudioEnd);
        }
    }, [audioUrl, isSpeaking, onAudioEnd]);

    // Position: Shift down so head (at ~1.65m * 2 = 3.3m) is near 0,0,0
    return (
        <group ref={group} dispose={null} position={[0, -3.3, 0]}>
            <primitive object={scene} scale={2} />
        </group>
    );
}
