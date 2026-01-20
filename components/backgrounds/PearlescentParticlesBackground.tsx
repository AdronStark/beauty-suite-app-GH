'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- Shaders ---

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  attribute float aScale;
  attribute vec3 aRandomness;
  varying vec3 vColor;
  
  // Simplex Noise (3D)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    
    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
    
    // Permutations
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
             
    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    
    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Time-based flow (Extremely Slow)
    float time = uTime * 0.02; 
    
    // Organic Flow Field - Low Frequency
    float noiseX = snoise(vec3(modelPosition.xyz * 0.2 + time));
    float noiseY = snoise(vec3(modelPosition.xyz * 0.2 + time + 100.0));
    float noiseZ = snoise(vec3(modelPosition.xyz * 0.2 + time + 200.0));
    
    // Gentle displacement
    modelPosition.x += noiseX * 1.0;
    modelPosition.y += noiseY * 0.5; 
    modelPosition.z += noiseZ * 0.3;
    
    // Mouse Interaction (Very Soft)
    vec3 mousePos = vec3(uMouse.x * 10.0, uMouse.y * 10.0, 0.0);
    float dist = distance(modelPosition.xyz, mousePos);
    
    // Gentle influence radius
    float influence = smoothstep(3.0, 0.5, dist); 
    vec3 direction = normalize(modelPosition.xyz - mousePos);
    
    // Very weak push (ghostly interaction)
    modelPosition.xyz += direction * influence * 0.15;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    
    // Size attenuation
    gl_PointSize = aScale * (300.0 / -viewPosition.z);
    
    // Determine Color based on Randomness
    vec3 color = vec3(1.0);
    
    // 1. Pearl White (50%) - Lighter, more subtle pearl
    if (aRandomness.x < 0.5) {
        color = vec3(0.92, 0.92, 0.94); 
    } 
    // 2. Soft Blue (25%) - Pastel Ice Blue
    else if (aRandomness.x < 0.75) {
        color = vec3(0.6, 0.75, 0.95); 
    }
    // 3. Soft Argan Gold (25%) - subtle Champagne
    else {
        color = vec3(0.95, 0.88, 0.7); 
    }
    
    // Iridescence/Shine variation
    float shine = snoise(vec3(modelPosition.xyz * 0.5 + time * 3.0));
    vColor = color * (0.85 + shine * 0.15);
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    // 1. Calculate Normal (simulate 3D sphere from 2D sprite)
    // gl_PointCoord goes from 0,0 to 1,1. We map to -1,1
    vec2 uv = gl_PointCoord * 2.0 - 1.0; 
    
    float dist = dot(uv, uv);
    
    // Discard pixels outside the circle
    if (dist > 1.0) discard;
    
    // Calculate z based on sphere equation x^2 + y^2 + z^2 = 1
    float z = sqrt(1.0 - dist);
    vec3 normal = normalize(vec3(uv.x, -uv.y, z)); // Invert Y for correct lighting
    
    // 2. Lighting Setup (Simulate Studio Light)
    vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0)); // Light coming from top-right-front
    
    // Diffuse (Soft shading)
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Specular (Glossy highlight)
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVector = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfVector), 0.0), 32.0); // Sharp highlight for wet/glossy look
    
    // Fresnel (Rim light / Pearlescent effect)
    float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
    
    // 3. Combine Lighting
    // Base color heavily influenced by diffuse lighting implies volume
    vec3 shading = vColor * (0.6 + 0.4 * diffuse); 
    
    // Add specular highlight (white reflection)
    shading += vec3(0.8) * specular;
    
    // Add Fresnel rim (glow at edges, key for pearls/bubbles)
    shading += vColor * fresnel * 0.5;
    
    // Ambient occlusion at edges (darken extreme edges)
    float edgeDarkening = smoothstep(1.0, 0.8, dist);
    
    // 4. Output
    gl_FragColor = vec4(shading, edgeDarkening); 
  }
`;

// --- Particle System Component ---
function Particles() {
    const { viewport, mouse } = useThree();
    const count = 1250; // Reduced count

    const mesh = useRef<THREE.Points>(null);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
    }), []);

    const [positions, scales, randomness] = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const randomness = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Spread particles across a wide volume
            positions[i3] = (Math.random() - 0.5) * 25;
            positions[i3 + 1] = (Math.random() - 0.5) * 15;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;

            scales[i] = Math.random();

            randomness[i3] = Math.random();
            randomness[i3 + 1] = Math.random();
            randomness[i3 + 2] = Math.random();
        }
        return [positions, scales, randomness];
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        uniforms.uTime.value = time;
        uniforms.uMouse.value.x = state.mouse.x;
        uniforms.uMouse.value.y = state.mouse.y;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aScale"
                    count={scales.length}
                    array={scales}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aRandomness"
                    count={randomness.length / 3}
                    array={randomness}
                    itemSize={3}
                />
            </bufferGeometry>
            <shaderMaterial
                depthWrite={false}
                blending={THREE.NormalBlending} // Changed for softer look
                vertexColors={false}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
            />
        </points>
    );
}

// --- Main Exported Component ---
export default function PearlescentParticlesBackground() {
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
            <Canvas
                camera={{ position: [0, 0, 10], fov: 45 }}
                dpr={[1, 2]}
                gl={{ alpha: true, antialias: false }}
                style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}
            >
                <ambientLight intensity={0.6} />

                <Particles />

                <EffectComposer disableNormalPass>
                    <Bloom
                        intensity={0.4} // Reduced bloom intensity
                        luminanceThreshold={0.6}
                        luminanceSmoothing={0.9}
                        height={300}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
