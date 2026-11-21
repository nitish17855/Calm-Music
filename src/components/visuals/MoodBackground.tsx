"use client";

import React, { useEffect, useRef } from 'react';
import { useMood } from '@/context/MoodContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  length?: number; // for rain
  hue?: number;
}

interface MoodBackgroundProps {
  // Reserved for Step 3: Audio analyser data (e.g. 0.0 to 1.0 energy boost)
  audioEnergy?: number;
}

export default function MoodBackground({ audioEnergy = 0 }: MoodBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { mood, config } = useMood();
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Particle setup
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = config.particleCount;

      for (let i = 0; i < count; i++) {
        if (mood === 'rain') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.5 - Math.random() * 0.5,
            vy: 4 + Math.random() * 5,
            size: 1 + Math.random() * 1.5,
            length: 12 + Math.random() * 18,
            alpha: 0.2 + Math.random() * 0.4,
            baseAlpha: 0.2 + Math.random() * 0.4,
            pulseSpeed: 0.02,
          });
        } else if (mood === 'night') {
          // Starlight / Cosmic dust
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            size: 0.8 + Math.random() * 2.2,
            alpha: 0.2 + Math.random() * 0.7,
            baseAlpha: 0.2 + Math.random() * 0.7,
            pulseSpeed: 0.01 + Math.random() * 0.02,
          });
        } else {
          // 'focus' - Warm emerald orbs / fireflies
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.2 - Math.random() * 0.4,
            size: 2 + Math.random() * 4,
            alpha: 0.15 + Math.random() * 0.5,
            baseAlpha: 0.15 + Math.random() * 0.5,
            pulseSpeed: 0.015 + Math.random() * 0.02,
          });
        }
      }
    };

    initParticles();

    let time = 0;

    const render = () => {
      time += 0.015;

      // 1. Draw smooth multi-stop ambient background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width * 0.8, height);
      bgGradient.addColorStop(0, config.gradient.from);
      bgGradient.addColorStop(0.5, config.gradient.via);
      bgGradient.addColorStop(1, config.gradient.to);

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient glowing aura / nebula spots
      const reactiveBoost = 1 + audioEnergy * 0.8;
      
      const auraGradient = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.5) * (width * 0.15),
        height * 0.4 + Math.cos(time * 0.3) * (height * 0.1),
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.65
      );

      if (mood === 'night') {
        auraGradient.addColorStop(0, `rgba(99, 102, 241, ${0.12 * reactiveBoost})`);
        auraGradient.addColorStop(0.5, `rgba(79, 70, 229, ${0.06 * reactiveBoost})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (mood === 'rain') {
        auraGradient.addColorStop(0, `rgba(56, 189, 248, ${0.1 * reactiveBoost})`);
        auraGradient.addColorStop(0.5, `rgba(14, 116, 144, ${0.05 * reactiveBoost})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auraGradient.addColorStop(0, `rgba(52, 211, 153, ${0.11 * reactiveBoost})`);
        auraGradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.05 * reactiveBoost})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, width, height);

      // If prefers-reduced-motion, stop drawing animated particles to preserve calm and comfort
      if (prefersReducedMotion) {
        return;
      }

      // 3. Render and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Alpha breathing effect
        const pulse = Math.sin(time * 2 + i) * 0.25;
        const currentAlpha = Math.max(0.05, Math.min(1, p.baseAlpha + pulse + audioEnergy * 0.4));

        if (mood === 'rain') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + (p.length || 15));
          ctx.strokeStyle = `rgba(186, 230, 253, ${currentAlpha * 0.7})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Move raindrop
          p.x += p.vx;
          p.y += p.vy * (1 + audioEnergy * 0.5);

          // Recycle
          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
        } else if (mood === 'night') {
          // Twinkling stars / cosmic dust
          ctx.beginPath();
          const starSize = (p.size + audioEnergy * 1.5);
          ctx.arc(p.x, p.y, starSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 231, 255, ${currentAlpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(199, 210, 254, 0.8)';
          ctx.fill();
          ctx.shadowBlur = 0; // reset

          // Subtle drift
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        } else {
          // Forest focus: glowing spore orbs
          ctx.beginPath();
          const orbSize = (p.size * (1 + audioEnergy * 0.6));
          ctx.arc(p.x, p.y, orbSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 243, 208, ${currentAlpha})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(52, 211, 153, 0.7)';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Gentle floating upward & sinusoidal drift
          p.x += p.vx + Math.sin(time + i) * 0.3;
          p.y += p.vy;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [mood, config, audioEnergy]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-1000 ease-in-out"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
