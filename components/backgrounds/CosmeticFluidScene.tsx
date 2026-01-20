'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
type DropType = 'serum' | 'cream';

interface DropProps {
    type: DropType;
    position: [number, number, number];
    scale: number;
}

// --- Materials ---
const SerumMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    ior: 1.48,
    thickness: 1.5,
    roughness: 0.0,
    clearcoat: 1.0,
    color: new THREE.Color('#fffbf0'),
    attenuationColor: new THREE.Color('#eab308'),
    attenuationDistance: 2,
    transparent: true,
});

const CreamMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.3,
    metalness: 0.05,
    color: new THREE.Color('#fdfcf8'),
});

// --- Drop Component ---
function Drop({ type, position, scale }: DropProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport, mouse } = useThree();

    const timeOffset = useMemo(() => Math.random() * 100, []);
    // ULTRA SLOW: 0.1 - 0.2
    const speed = useMemo(() => 0.1 + Math.random() * 0.1, []);

    const isSerum = type === 'serum';
    // High friction = no momentum "drift"
    const friction = isSerum ? 0.96 : 0.94;

    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const currentPos = useRef(new THREE.Vector3(...position));

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();

        // 1. Mouse Attraction 
        const targetX = (mouse.x * viewport.width) / 2;
        const targetY = (mouse.y * viewport.height) / 2;

        const dx = targetX - currentPos.current.x;
        const dy = targetY - currentPos.current.y;

        // Force Capping to prevent "slingshot" accelerations
        // We normalize the direction and apply a gentle constant force scaled by distance but capped
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxForce = 0.005; // Maximum force allowed per frame
        const forceMagnitude = Math.min(dist * 0.0005, maxForce); // Very gentle variable pull

        if (dist > 0.1) {
            velocity.current.x += (dx / dist) * forceMagnitude;
            velocity.current.y += (dy / dist) * forceMagnitude;
        }

        // 2. Base Floating (Barely moving)
        velocity.current.x += Math.sin(time * speed + timeOffset) * 0.0005;
        velocity.current.y += Math.cos(time * speed * 0.7 + timeOffset) * 0.0005;

        // 3. Apply Velocity & Friction
        velocity.current.multiplyScalar(friction);

        // Hard speed limit to absolutely prevent "jitters"
        const maxSpeed = 0.05;
        velocity.current.clampLength(0, maxSpeed);

        // Update Position
        currentPos.current.add(velocity.current);

        // 4. Bounds check (Soft)
        const limitX = viewport.width / 1.4;
        const limitY = viewport.height / 1.4;

        if (Math.abs(currentPos.current.x) > limitX) velocity.current.x -= currentPos.current.x * 0.002;
        if (Math.abs(currentPos.current.y) > limitY) velocity.current.y -= currentPos.current.y * 0.002;

        meshRef.current.position.copy(currentPos.current);

        // Ultra slow rotation
        meshRef.current.rotation.x = Math.sin(time * 0.05 + timeOffset) * 0.1;
        meshRef.current.rotation.y = Math.cos(time * 0.05 + timeOffset) * 0.1;
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={scale}
            material={isSerum ? SerumMaterial : CreamMaterial}
        >
            <sphereGeometry args={[1, 24, 24]} /> {/* Reduced geometry for perf */}
        </mesh>
    );
}

// --- Main Scene ---
export default function CosmeticFluidScene() {
    const drops = useMemo(() => {
        const items: DropProps[] = [];

        // Serum: Increased count, Micro scale
        for (let i = 0; i < 15; i++) {
            items.push({
                type: 'serum',
                position: [
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 5
                ],
                scale: 0.08 + Math.random() * 0.12, // 0.08 - 0.20
            });
        }

        // Cream: Micro scale
        for (let i = 0; i < 10; i++) {
            items.push({
                type: 'cream',
                position: [
                    (Math.random() - 0.5) * 18,
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 3
                ],
                scale: 0.1 + Math.random() * 0.15, // 0.10 - 0.25
            });
        }

        return items;
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                dpr={1} // Lock at 1 for consistency and performance
                gl={{ alpha: true, antialias: true }}
            >
                <ambientLight intensity={0.6} />
                <Environment preset="studio" blur={0.8} />

                {drops.map((drop, i) => (
                    <Drop key={i} {...drop} />
                ))}

                <ContactShadows
                    position={[0, -4, 0]}
                    opacity={0.15}
                    scale={20}
                    blur={4}
                    far={10}
                    color="#a3765e"
                />
            </Canvas>
        </div>
    );
}
