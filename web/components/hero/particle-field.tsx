"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";

const BRAND_RED = [1.0, 0.231, 0.0] as const;
const GRAY_DIM = [0.45, 0.45, 0.45] as const;
const GRAY_MUTED = [0.7, 0.7, 0.7] as const;
const WHITE = [0.96, 0.96, 0.96] as const;

export interface ParticleFieldRef {
  triggerShockwave: () => void;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Shader compile failed");
  }
  return shader;
}

const VERTEX_SHADER = `
  attribute vec2 a_pos;
  attribute float a_size;
  attribute vec3 a_color;
  attribute float a_opacity;
  varying vec3 v_color;
  varying float v_opacity;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
    gl_PointSize = a_size;
    v_color = a_color;
    v_opacity = a_opacity;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 v_color;
  varying float v_opacity;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d) * v_opacity;
    gl_FragColor = vec4(v_color, a);
  }
`;

function pickColor() {
  const r = Math.random();
  if (r > 0.80) return WHITE;
  if (r > 0.40) return GRAY_MUTED;
  return GRAY_DIM;
}

const COUNT = 3500;
const STRIDE = 10; // x, y, vx, vy, r, g, b, size, opacity, shockTimer

export const ParticleField = forwardRef<ParticleFieldRef, { className?: string }>(
  function ParticleField({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const dataRef = useRef<Float32Array>(new Float32Array(COUNT * STRIDE));
    const animRef = useRef(0);
    const shockwaveRef = useRef<{ x: number; y: number; time: number; active: boolean }>({
      x: 0, y: 0, time: 0, active: false,
    });
    const reducedMotionRef = useRef(false);

    const triggerShockwave = useCallback(() => {
      shockwaveRef.current = {
        x: (Math.random() - 0.5) * 1.8,
        y: -0.6 + Math.random() * 0.4,
        time: 0,
        active: true,
      };
    }, []);

    useImperativeHandle(ref, () => ({ triggerShockwave }));

    useEffect(() => {
      reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
      });
      if (!gl) return;
      glRef.current = gl;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const targetW = Math.floor(w * dpr);
        const targetH = Math.floor(h * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      const program = gl.createProgram()!;
      gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);

      // Init particles
      const data = dataRef.current;
      for (let i = 0; i < COUNT; i++) {
        const off = i * STRIDE;
        data[off + 0] = (Math.random() - 0.5) * 2.8;
        data[off + 1] = (Math.random() - 0.5) * 2.8;
        data[off + 2] = (Math.random() - 0.5) * 0.0015;
        data[off + 3] = 0.0008 + Math.random() * 0.0025;
        const c = pickColor();
        data[off + 4] = c[0];
        data[off + 5] = c[1];
        data[off + 6] = c[2];
        data[off + 7] = 1.8 + Math.random() * 2.8;
        data[off + 8] = 0.55 + Math.random() * 0.45;
        data[off + 9] = 0;
      }

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);

      const aPos = gl.getAttribLocation(program, "a_pos");
      const aSize = gl.getAttribLocation(program, "a_size");
      const aColor = gl.getAttribLocation(program, "a_color");
      const aOpacity = gl.getAttribLocation(program, "a_opacity");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      let lastTime = performance.now();
      const reduced = reducedMotionRef.current;

      const render = (time: number) => {
        const dt = reduced ? 0 : Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        const sw = shockwaveRef.current;

        if (!reduced) {
          if (sw.active) {
            sw.time += dt;
            if (sw.time > 2.0) sw.active = false;
          }

          for (let i = 0; i < COUNT; i++) {
            const off = i * STRIDE;
            let x = data[off + 0];
            let y = data[off + 1];
            let vx = data[off + 2];
            let vy = data[off + 3];

            if (sw.active) {
              const dx = x - sw.x;
              const dy = y - sw.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const radius = sw.time * 1.8;
              const width = 0.25;
              const distFromWave = Math.abs(dist - radius);
              if (distFromWave < width && dist < radius + 0.5) {
                const force = (1 - distFromWave / width) * 0.025 * (1 - sw.time / 2.0);
                const angle = Math.atan2(dy, dx);
                vx += Math.cos(angle) * force;
                vy += Math.sin(angle) * force;
                data[off + 4] = BRAND_RED[0];
                data[off + 5] = BRAND_RED[1];
                data[off + 6] = BRAND_RED[2];
                data[off + 9] = 1.0;
              }
            }

            // Return color to base
            const st = data[off + 9];
            if (st > 0) {
              data[off + 9] = Math.max(0, st - dt * 1.2);
              data[off + 4] += (GRAY_DIM[0] - data[off + 4]) * dt * 1.5;
              data[off + 5] += (GRAY_DIM[1] - data[off + 5]) * dt * 1.5;
              data[off + 6] += (GRAY_DIM[2] - data[off + 6]) * dt * 1.5;
            }

            // Damping
            vx *= 0.98;
            vy *= 0.98;

            // Base drift
            vy += 0.0003;
            x += vx;
            y += vy;

            // Wrap
            if (y > 1.3) {
              y = -1.3;
              x = (Math.random() - 0.5) * 2.8;
              vx = (Math.random() - 0.5) * 0.0015;
              vy = 0.0008 + Math.random() * 0.0025;
              const c = pickColor();
              data[off + 4] = c[0];
              data[off + 5] = c[1];
              data[off + 6] = c[2];
              data[off + 9] = 0;
            }

            data[off + 0] = x;
            data[off + 1] = y;
            data[off + 2] = vx;
            data[off + 3] = vy;
          }
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);

        const F = 4;
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, STRIDE * F, 0);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, STRIDE * F, 7 * F);
        gl.enableVertexAttribArray(aSize);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, STRIDE * F, 4 * F);
        gl.enableVertexAttribArray(aColor);
        gl.vertexAttribPointer(aOpacity, 1, gl.FLOAT, false, STRIDE * F, 8 * F);
        gl.enableVertexAttribArray(aOpacity);

        gl.drawArrays(gl.POINTS, 0, COUNT);

        animRef.current = requestAnimationFrame(render);
      };

      animRef.current = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animRef.current);
        ro.disconnect();
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    );
  }
);
