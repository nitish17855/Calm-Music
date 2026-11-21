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
  length?: number; // for rain
  rotation?: number; // for rose petals
  vRot?: number;
}

interface TreeSilhouette {
  x: number;
  y: number;
  scale: number;
  side: 'left' | 'right';
  type: number;
}

interface MoodBackgroundProps {
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
      initTrees();
    };

    window.addEventListener('resize', handleResize);

    // Particle state
    let particles: Particle[] = [];
    let trees: TreeSilhouette[] = [];
    let roadOffset = 0;

    const initTrees = () => {
      trees = [];
      const treeCount = 18;
      for (let i = 0; i < treeCount; i++) {
        trees.push({
          x: i % 2 === 0 ? width * 0.15 * Math.random() : width * (0.85 + Math.random() * 0.15),
          y: height * 0.4 + (i / treeCount) * (height * 0.6),
          scale: 0.6 + (i / treeCount) * 0.8,
          side: i % 2 === 0 ? 'left' : 'right',
          type: Math.floor(Math.random() * 3),
        });
      }
    };

    const initParticles = () => {
      particles = [];
      const count = config.particleCount;

      for (let i = 0; i < count; i++) {
        if (mood === 'rain') {
          // Rain stays fast and brisk as preferred by user
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.6 - Math.random() * 0.4,
            vy: 6 + Math.random() * 6,
            size: 1 + Math.random() * 1.5,
            length: 16 + Math.random() * 18,
            alpha: 0.2 + Math.random() * 0.4,
            baseAlpha: 0.2 + Math.random() * 0.4,
          });
        } else if (mood === 'night') {
          // Night stars: ultra-slow, peaceful, NO dizzying speed
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.04,
            vy: (Math.random() - 0.5) * 0.04,
            size: 0.8 + Math.random() * 2,
            alpha: 0.2 + Math.random() * 0.6,
            baseAlpha: 0.2 + Math.random() * 0.6,
          });
        } else if (mood === 'rose') {
          // Rose petals: slow, serene, gentle floating drift
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.15 + Math.random() * 0.3,
            vy: 0.15 + Math.random() * 0.25,
            size: 2.5 + Math.random() * 3.5,
            alpha: 0.15 + Math.random() * 0.45,
            baseAlpha: 0.15 + Math.random() * 0.45,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.008,
          });
        } else if (mood === 'drive') {
          // Jungle Drive: soft glowing fireflies in the jungle canopy
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.7,
            vx: (Math.random() - 0.5) * 0.1,
            vy: -0.05 - Math.random() * 0.15,
            size: 1.5 + Math.random() * 2.5,
            alpha: 0.15 + Math.random() * 0.45,
            baseAlpha: 0.15 + Math.random() * 0.45,
          });
        } else {
          // Forest focus: slow, tranquil upward spores
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.08,
            vy: -0.1 - Math.random() * 0.15,
            size: 2 + Math.random() * 3.5,
            alpha: 0.15 + Math.random() * 0.45,
            baseAlpha: 0.15 + Math.random() * 0.45,
          });
        }
      }
    };

    initParticles();
    initTrees();

    let time = 0;

    const render = () => {
      time += 0.01;

      // 1. Draw smooth background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width * 0.8, height);
      bgGradient.addColorStop(0, config.gradient.from);
      bgGradient.addColorStop(0.5, config.gradient.via);
      bgGradient.addColorStop(1, config.gradient.to);

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient glowing aura
      const auraGradient = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.3) * (width * 0.1),
        height * 0.4,
        40,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.65
      );

      const glowEnergy = 1 + audioEnergy * 0.5;

      if (mood === 'drive') {
        auraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.08 * glowEnergy})`);
        auraGradient.addColorStop(0.5, `rgba(5, 150, 105, ${0.04 * glowEnergy})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (mood === 'rose') {
        auraGradient.addColorStop(0, `rgba(244, 63, 94, ${0.1 * glowEnergy})`);
        auraGradient.addColorStop(0.5, `rgba(190, 24, 93, ${0.05 * glowEnergy})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (mood === 'night') {
        auraGradient.addColorStop(0, `rgba(99, 102, 241, ${0.09 * glowEnergy})`);
        auraGradient.addColorStop(0.5, `rgba(79, 70, 229, ${0.04 * glowEnergy})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (mood === 'rain') {
        auraGradient.addColorStop(0, `rgba(56, 189, 248, ${0.1 * glowEnergy})`);
        auraGradient.addColorStop(0.5, `rgba(14, 116, 144, ${0.05 * glowEnergy})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auraGradient.addColorStop(0, `rgba(52, 211, 153, ${0.08 * glowEnergy})`);
        auraGradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.04 * glowEnergy})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, width, height);

      // If Jungle Drive mode, render the car cruising through the vast jungle
      if (mood === 'drive' && !prefersReducedMotion) {
        roadOffset = (roadOffset + 1.2) % 60;

        // Distant jungle canopy mountain silhouettes
        ctx.fillStyle = '#020b05';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.48);
        for (let x = 0; x <= width; x += 50) {
          const y = height * 0.44 + Math.sin(x * 0.003 + 1) * 30 + Math.cos(x * 0.007) * 15;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();

        // Moonlight / jungle mist in horizon
        const moonGrad = ctx.createRadialGradient(width * 0.5, height * 0.38, 10, width * 0.5, height * 0.4, 180);
        moonGrad.addColorStop(0, 'rgba(167, 243, 208, 0.12)');
        moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = moonGrad;
        ctx.fillRect(0, 0, width, height);

        // Towering Jungle Tree Silhouettes (Left & Right Layers)
        ctx.fillStyle = '#03140a';
        trees.forEach((t) => {
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.beginPath();
          // Pine / jungle palm canopy
          const trunkW = 6 * t.scale;
          const trunkH = 120 * t.scale;
          ctx.fillRect(-trunkW / 2, 0, trunkW, trunkH);

          // Foliage
          ctx.beginPath();
          ctx.arc(0, -10 * t.scale, 40 * t.scale, 0, Math.PI * 2);
          ctx.arc(-20 * t.scale, 10 * t.scale, 30 * t.scale, 0, Math.PI * 2);
          ctx.arc(20 * t.scale, 10 * t.scale, 30 * t.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#04180d';
          ctx.fill();
          ctx.restore();
        });

        // Perspective Road: Narrow at horizon (height * 0.48), wide at bottom
        const horizonY = height * 0.48;
        const horizonW = 40;
        const bottomW = Math.min(width * 0.5, 480);
        const roadCenterX = width * 0.5;

        // Dark asphalt
        ctx.beginPath();
        ctx.moveTo(roadCenterX - horizonW / 2, horizonY);
        ctx.lineTo(roadCenterX + horizonW / 2, horizonY);
        ctx.lineTo(roadCenterX + bottomW / 2, height);
        ctx.lineTo(roadCenterX - bottomW / 2, height);
        ctx.closePath();
        ctx.fillStyle = '#06130b';
        ctx.fill();

        // Road edge borders
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dashed Centerline gliding smoothly
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([18, 22]);
        ctx.lineDashOffset = -roadOffset;
        ctx.beginPath();
        ctx.moveTo(roadCenterX, horizonY);
        ctx.lineTo(roadCenterX, height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Headlight Beams illuminating the road ahead
        const carY = height * 0.73 + Math.sin(time * 2) * 1.5; // Gentle cruising suspension bob
        const carX = roadCenterX;

        ctx.save();
        const beamGrad = ctx.createRadialGradient(
          carX,
          carY - 10,
          10,
          carX,
          carY - 140,
          180
        );
        beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.25 + audioEnergy * 0.2})`);
        beamGrad.addColorStop(0.6, `rgba(254, 240, 138, ${0.08 + audioEnergy * 0.1})`);
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(carX - 18, carY - 8);
        ctx.lineTo(carX - 70, horizonY + 20);
        ctx.lineTo(carX + 70, horizonY + 20);
        ctx.lineTo(carX + 18, carY - 8);
        ctx.closePath();
        ctx.fillStyle = beamGrad;
        ctx.fill();
        ctx.restore();

        // The Car (Third-person rear perspective)
        ctx.save();
        ctx.translate(carX, carY);

        // Car Shadow
        ctx.beginPath();
        ctx.ellipse(0, 18, 38, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fill();

        // Car Body (Aerodynamic silhouette)
        ctx.fillStyle = '#0c121e';
        ctx.beginPath();
        ctx.roundRect(-30, -12, 60, 26, 8);
        ctx.fill();

        // Car Roof / Rear Glass Window
        ctx.fillStyle = '#05080e';
        ctx.beginPath();
        ctx.roundRect(-22, -26, 44, 16, 5);
        ctx.fill();

        // Rear window tint reflection
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.beginPath();
        ctx.moveTo(-18, -14);
        ctx.lineTo(-12, -23);
        ctx.lineTo(12, -23);
        ctx.lineTo(18, -14);
        ctx.closePath();
        ctx.fill();

        // Glowing Ruby Taillights (Left & Right)
        const tailGlow = 8 + audioEnergy * 8;
        // Left light
        ctx.shadowBlur = tailGlow;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(-26, 0, 12, 5, 2);
        ctx.fill();

        // Right light
        ctx.beginPath();
        ctx.roundRect(14, 0, 12, 5, 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Rear License Plate soft glow
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-9, 4, 18, 6);

        ctx.restore();
      }

      if (prefersReducedMotion) {
        return;
      }

      // 3. Render and update ambient particles with CALM, STEADY SPEED (no fast eye-strain movement)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Pulse alpha gently with music, NOT speed
        const pulse = Math.sin(time * 1.5 + i) * 0.15;
        const currentAlpha = Math.max(0.05, Math.min(0.85, p.baseAlpha + pulse + audioEnergy * 0.25));

        if (mood === 'rain') {
          // Rain falls briskly (user approved)
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + (p.length || 15));
          ctx.strokeStyle = `rgba(186, 230, 253, ${currentAlpha * 0.75})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Move raindrop without harsh multiplier
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
        } else if (mood === 'night') {
          // Starlight: ultra-calm, slow drift, zero eye strain
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 231, 255, ${currentAlpha})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(199, 210, 254, 0.6)';
          ctx.fill();
          ctx.shadowBlur = 0;

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        } else if (mood === 'rose') {
          // Rose petals: slow tranquil glide
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
          }
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 113, 133, ${currentAlpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
          ctx.fill();
          ctx.restore();

          // Gentle constant drift without speed jerks
          p.x += p.vx + Math.sin(time + i) * 0.15;
          p.y += p.vy;
          if (p.rotation !== undefined && p.vRot) {
            p.rotation += p.vRot;
          }

          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        } else {
          // Jungle Drive fireflies or Forest Focus spores: peaceful floating
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 243, 208, ${currentAlpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(52, 211, 153, 0.5)';
          ctx.fill();
          ctx.shadowBlur = 0;

          p.x += p.vx + Math.sin(time + i) * 0.15;
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
