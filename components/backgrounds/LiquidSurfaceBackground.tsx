'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- GLSL Shaders for Dense Viscous Fluid ---

const vertexShader = `
  uniform float uTime;
  uniform vec3 uRipples[8]; // More ripples for smoother trails
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;

  // Smooth noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // Smoother interpolation
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 1.8;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Dense fluid: Very slow, heavy base movement
    float baseWave = fbm(pos.xy * 0.15 + uTime * 0.015) * 0.2;
    baseWave += fbm(pos.xy * 0.25 - uTime * 0.01) * 0.1;
    baseWave += fbm(pos.xy * 0.4 + uTime * 0.008) * 0.05;
    
    // Ripple waves from mouse - SLOW and HEAVY
    float rippleSum = 0.0;
    for(int i = 0; i < 8; i++) {
      vec3 ripple = uRipples[i];
      if(ripple.z > 0.0) {
        float age = uTime - ripple.z;
        float dist = distance(pos.xy, ripple.xy);
        
        // SLOW expansion (viscous fluid)
        float ringRadius = age * 1.2; // Much slower than water
        float ringWidth = 1.5; // Wider, softer rings
        float ring = 1.0 - abs(dist - ringRadius) / ringWidth;
        ring = max(0.0, ring);
        ring = ring * ring; // Softer falloff
        
        // SLOW fade (dense fluid holds shape longer)
        float fade = exp(-age * 0.4); // Slower decay
        
        // Heavy, slow oscillation
        float wave = sin(dist * 2.0 - age * 2.5) * ring * fade * 0.35;
        rippleSum += wave;
      }
    }
    
    pos.z = baseWave + rippleSum;
    vElevation = pos.z;
    
    // Calculate normal for creamy highlights
    float delta = 0.15;
    float hL = fbm((pos.xy + vec2(-delta, 0.0)) * 0.15 + uTime * 0.015) * 0.2;
    float hR = fbm((pos.xy + vec2(delta, 0.0)) * 0.15 + uTime * 0.015) * 0.2;
    float hD = fbm((pos.xy + vec2(0.0, -delta)) * 0.15 + uTime * 0.015) * 0.2;
    float hU = fbm((pos.xy + vec2(0.0, delta)) * 0.15 + uTime * 0.015) * 0.2;
    vNormal = normalize(vec3(hL - hR, hD - hU, delta * 3.0));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    // Creamy/Serum color palette (warm cream, not cold blue)
    vec3 baseColor = vec3(0.98, 0.96, 0.94);     // Warm cream white
    vec3 shadowColor = vec3(0.92, 0.90, 0.88);   // Slightly darker cream
    vec3 highlightColor = vec3(1.0, 0.99, 0.97); // Bright cream highlight
    
    // Mix based on elevation - creates depth
    float t = smoothstep(-0.15, 0.25, vElevation);
    vec3 fluidColor = mix(shadowColor, baseColor, t);
    
    // Soft, diffuse lighting (matte surface)
    vec3 lightDir = normalize(vec3(0.3, 0.4, 1.0));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    diffuse = diffuse * 0.5 + 0.5; // Soften shadows
    
    // Soft specular (creamy sheen, not sharp)
    float specular = pow(max(dot(reflect(-lightDir, vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 8.0);
    
    // Subtle subsurface scattering effect
    float sss = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0) * 0.1;
    
    // Combine
    vec3 finalColor = fluidColor * diffuse + highlightColor * specular * 0.2 + vec3(sss);
    
    // Subtle edge darkening (vignette)
    float vignette = 1.0 - smoothstep(0.3, 0.55, length(vUv - 0.5));
    
    gl_FragColor = vec4(finalColor, 0.92 * vignette);
  }
`;

// --- Viscous Fluid Plane ---
function ViscousFluidPlane() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { mouse, viewport } = useThree();

    const lastMousePos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const rippleIndex = useRef(0);
    const lastRippleTime = useRef(0);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uRipples: { value: Array(8).fill(new THREE.Vector3(0, 0, -100)) },
    }), []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        uniforms.uTime.value = time;

        const mouseX = mouse.x * viewport.width / 2;
        const mouseY = mouse.y * viewport.height / 2;

        const dx = mouseX - lastMousePos.current.x;
        const dy = mouseY - lastMousePos.current.y;
        const moved = Math.sqrt(dx * dx + dy * dy);

        // Create ripple when mouse moves, but throttle for viscous effect
        const timeSinceLastRipple = time - lastRippleTime.current;
        if (moved > 0.2 && timeSinceLastRipple > 0.15) {
            const idx = rippleIndex.current % 8;
            uniforms.uRipples.value[idx] = new THREE.Vector3(mouseX, mouseY, time);
            rippleIndex.current++;
            lastRippleTime.current = time;
            lastMousePos.current = { x: mouseX, y: mouseY };
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[30, 30, 180, 180]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// --- Main Component ---
export default function LiquidSurfaceBackground() {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
        }}>
            <Suspense fallback={null}>
                <Canvas
                    camera={{ position: [0, 12, 0], fov: 45, near: 0.1, far: 100 }}
                    dpr={1}
                    gl={{ alpha: true, antialias: true }}
                    style={{ background: 'linear-gradient(180deg, #faf8f6 0%, #f5f3f1 100%)' }}
                >
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[3, 10, 5]} intensity={0.4} color="#fff8f0" />
                    <pointLight position={[-4, 8, -2]} intensity={0.2} color="#ffe8d0" />

                    <ViscousFluidPlane />
                </Canvas>
            </Suspense>
        </div>
    );
}
