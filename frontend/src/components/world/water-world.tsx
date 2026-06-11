"use client";

// `water-normal.jpg` is adapted from
// `examples/textures/waternormals.jpg` in the three.js project (MIT).
// Full attribution and license text in /THIRD_PARTY_LICENSES.md.

import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const SIM_SIZE = 256;
const CLEAR_COLOR = "#1d6e80";
const WATER_NORMAL_URL = "/stage/world/water-normal.jpg";
// Wait one extra textured frame before revealing the iframe.
const READY_FRAME_THRESHOLD = 2;
const CONTEXT_RECOVERY_TIMEOUT_MS = 900;
const MOBILE_WATER_FRAME_MS = 1000 / 30;

const screenVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const simulationFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform float uTime;
  uniform float uAspect;

  varying vec2 vUv;

  float waveSource(vec2 uv, float time) {
    vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    float broad = sin(dot(p, normalize(vec2(0.94, 0.34))) * 8.6 + time * 0.24);
    float cross = sin(dot(p, normalize(vec2(-0.42, 0.91))) * 12.4 - time * 0.19);
    float diagonal = sin(dot(p, normalize(vec2(0.62, 0.78))) * 18.2 + time * 0.16);
    float secondary = sin(dot(p, normalize(vec2(-0.86, 0.51))) * 23.0 - time * 0.14);

    return (broad * 0.30 + cross * 0.22 + diagonal * secondary * 0.16) * 0.00072;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = texture2D(uState, uv).rg;

    float left = texture2D(uState, uv - vec2(uTexel.x, 0.0)).r;
    float right = texture2D(uState, uv + vec2(uTexel.x, 0.0)).r;
    float down = texture2D(uState, uv - vec2(0.0, uTexel.y)).r;
    float up = texture2D(uState, uv + vec2(0.0, uTexel.y)).r;

    float blurred = (left + right + down + up) * 0.25;
    float nextHeight = (blurred * 2.0 - center.g) * 0.991;

    float downflow = texture2D(uState, uv + vec2(0.0, -0.0014)).r * 0.004;
    float crossCurrent = texture2D(uState, uv + vec2(0.0009 * sin(uTime * 0.06), 0.0)).r * 0.004;
    nextHeight += waveSource(uv, uTime) + downflow + crossCurrent;
    nextHeight *= 0.998;
    nextHeight = clamp(nextHeight, -0.035, 0.035);

    gl_FragColor = vec4(nextHeight, center.r, 0.0, 1.0);
  }
`;

const waterFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uState;
  uniform sampler2D uWaterNormal;
  uniform vec2 uTexel;
  uniform float uTime;
  uniform float uAspect;
  uniform int uDebug;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    v += noise(p) * a;
    p = mat2(0.80, -0.60, 0.60, 0.80) * p * 2.02 + 17.1;
    a *= 0.5;
    v += noise(p) * a;
    p = mat2(0.36, -0.93, 0.93, 0.36) * p * 2.03 + 31.7;
    a *= 0.5;
    v += noise(p) * a;
    return v;
  }

  vec3 unpackNormalSample(vec2 uv) {
    vec3 n = texture2D(uWaterNormal, uv).xyz * 2.0 - 1.0;
    return vec3(n.x, n.y, max(n.z, 0.18));
  }

  vec3 blendedWaterNormal(vec2 uv, float time, vec2 simSlopeBoosted, out float outMacroSlope) {
    vec2 p = vec2(uv.x * uAspect, uv.y);

    vec2 warp = vec2(
      fbm(p * 1.70 + vec2(time * 0.012, -time * 0.009)) - 0.5,
      fbm(p * 1.65 + vec2(7.3 - time * 0.011, time * 0.013)) - 0.5
    ) * 0.040;

    vec2 d1 = vec2(time * 0.00700, time * 0.00550);
    vec2 d2 = vec2(-time * 0.01000, -time * 0.00786);
    vec2 d3 = vec2(time * 0.00700, -time * 0.00800);
    vec2 d4 = vec2(-time * 0.01167, time * 0.01333);

    vec3 n1 = unpackNormalSample(p * 0.85 + d1 + warp);
    vec3 n2 = unpackNormalSample(p.yx * 1.42 + d2 - warp);
    vec3 n3 = unpackNormalSample(p * 2.30 + d3 + warp * 0.5);
    vec3 n4 = unpackNormalSample(p.yx * 3.85 + d4 - warp * 0.5);

    vec2 macroXY = n1.xy * 0.58 + n2.xy * 0.42;
    outMacroSlope = length(macroXY);

    vec2 blendedXY = n1.xy * 0.40 + n2.xy * 0.28 + n3.xy * 0.20 + n4.xy * 0.12;
    blendedXY += simSlopeBoosted * 0.10;

    return normalize(vec3(blendedXY, 1.0));
  }

  vec3 dither(vec2 fragCoord) {
    float n = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
    return vec3((n - 0.5) / 255.0);
  }

  void main() {
    vec2 uv = vUv;

    float left = texture2D(uState, uv - vec2(uTexel.x, 0.0)).r;
    float right = texture2D(uState, uv + vec2(uTexel.x, 0.0)).r;
    float down = texture2D(uState, uv - vec2(0.0, uTexel.y)).r;
    float up = texture2D(uState, uv + vec2(0.0, uTexel.y)).r;

    vec2 simSlope = vec2(right - left, up - down);
    vec3 simNormal = normalize(vec3(-simSlope.x * 9.0, -simSlope.y * 9.0, 1.0));

    float macroSlope;
    vec3 normal = blendedWaterNormal(uv, uTime, -simSlope * 9.0, macroSlope);

    vec3 abyss = vec3(0.0118, 0.0627, 0.1098);
    vec3 deep = vec3(0.0235, 0.1490, 0.2275);
    vec3 body = vec3(0.0392, 0.2824, 0.3804);
    vec3 current = vec3(0.0549, 0.4353, 0.4902);
    vec3 shallow = vec3(0.1333, 0.6549, 0.7020);
    vec3 glint = vec3(0.5961, 0.8824, 0.8745);
    vec3 foam = vec3(0.8431, 0.9725, 0.9490);

    vec2 refractedUv = uv + normal.xy * 0.045 + simNormal.xy * 0.006;
    float surfaceSlope = smoothstep(0.012, 0.075, length(normal.xy));

    vec2 dp = vec2(refractedUv.x * uAspect, refractedUv.y);
    float depth1 = fbm(dp * 0.55 + vec2(uTime * 0.008, -uTime * 0.006));
    float depth2 = fbm(dp * 1.20 + vec2(-uTime * 0.011, uTime * 0.007));
    float depth3 = fbm(dp * 2.30 + vec2(uTime * 0.014, uTime * 0.012));
    float fakeDepth = depth1 * 0.52 + depth2 * 0.30 + depth3 * 0.18;
    fakeDepth = clamp((fakeDepth - 0.5) * 1.9 + 0.5, 0.0, 1.0);

    vec3 eyeDir = vec3(0.0, 0.0, 1.0);
    vec3 sunDir = normalize(vec3(-0.32, -0.48, 0.82));
    vec3 reflection = normalize(reflect(-sunDir, normal));
    float diffuse = clamp(dot(normal, sunDir) * 0.5 + 0.5, 0.0, 1.0);
    float spec = pow(max(dot(eyeDir, reflection), 0.0), 52.0);
    float fresnel = 0.08 + 0.42 * pow(1.0 - max(dot(eyeDir, normal), 0.0), 3.0);

    if (uDebug == 1) {
      gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
      return;
    }
    if (uDebug == 2) {
      vec2 rawP = vec2(uv.x * uAspect, uv.y) * 1.40;
      vec3 raw = unpackNormalSample(rawP);
      gl_FragColor = vec4(normalize(raw) * 0.5 + 0.5, 1.0);
      return;
    }
    if (uDebug == 3) {
      float h = (left + right + down + up) * 0.25;
      float v = clamp(h * 30.0 + 0.5, 0.0, 1.0);
      gl_FragColor = vec4(vec3(v), 1.0);
      return;
    }
    if (uDebug == 4) {
      gl_FragColor = vec4(vec3(fakeDepth), 1.0);
      return;
    }
    if (uDebug == 5) {
      gl_FragColor = vec4(diffuse, fresnel, spec, 1.0);
      return;
    }

    float vignette = smoothstep(0.72, 1.34, length((uv - 0.5) * vec2(uAspect, 1.0)));

    vec3 color = shallow;
    color = mix(color, current, smoothstep(0.20, 0.45, fakeDepth));
    color = mix(color, body, smoothstep(0.45, 0.72, fakeDepth));
    color = mix(color, deep, smoothstep(0.72, 0.92, fakeDepth));
    color = mix(color, glint, diffuse * 0.04);
    color = mix(color, abyss, vignette * 0.20 + fresnel * 0.04);
    color += glint * (spec * 0.20 + surfaceSlope * 0.05);
    color += foam * pow(max(spec, 0.0), 2.0) * 0.045;

    color += dither(gl_FragCoord.xy);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createPlaceholderNormalTexture(): THREE.DataTexture {
  const data = new Uint8Array([128, 128, 255, 255]);
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

interface WaterPlaneProps {
  onReady?: () => void;
}

function WaterPlane({ onReady }: WaterPlaneProps) {
  const { gl, size, scene, camera } = useThree();
  const simScene = useMemo(() => new THREE.Scene(), []);
  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const simMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const onReadyRef = useRef(onReady);
  const readyFiredRef = useRef(false);
  const realTextureFrameCountRef = useRef(0);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const placeholderNormal = useMemo(() => createPlaceholderNormalTexture(), []);
  const normalTextureRef = useRef<THREE.Texture | null>(null);

  const targetA = useFBO(SIM_SIZE, SIM_SIZE, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
  });
  const targetB = useFBO(SIM_SIZE, SIM_SIZE, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
  });

  const readTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const writeTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const initializedRef = useRef(false);
  const simStepCounterRef = useRef(0);
  const documentHiddenRef = useRef(false);

  const texel = useMemo(() => new THREE.Vector2(1 / SIM_SIZE, 1 / SIM_SIZE), []);
  const simUniforms = useMemo(
    () => ({
      uState: { value: targetA.texture },
      uTexel: { value: texel },
      uTime: { value: 0 },
      uAspect: { value: 1 },
    }),
    [targetA.texture, texel],
  );
  const waterUniforms = useMemo(
    () => ({
      uState: { value: targetA.texture },
      uTexel: { value: texel },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uWaterNormal: { value: placeholderNormal as THREE.Texture },
      uDebug: { value: 0 },
    }),
    [targetA.texture, texel, placeholderNormal],
  );

  useEffect(() => {
    readTargetRef.current = targetA;
    writeTargetRef.current = targetB;
  }, [targetA, targetB]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleVisibility = () => {
      documentHiddenRef.current = document.visibilityState !== "visible";
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const parseDebugFromHash = (): number => {
      const match = window.location.hash.match(/debug=([0-9]+)/);
      if (!match) {
        return 0;
      }
      const value = Number.parseInt(match[1], 10);
      if (!Number.isFinite(value) || value < 0 || value > 5) {
        return 0;
      }
      return value;
    };
    const apply = () => {
      const material = materialRef.current;
      if (!material) {
        return;
      }
      material.uniforms.uDebug.value = parseDebugFromHash();
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => {
      window.removeEventListener("hashchange", apply);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      WATER_NORMAL_URL,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.NoColorSpace;
        const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 1;
        texture.anisotropy = Math.min(4, maxAniso);
        texture.needsUpdate = true;
        // Avoid a lazy GPU upload on the first textured frame.
        gl.initTexture(texture);
        normalTextureRef.current = texture;
      },
      undefined,
      () => {
        normalTextureRef.current = null;
      },
    );
    return () => {
      cancelled = true;
      const current = normalTextureRef.current;
      if (current) {
        current.dispose();
        normalTextureRef.current = null;
      }
    };
  }, [gl]);

  useEffect(() => {
    type GLWithCompileAsync = THREE.WebGLRenderer & {
      compileAsync?: (
        scene: THREE.Object3D,
        camera: THREE.Camera,
      ) => Promise<unknown>;
    };
    const renderer = gl as GLWithCompileAsync;
    const compileSync = () => {
      gl.compile(scene, camera);
      gl.compile(simScene, simCamera);
    };
    if (typeof renderer.compileAsync === "function") {
      Promise.all([
        renderer.compileAsync(scene, camera),
        renderer.compileAsync(simScene, simCamera),
      ]).catch(compileSync);
    } else {
      compileSync();
    }
  }, [gl, scene, camera, simScene, simCamera]);

  useEffect(() => {
    return () => {
      placeholderNormal.dispose();
    };
  }, [placeholderNormal]);

  useFrame((state) => {
    if (documentHiddenRef.current) {
      return;
    }

    const readTarget = readTargetRef.current;
    const writeTarget = writeTargetRef.current;
    const simMaterial = simMaterialRef.current;
    const material = materialRef.current;
    if (!readTarget || !writeTarget || !simMaterial || !material) {
      return;
    }

    if (!initializedRef.current) {
      const previousTarget = gl.getRenderTarget();
      const previousColor = new THREE.Color();
      gl.getClearColor(previousColor);
      const previousAlpha = gl.getClearAlpha();
      gl.setClearColor(0x000000, 1);
      gl.setRenderTarget(targetA);
      gl.clear();
      gl.setRenderTarget(targetB);
      gl.clear();
      gl.setRenderTarget(previousTarget);
      gl.setClearColor(previousColor, previousAlpha);
      initializedRef.current = true;
    }

    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.1);

    simStepCounterRef.current = (simStepCounterRef.current + 1) % 2;
    const stepSim = simStepCounterRef.current === 0;

    if (stepSim) {
      simMaterial.uniforms.uTime.value = state.clock.elapsedTime;
      simMaterial.uniforms.uAspect.value = aspect;
      simMaterial.uniforms.uState.value = readTarget.texture;

      gl.setRenderTarget(writeTarget);
      gl.render(simScene, simCamera);
      gl.setRenderTarget(null);

      readTargetRef.current = writeTarget;
      writeTargetRef.current = readTarget;
    }

    const activeRead = readTargetRef.current ?? readTarget;
    const realNormal = normalTextureRef.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uAspect.value = aspect;
    material.uniforms.uState.value = activeRead.texture;
    material.uniforms.uWaterNormal.value = realNormal ?? placeholderNormal;

    if (!readyFiredRef.current) {
      if (realNormal) {
        realTextureFrameCountRef.current += 1;
        if (realTextureFrameCountRef.current >= READY_FRAME_THRESHOLD) {
          readyFiredRef.current = true;
          onReadyRef.current?.();
        }
      } else {
        realTextureFrameCountRef.current = 0;
      }
    }
  });

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            ref={simMaterialRef}
            uniforms={simUniforms}
            vertexShader={screenVertexShader}
            fragmentShader={simulationFragmentShader}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>,
        simScene,
      )}
      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={waterUniforms}
          vertexShader={screenVertexShader}
          fragmentShader={waterFragmentShader}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

interface WaterWorldProps {
  onReady?: () => void;
}

function MobileWaterFrameDriver({ enabled }: { enabled: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }
    const intervalId = window.setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        invalidate();
      }
    }, MOBILE_WATER_FRAME_MS);
    invalidate();
    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, invalidate]);

  return null;
}

export function WaterPosterFallback({
  canvasFallback = false,
}: {
  canvasFallback?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={
        canvasFallback
          ? "water-poster-canvas-fallback"
          : "water-poster-fallback"
      }
    />
  );
}

export function WaterWorld({ onReady }: WaterWorldProps = {}) {
  const [generation, setGeneration] = useState(0);
  const [mobileFrameCap, setMobileFrameCap] = useState(false);
  const [contextFallbackVisible, setContextFallbackVisible] = useState(false);
  const cleanupContextListenersRef = useRef<(() => void) | null>(null);
  const recoveryTimeoutRef = useRef<number | null>(null);

  const handleReady = useCallback(() => {
    setContextFallbackVisible(false);
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    return () => {
      cleanupContextListenersRef.current?.();
      cleanupContextListenersRef.current = null;
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
        recoveryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const query = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobileFrameCap(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className="water-world-host">
      <Canvas
        key={generation}
        fallback={<WaterPosterFallback canvasFallback />}
        frameloop={mobileFrameCap ? "demand" : "always"}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "default",
        }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.setClearColor(CLEAR_COLOR, 1);
          cleanupContextListenersRef.current?.();

          const canvas = gl.domElement;
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            setContextFallbackVisible(true);
            if (recoveryTimeoutRef.current !== null) {
              window.clearTimeout(recoveryTimeoutRef.current);
            }
            recoveryTimeoutRef.current = window.setTimeout(() => {
              setGeneration((current) => current + 1);
              recoveryTimeoutRef.current = null;
            }, CONTEXT_RECOVERY_TIMEOUT_MS);
          };
          const handleContextRestored = () => {
            if (recoveryTimeoutRef.current !== null) {
              window.clearTimeout(recoveryTimeoutRef.current);
              recoveryTimeoutRef.current = null;
            }
            setGeneration((current) => current + 1);
          };

          canvas.addEventListener("webglcontextlost", handleContextLost, true);
          canvas.addEventListener(
            "webglcontextrestored",
            handleContextRestored,
            true,
          );
          cleanupContextListenersRef.current = () => {
            canvas.removeEventListener(
              "webglcontextlost",
              handleContextLost,
              true,
            );
            canvas.removeEventListener(
              "webglcontextrestored",
              handleContextRestored,
              true,
            );
          };
        }}
      >
        <MobileWaterFrameDriver enabled={mobileFrameCap} />
        <WaterPlane onReady={handleReady} />
      </Canvas>
      {contextFallbackVisible ? <WaterPosterFallback /> : null}
    </div>
  );
}
