"use client";

import React, { useEffect, useRef, useState } from 'react';
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

interface RoadsideFeature {
  z: number;
  side: 'left' | 'right';
  type: 'boulder' | 'milestone' | 'reflector';
  scale: number;
}

interface MoodBackgroundProps {
  audioEnergy?: number;
}

// Prometheus Inspired 5-Color Palette:
// 1. #244855 - Deep Petrol Teal
// 2. #E64833 - Sunburst Terracotta / Crimson
// 3. #874F41 - Earthy Canyon Bronze
// 4. #90AEAD - Atmospheric Sage / Dusty Cyan
// 5. #FBE9D0 - Soft Warm Cream

export default function MoodBackground({ audioEnergy = 0 }: MoodBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { mood, config, drivePerspective } = useMood();
  const animationFrameRef = useRef<number | null>(null);
  
  // Real-time HUD readout state for the driving interface
  const [hudSpeed, setHudSpeed] = useState(75);
  const [hudDistance, setHudDistance] = useState(0);

  // Touch control states for mobile driving
  const touchControlsRef = useRef({
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
  });

  // Use a ref for audioEnergy to avoid recreating canvas loop on every audio tick
  const audioEnergyRef = useRef(audioEnergy);
  useEffect(() => {
    audioEnergyRef.current = audioEnergy;
  }, [audioEnergy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
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
    };

    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // INTERACTIVE DRIVING DYNAMICS STATE
    // -------------------------------------------------------------
    let targetSpeed = 75; // km/h (range: 30 to 155)
    let currentSpeed = 75;
    let targetSteer = 0; // -1 (left) to +1 (right)
    let currentSteer = 0;
    let carLaneOffset = 0; // lateral position on highway
    let roadProgress = 0;
    let roadDistance = 0;
    let totalDistanceKm = 0;

    const activeKeys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        activeKeys[e.code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      delete activeKeys[e.code];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Roadside features rushing past (speed sensation without blocking trees)
    let roadsideFeatures: RoadsideFeature[] = [];
    const initRoadside = () => {
      roadsideFeatures = [];
      for (let i = 0; i < 18; i++) {
        roadsideFeatures.push({
          z: i / 18,
          side: i % 2 === 0 ? 'left' : 'right',
          type: i % 3 === 0 ? 'milestone' : i % 3 === 1 ? 'reflector' : 'boulder',
          scale: 0.65 + Math.random() * 0.7,
        });
      }
    };
    initRoadside();

    // Particle state
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = config.particleCount;

      for (let i = 0; i < count; i++) {
        if (mood === 'rain') {
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
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.006,
            vy: (Math.random() - 0.5) * 0.006,
            size: 0.8 + Math.random() * 1.6,
            alpha: 0.2 + Math.random() * 0.5,
            baseAlpha: 0.2 + Math.random() * 0.5,
          });
        } else if (mood === 'rose') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.04 + Math.random() * 0.08,
            vy: 0.06 + Math.random() * 0.08,
            size: 2.2 + Math.random() * 2.8,
            alpha: 0.15 + Math.random() * 0.35,
            baseAlpha: 0.15 + Math.random() * 0.35,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.004,
          });
        } else if (mood === 'drive') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.72,
            vx: (Math.random() - 0.5) * 0.015,
            vy: -0.01 - Math.random() * 0.02,
            size: 1.2 + Math.random() * 2.2,
            alpha: 0.15 + Math.random() * 0.4,
            baseAlpha: 0.15 + Math.random() * 0.4,
          });
        } else {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.01,
            vy: -0.02 - Math.random() * 0.03,
            size: 1.5 + Math.random() * 2.2,
            alpha: 0.15 + Math.random() * 0.35,
            baseAlpha: 0.15 + Math.random() * 0.35,
          });
        }
      }
    };

    initParticles();

    let time = 0;
    let hudUpdateCounter = 0;

    // Helper: Draw Mercedes-Benz Three-Pointed Star Chrome Emblem
    const drawMercedesStar = (x: number, y: number, radius: number) => {
      ctx.save();
      ctx.translate(x, y);

      // Outer chrome ring
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = radius * 0.18;
      ctx.stroke();

      // Inner ring shadow
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Three Star Points: 12 o'clock, 4 o'clock, 8 o'clock
      const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
      const starR = radius * 0.85;

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;

      for (let i = 0; i < 3; i++) {
        const a = angles[i];
        const tipX = Math.cos(a) * starR;
        const tipY = Math.sin(a) * starR;

        const leftA = a + 0.32;
        const rightA = a - 0.32;
        const baseR = radius * 0.2;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(Math.cos(leftA) * baseR, Math.sin(leftA) * baseR);
        ctx.closePath();
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(Math.cos(rightA) * baseR, Math.sin(rightA) * baseR);
        ctx.closePath();
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw Mercedes AMG Turbine Air Vent with Chrome Rim and Ambient Backlight
    const drawTurbineVent = (x: number, y: number, radius: number, curAudioEnergy: number) => {
      ctx.save();
      ctx.translate(x, y);

      // Outer bezel ring
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0f14';
      ctx.fill();
      const bezelGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      bezelGrad.addColorStop(0, '#e2e8f0');
      bezelGrad.addColorStop(0.5, '#64748b');
      bezelGrad.addColorStop(1, '#1e293b');
      ctx.strokeStyle = bezelGrad;
      ctx.lineWidth = radius * 0.16;
      ctx.stroke();

      // Inner ambient red/amber LED glow pulsing to music
      const ventGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.75);
      ventGlow.addColorStop(0, `rgba(230, 72, 51, ${0.45 + curAudioEnergy * 0.5})`);
      ventGlow.addColorStop(0.7, `rgba(230, 72, 51, ${0.15 + curAudioEnergy * 0.25})`);
      ventGlow.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = ventGlow;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // 4 Aerodynamic Turbine Vanes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * (radius * 0.72), Math.sin(angle) * (radius * 0.72));
        ctx.stroke();
      }

      // Center knob
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    // Render loop
    const render = () => {
      time += 0.008;
      const curAudio = audioEnergyRef.current;

      // -------------------------------------------------------------
      // SCENIC CANYON DRIVE (Interactive Driving with Real Speed & Steering)
      // -------------------------------------------------------------
      if (mood === 'drive') {
        // 1. Process User Driving Input (Arrow Keys / W A S D + Mobile Touch Controls)
        const touch = touchControlsRef.current;
        const isAccelerating = activeKeys['ArrowUp'] || activeKeys['KeyW'] || touch.accelerate;
        const isBraking = activeKeys['ArrowDown'] || activeKeys['KeyS'] || touch.brake;
        const isSteeringLeft = activeKeys['ArrowLeft'] || activeKeys['KeyA'] || touch.steerLeft;
        const isSteeringRight = activeKeys['ArrowRight'] || activeKeys['KeyD'] || touch.steerRight;

        if (isAccelerating) {
          targetSpeed = Math.min(150, targetSpeed + 0.9);
        } else if (isBraking) {
          targetSpeed = Math.max(30, targetSpeed - 1.4);
        } else {
          // Smoothly relax toward comfortable cruising speed
          targetSpeed += (75 - targetSpeed) * 0.004;
        }

        if (isSteeringLeft) {
          targetSteer = Math.max(-1.0, targetSteer - 0.08);
        } else if (isSteeringRight) {
          targetSteer = Math.min(1.0, targetSteer + 0.08);
        } else {
          // Auto-center spring return
          targetSteer *= 0.82;
        }

        // Smooth physics interpolation
        currentSpeed += (targetSpeed - currentSpeed) * 0.08;
        currentSteer += (targetSteer - currentSteer) * 0.12;

        hudUpdateCounter++;
        if (hudUpdateCounter % 15 === 0) {
          setHudSpeed(Math.round(currentSpeed));
          setHudDistance(totalDistanceKm);
        }

        // Lane position & road distance
        const speedRatio = currentSpeed / 75;
        carLaneOffset = Math.max(-width * 0.16, Math.min(width * 0.16, carLaneOffset + currentSteer * (currentSpeed * 0.035)));
        roadProgress = (roadProgress + 0.004 * speedRatio) % 1.0;
        roadDistance += currentSpeed * 0.12;
        totalDistanceKm += (currentSpeed / 216000);

        // Subtle organic winding canyon curvature
        const canyonCurve = Math.sin(roadDistance * 0.0006) * 35;
        const roadCenterX = width * 0.5 - carLaneOffset + canyonCurve;

        const horizonY = height * 0.48;
        const bottomW = Math.min(width * 0.84, 980);

        // 2. SKY: Panoramic Sunset Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#244855');    // Zenith: Deep Petrol Teal
        skyGrad.addColorStop(0.48, '#355c68'); // Petrol to sage blend
        skyGrad.addColorStop(0.72, '#90AEAD'); // Atmospheric Sage
        skyGrad.addColorStop(0.88, '#E64833'); // Sunburst Terracotta Glow
        skyGrad.addColorStop(1, '#FBE9D0');    // Horizon: Soft Warm Cream
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY + 2);

        // Radiant Sunburst Flare at Horizon Pass
        const sunFlare = ctx.createRadialGradient(
          roadCenterX,
          horizonY - 6,
          8,
          roadCenterX,
          horizonY - 6,
          width * 0.5
        );
        sunFlare.addColorStop(0, 'rgba(251, 233, 208, 0.9)');
        sunFlare.addColorStop(0.35, 'rgba(230, 72, 51, 0.45)');
        sunFlare.addColorStop(0.75, 'rgba(144, 174, 173, 0.15)');
        sunFlare.addColorStop(1, 'rgba(36, 72, 85, 0)');
        ctx.fillStyle = sunFlare;
        ctx.fillRect(0, 0, width, horizonY + 2);

        // Sweeping Clouds
        ctx.save();
        ctx.fillStyle = 'rgba(251, 233, 208, 0.35)';
        ctx.beginPath();
        ctx.ellipse(width * 0.22, height * 0.14, width * 0.26, 18, 0.05, 0, Math.PI * 2);
        ctx.ellipse(width * 0.76, height * 0.19, width * 0.32, 24, -0.04, 0, Math.PI * 2);
        ctx.ellipse(width * 0.46, height * 0.26, width * 0.22, 16, 0.02, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(230, 72, 51, 0.22)';
        ctx.beginPath();
        ctx.ellipse(width * 0.23, height * 0.15, width * 0.22, 11, 0.05, 0, Math.PI * 2);
        ctx.ellipse(width * 0.77, height * 0.20, width * 0.28, 15, -0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. DISTANT MOUNTAINS WITH CANYON PASS AT HORIZON (Natural V-notch)
        ctx.fillStyle = '#244855';
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        // Left alpine mountains slope down to pass
        ctx.lineTo(0, horizonY - 35);
        ctx.lineTo(width * 0.15, horizonY - 55);
        ctx.lineTo(width * 0.32, horizonY - 32);
        ctx.lineTo(roadCenterX - 18, horizonY - 4);
        ctx.lineTo(roadCenterX, horizonY); // Road joins horizon at this pass!
        // Right alpine mountains slope up
        ctx.lineTo(roadCenterX + 18, horizonY - 4);
        ctx.lineTo(width * 0.68, horizonY - 36);
        ctx.lineTo(width * 0.85, horizonY - 58);
        ctx.lineTo(width, horizonY - 38);
        ctx.lineTo(width, horizonY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(144, 174, 173, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Mid-Distance Terracotta Canyon Mesas & Ridges
        ctx.fillStyle = '#874F41';
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(0, horizonY - 14);
        ctx.lineTo(width * 0.22, horizonY - 18);
        ctx.lineTo(width * 0.38, horizonY - 10);
        ctx.lineTo(roadCenterX - 10, horizonY - 2);
        ctx.lineTo(roadCenterX, horizonY);
        ctx.lineTo(roadCenterX + 10, horizonY - 2);
        ctx.lineTo(width * 0.62, horizonY - 12);
        ctx.lineTo(width * 0.78, horizonY - 20);
        ctx.lineTo(width, horizonY - 12);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(230, 72, 51, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. VAST OPEN DESERT CANYON EXPANSE
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0, '#874F41');
        groundGrad.addColorStop(0.35, '#6f3c30');
        groundGrad.addColorStop(0.7, '#582d23');
        groundGrad.addColorStop(1, '#441f17');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        // Geological Sand & Rock Contours across the open desert
        ctx.save();
        ctx.strokeStyle = 'rgba(230, 72, 51, 0.2)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, horizonY + 30);
        ctx.quadraticCurveTo(width * 0.2, horizonY + 50, roadCenterX - bottomW * 0.45, height);
        ctx.moveTo(width, horizonY + 40);
        ctx.quadraticCurveTo(width * 0.8, horizonY + 60, roadCenterX + bottomW * 0.45, height);
        ctx.stroke();
        ctx.restore();

        // 5. THE HIGHWAY: Joined Seamlessly to Horizon Vanishing Point!
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(roadCenterX, horizonY); // Starts at the exact horizon vanishing point!
        ctx.lineTo(roadCenterX + bottomW / 2, height);
        ctx.lineTo(roadCenterX - bottomW / 2, height);
        ctx.closePath();

        const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        roadGrad.addColorStop(0, '#2b3c46');
        roadGrad.addColorStop(0.3, '#24343d');
        roadGrad.addColorStop(0.7, '#1b272f');
        roadGrad.addColorStop(1, '#131d22');
        ctx.fillStyle = roadGrad;
        ctx.fill();

        // Warm Cream Painted Outer Edge Lines (#FBE9D0)
        ctx.strokeStyle = '#FBE9D0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(roadCenterX, horizonY);
        ctx.lineTo(roadCenterX - bottomW / 2, height);
        ctx.moveTo(roadCenterX, horizonY);
        ctx.lineTo(roadCenterX + bottomW / 2, height);
        ctx.stroke();

        // Dirt Shoulder Borders
        ctx.strokeStyle = 'rgba(230, 72, 51, 0.45)';
        ctx.lineWidth = 5.0;
        ctx.beginPath();
        ctx.moveTo(roadCenterX - 1, horizonY);
        ctx.lineTo(roadCenterX - bottomW / 2 - 16, height);
        ctx.moveTo(roadCenterX + 1, horizonY);
        ctx.lineTo(roadCenterX + bottomW / 2 + 16, height);
        ctx.stroke();

        // 3D Perspective Centerline: Speeds up dynamically with car speed!
        const stripeCount = 18;
        for (let s = 0; s < stripeCount; s++) {
          const z = ((s / stripeCount) + roadProgress) % 1.0;
          if (z < 0.015) continue;

          const segY = horizonY + Math.pow(z, 2.3) * (height - horizonY);
          const segLength = 4 + Math.pow(z, 2.0) * 55;
          const segWidth = 0.8 + z * 4.2;
          const segAlpha = Math.min(0.95, z * 1.3);

          ctx.fillStyle = `rgba(230, 72, 51, ${segAlpha})`;
          ctx.beginPath();
          ctx.roundRect(
            roadCenterX - segWidth / 2,
            segY,
            segWidth,
            segLength,
            segWidth / 2
          );
          ctx.fill();
        }

        // 6. ROADSIDE BOULDERS & MARKERS RUSHING PAST (True Sensation of Speed!)
        roadsideFeatures.forEach((feat) => {
          feat.z = (feat.z + 0.005 * speedRatio) % 1.0;
          if (feat.z < 0.03) return;

          const featY = horizonY + Math.pow(feat.z, 2.2) * (height - horizonY);
          const roadWAtY = Math.pow(feat.z, 2.2) * bottomW;
          const featScale = Math.pow(feat.z, 1.8) * feat.scale;
          const isLeft = feat.side === 'left';
          const featX = isLeft
            ? roadCenterX - roadWAtY / 2 - 14 - featScale * 25
            : roadCenterX + roadWAtY / 2 + 14 + featScale * 25;

          ctx.save();
          ctx.translate(featX, featY);

          if (feat.type === 'boulder') {
            // Canyon Sandstone Boulder (#874F41 with sunlit #E64833 facet)
            ctx.fillStyle = '#6e382c';
            ctx.beginPath();
            ctx.moveTo(-16 * featScale, 0);
            ctx.lineTo(-8 * featScale, -18 * featScale);
            ctx.lineTo(12 * featScale, -22 * featScale);
            ctx.lineTo(20 * featScale, 0);
            ctx.closePath();
            ctx.fill();

            // Sunlit facet
            ctx.fillStyle = '#E64833';
            ctx.beginPath();
            ctx.moveTo(-8 * featScale, -18 * featScale);
            ctx.lineTo(12 * featScale, -22 * featScale);
            ctx.lineTo(6 * featScale, -10 * featScale);
            ctx.closePath();
            ctx.fill();
          } else if (feat.type === 'milestone') {
            // White/Cream Highway Milestone Post with Red Reflector
            ctx.fillStyle = '#FBE9D0';
            ctx.fillRect(-3 * featScale, -24 * featScale, 6 * featScale, 24 * featScale);
            ctx.fillStyle = '#E64833';
            ctx.fillRect(-3 * featScale, -22 * featScale, 6 * featScale, 6 * featScale);
          } else {
            // Roadside Cat-Eye Reflector Post
            ctx.fillStyle = '#1c2830';
            ctx.fillRect(-2 * featScale, -20 * featScale, 4 * featScale, 20 * featScale);
            ctx.fillStyle = isLeft ? '#FBE9D0' : '#E64833';
            ctx.fillRect(-3 * featScale, -18 * featScale, 6 * featScale, 5 * featScale);
          }
          ctx.restore();
        });

        // Atmospheric Depth Haze at Horizon Vanishing Point
        const horizonHaze = ctx.createRadialGradient(
          roadCenterX,
          horizonY,
          1,
          roadCenterX,
          horizonY,
          65
        );
        horizonHaze.addColorStop(0, 'rgba(251, 233, 208, 0.85)');
        horizonHaze.addColorStop(0.35, 'rgba(230, 72, 51, 0.4)');
        horizonHaze.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = horizonHaze;
        ctx.beginPath();
        ctx.arc(roadCenterX, horizonY, 65, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // -------------------------------------------------------------
        // PERSPECTIVE 1: COCKPIT / DRIVER'S VIEW (Interactive Steering Wheel!)
        // -------------------------------------------------------------
        if (drivePerspective === 'cockpit') {
          const isMobile = width < 640;

          // Subtle road vibration scaling with speed
          const roadVibration = Math.sin(time * (currentSpeed * 0.12)) * 0.8;
          const cabinBob = Math.sin(time * 1.5) * 1.0 + roadVibration;
          const accelPitch = isAccelerating ? -2.5 : isBraking ? 3.0 : 0;

          // A. Long Sculpted GT Hood
          const hoodHalfW = isMobile ? width * 0.44 : 250;
          const hoodBottomW = isMobile ? width * 0.58 : 360;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(roadCenterX - hoodHalfW, height * 0.73 + cabinBob + accelPitch);
          ctx.lineTo(roadCenterX, height * 0.70 + cabinBob + accelPitch);
          ctx.lineTo(roadCenterX + hoodHalfW, height * 0.73 + cabinBob + accelPitch);
          ctx.lineTo(roadCenterX + hoodBottomW, height * 0.82 + cabinBob + accelPitch);
          ctx.lineTo(roadCenterX - hoodBottomW, height * 0.82 + cabinBob + accelPitch);
          ctx.closePath();

          const hoodGrad = ctx.createLinearGradient(0, height * 0.70, 0, height * 0.82);
          hoodGrad.addColorStop(0, '#1c2b33');
          hoodGrad.addColorStop(0.5, '#121d23');
          hoodGrad.addColorStop(1, '#0b1318');
          ctx.fillStyle = hoodGrad;
          ctx.fill();

          // Hood Power Domes
          ctx.strokeStyle = 'rgba(230, 72, 51, 0.3)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(roadCenterX - 75, height * 0.72 + cabinBob + accelPitch);
          ctx.lineTo(roadCenterX - 140, height * 0.82 + cabinBob + accelPitch);
          ctx.moveTo(roadCenterX + 75, height * 0.72 + cabinBob + accelPitch);
          ctx.lineTo(roadCenterX + 140, height * 0.82 + cabinBob + accelPitch);
          ctx.stroke();

          // Heat Extraction Vents
          ctx.fillStyle = '#080d11';
          ctx.fillRect(roadCenterX - 95, height * 0.75 + cabinBob + accelPitch, 30, 5);
          ctx.fillRect(roadCenterX + 65, height * 0.75 + cabinBob + accelPitch, 30, 5);

          // Chrome Mercedes-Benz Star Hood Ornament leading ahead
          drawMercedesStar(roadCenterX, height * 0.705 + cabinBob + accelPitch, 6.5);
          ctx.restore();

          // B. Windshield Frame & A-Pillars
          ctx.fillStyle = '#111920';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(width * 0.13, 0);
          ctx.lineTo(width * 0.07, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(width, 0);
          ctx.lineTo(width * 0.87, 0);
          ctx.lineTo(width * 0.93, height);
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();

          // Top Windshield Blue-Cyan Anti-Glare Sun Tint
          const topTint = ctx.createLinearGradient(0, 0, 0, height * 0.14);
          topTint.addColorStop(0, 'rgba(17, 30, 38, 0.85)');
          topTint.addColorStop(0.6, 'rgba(36, 72, 85, 0.35)');
          topTint.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = topTint;
          ctx.fillRect(0, 0, width, height * 0.14);

          // Parked Windshield Wipers at Base of Windshield Glass
          ctx.save();
          ctx.strokeStyle = '#0e171e';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(width * 0.18, height * 0.77 + cabinBob);
          ctx.lineTo(width * 0.44, height * 0.75 + cabinBob);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(width * 0.52, height * 0.77 + cabinBob);
          ctx.lineTo(width * 0.82, height * 0.76 + cabinBob);
          ctx.stroke();
          ctx.restore();

          // Rearview Mirror with Frameless Bezel, Sunset Horizon Reflection & Green Sensor LED
          ctx.save();
          const mirrorW = isMobile ? 130 : 190;
          const mirrorH = isMobile ? 34 : 44;
          const mirrorX = roadCenterX - mirrorW / 2;
          const mirrorY = 16;

          // Dual Mounting Stems to windshield roof
          ctx.fillStyle = '#0a1014';
          ctx.fillRect(roadCenterX - 14, 0, 28, 18);

          // Outer Casing & Shadow
          ctx.beginPath();
          ctx.roundRect(mirrorX, mirrorY, mirrorW, mirrorH, 10);
          ctx.fillStyle = '#111920';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Mirror Glass (Auto-dimming green-blue tint with sunset road reflection)
          const glassW = mirrorW - 10;
          const glassH = mirrorH - 8;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(mirrorX + 5, mirrorY + 4, glassW, glassH, 7);
          ctx.clip();

          // Reflected Sky & Horizon
          const refSky = ctx.createLinearGradient(0, mirrorY + 4, 0, mirrorY + glassH);
          refSky.addColorStop(0, '#1c3b47');
          refSky.addColorStop(0.5, '#E64833');
          refSky.addColorStop(0.7, '#FBE9D0');
          refSky.addColorStop(0.72, '#2b3c46');
          refSky.addColorStop(1, '#111a20');
          ctx.fillStyle = refSky;
          ctx.fillRect(mirrorX + 5, mirrorY + 4, glassW, glassH);

          // Reflected Road Lines receding into distance
          ctx.strokeStyle = 'rgba(230, 72, 51, 0.8)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(roadCenterX, mirrorY + glassH * 0.72);
          ctx.lineTo(roadCenterX, mirrorY + glassH);
          ctx.stroke();
          ctx.restore();

          // Green Auto-Dimming Sensor LED on mirror bottom
          ctx.beginPath();
          ctx.arc(roadCenterX, mirrorY + mirrorH - 2, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#22c55e';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();

          // C. Dashboard Cowl (Sculpted Multi-Tone Saddle Tan Leather & Carbon Fiber)
          const dashY = height * 0.77 + cabinBob;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, height);
          ctx.lineTo(0, dashY + 30);
          ctx.quadraticCurveTo(width * 0.28, dashY - 16, width * 0.5, dashY + 6);
          ctx.quadraticCurveTo(width * 0.72, dashY + 18, width, dashY + 12);
          ctx.lineTo(width, height);
          ctx.closePath();

          const dashGrad = ctx.createLinearGradient(0, dashY - 20, 0, height);
          dashGrad.addColorStop(0, '#5a3127');   // Saddle Tan Highlight
          dashGrad.addColorStop(0.25, '#3d1f18'); // Rich Terracotta Brown
          dashGrad.addColorStop(0.6, '#24120e');  // Dark Leather
          dashGrad.addColorStop(1, '#0f0705');    // Footwell shadow
          ctx.fillStyle = dashGrad;
          ctx.fill();

          // Brushed Aluminum / Titanium Inlay Trim Strip
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(width * 0.08, dashY + 36);
          ctx.quadraticCurveTo(width * 0.28, dashY - 6, width * 0.5, dashY + 16);
          ctx.quadraticCurveTo(width * 0.72, dashY + 26, width * 0.94, dashY + 20);
          ctx.stroke();

          // Precision Double Stitching Line (#FBE9D0 Cream)
          ctx.strokeStyle = 'rgba(251, 233, 208, 0.55)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(width * 0.08, dashY + 32);
          ctx.quadraticCurveTo(width * 0.28, dashY - 10, width * 0.5, dashY + 12);
          ctx.quadraticCurveTo(width * 0.72, dashY + 22, width * 0.94, dashY + 16);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ambient LED Ribbon (Reacting to Audio Energy!)
          const ambientPulse = 0.65 + curAudio * 0.35;
          ctx.shadowBlur = 14;
          ctx.shadowColor = `rgba(230, 72, 51, ${ambientPulse * 0.9})`;
          ctx.strokeStyle = `rgba(230, 72, 51, ${ambientPulse})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(width * 0.08, dashY + 28);
          ctx.quadraticCurveTo(width * 0.28, dashY - 14, width * 0.5, dashY + 8);
          ctx.quadraticCurveTo(width * 0.72, dashY + 18, width * 0.94, dashY + 12);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Mercedes AMG Turbine Air Vents on Dashboard
          const ventRadius = isMobile ? 15 : 22;
          if (!isMobile) {
            drawTurbineVent(width * 0.14, dashY + 44, ventRadius, curAudio);
            drawTurbineVent(width * 0.64, dashY + 40, ventRadius, curAudio);
            drawTurbineVent(width * 0.74, dashY + 44, ventRadius, curAudio);
            drawTurbineVent(width * 0.88, dashY + 38, ventRadius, curAudio);
          } else {
            drawTurbineVent(width * 0.12, dashY + 38, ventRadius, curAudio);
            drawTurbineVent(width * 0.88, dashY + 38, ventRadius, curAudio);
          }

          // D. Digital Instrument Cluster (AMG Digital Cockpit Display)
          const clusterX = isMobile ? width * 0.5 : Math.max(160, width * 0.28);
          const clusterY = isMobile ? dashY - 18 : dashY - 10;
          const clusterW = isMobile ? Math.min(width * 0.90, 240) : 260;
          const clusterH = isMobile ? 66 : 74;

          ctx.save();
          ctx.translate(clusterX - clusterW / 2, clusterY);
          
          // Cluster Bezel & Frame
          ctx.fillStyle = '#0a1016';
          ctx.beginPath();
          ctx.roundRect(-8, -12, clusterW + 16, clusterH + 18, 14);
          ctx.fill();
          ctx.strokeStyle = 'rgba(251, 233, 208, 0.3)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Display Glass
          const screenGrad = ctx.createLinearGradient(0, -6, 0, clusterH);
          screenGrad.addColorStop(0, '#0c141a');
          screenGrad.addColorStop(1, '#060a0d');
          ctx.fillStyle = screenGrad;
          ctx.beginPath();
          ctx.roundRect(0, -6, clusterW, clusterH, 8);
          ctx.fill();

          // 1. SPEEDOMETER (Left Dial)
          const speedDialX = 36;
          const speedDialY = clusterH * 0.48;
          const dialRadius = isMobile ? 22 : 26;

          // Dial background track
          ctx.beginPath();
          ctx.arc(speedDialX, speedDialY, dialRadius, Math.PI * 0.75, Math.PI * 2.25);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Active speed arc (illuminates dynamically!)
          const speedRatioClamped = Math.min(1.0, currentSpeed / 180);
          const speedEndAngle = Math.PI * 0.75 + speedRatioClamped * (Math.PI * 1.5);
          ctx.beginPath();
          ctx.arc(speedDialX, speedDialY, dialRadius, Math.PI * 0.75, speedEndAngle);
          ctx.strokeStyle = '#FBE9D0';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Speed Digital Text
          ctx.fillStyle = '#FBE9D0';
          ctx.font = isMobile ? 'bold 16px monospace' : 'bold 19px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(currentSpeed)}`, speedDialX, speedDialY + (isMobile ? 5 : 6));
          ctx.font = '7px sans-serif';
          ctx.fillStyle = 'rgba(251, 233, 208, 0.7)';
          ctx.fillText('KM/H', speedDialX, speedDialY + (isMobile ? 14 : 16));

          // 2. TACHOMETER (Right Dial)
          const tachDialX = clusterW - 36;
          const tachDialY = clusterH * 0.48;
          const rpm = Math.round(1400 + (currentSpeed / 150) * 3600 + (isAccelerating ? 800 : 0) + curAudio * 300);
          const rpmRatioClamped = Math.min(1.0, rpm / 8000);
          const rpmEndAngle = Math.PI * 0.75 + rpmRatioClamped * (Math.PI * 1.5);

          // Tach track
          ctx.beginPath();
          ctx.arc(tachDialX, tachDialY, dialRadius, Math.PI * 0.75, Math.PI * 2.25);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Active RPM arc (turns red at high revs!)
          ctx.beginPath();
          ctx.arc(tachDialX, tachDialY, dialRadius, Math.PI * 0.75, rpmEndAngle);
          ctx.strokeStyle = rpm > 4400 ? '#ef4444' : '#E64833';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // RPM Digital Text
          ctx.fillStyle = rpm > 4400 ? '#ef4444' : '#E64833';
          ctx.font = isMobile ? 'bold 14px monospace' : 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${rpm}`, tachDialX, tachDialY + (isMobile ? 5 : 6));
          ctx.font = '7px sans-serif';
          ctx.fillStyle = 'rgba(230, 72, 51, 0.75)';
          ctx.fillText('RPM', tachDialX, tachDialY + (isMobile ? 14 : 16));

          // 3. CENTER DIGITAL TRIP COMPUTER
          const centerX = clusterW / 2;
          ctx.textAlign = 'center';

          // Top status pill (Drive mode & Gear)
          const currentGear = Math.min(7, Math.max(1, Math.floor(currentSpeed / 20) + 1));
          ctx.fillStyle = isAccelerating ? '#22c55e' : isBraking ? '#ef4444' : '#90AEAD';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText(isAccelerating ? 'SPORT ACCEL' : isBraking ? 'BRAKE ACTIVE' : 'SPORT+ MODE', centerX, 13);

          // Gear indicator & Compass
          ctx.fillStyle = '#FBE9D0';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`GEAR D${currentGear} • SW 214°`, centerX, 26);

          // Trip Distance Display (User Request: "show distance moved")
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`TRIP ${totalDistanceKm.toFixed(2)} KM`, centerX, 40);

          // Dynamic Cruise / System status
          ctx.fillStyle = 'rgba(251, 233, 208, 0.65)';
          ctx.font = '7.5px sans-serif';
          ctx.fillText('DYNAMIC CRUISE • 24°C', centerX, 52);

          ctx.restore();

          // E. INTERACTIVE AMG PERFORMANCE STEERING WHEEL
          const wheelX = clusterX;
          const wheelY = isMobile ? height * 0.91 + cabinBob : height * 0.88 + cabinBob;
          const wheelR = isMobile ? Math.min(width * 0.22, 84) : 110;

          // Turn Signal Stalk behind wheel (left side)
          ctx.save();
          ctx.translate(wheelX, wheelY);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-wheelR - 22, -18, 26, 8);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(-wheelR - 22, -18, 26, 8);
          ctx.restore();

          ctx.save();
          ctx.translate(wheelX, wheelY);
          
          // Physical steering rotation!
          ctx.rotate(currentSteer * 0.55); // Rotates smoothly!

          // Dual Brushed Aluminum Paddle Shifters behind wheel
          const paddleH = wheelR * 0.52;
          const paddleW = 12;
          // Left Paddle (-) Downshift
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.roundRect(-wheelR - 6, -paddleH * 0.6, paddleW, paddleH, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('-', -wheelR + 1, -paddleH * 0.1);

          // Right Paddle (+) Upshift
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.roundRect(wheelR - paddleW + 6, -paddleH * 0.6, paddleW, paddleH, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('+', wheelR + 1, -paddleH * 0.1);

          // Steering Wheel Outer Rim (Saddle Leather #3e1b12 with Flat-Bottom Sport Shape)
          ctx.beginPath();
          ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
          ctx.lineWidth = isMobile ? 18 : 24;
          ctx.strokeStyle = '#3e1b12';
          ctx.stroke();

          // Perforated Grip Inlays at 9 and 3 o'clock
          ctx.beginPath();
          ctx.arc(0, 0, wheelR, Math.PI * 0.78, Math.PI * 1.22);
          ctx.lineWidth = isMobile ? 19 : 25;
          ctx.strokeStyle = '#220e0a';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, wheelR, -Math.PI * 0.22, Math.PI * 0.22);
          ctx.lineWidth = isMobile ? 19 : 25;
          ctx.strokeStyle = '#220e0a';
          ctx.stroke();

          // 10-and-2 Ergonomic Thumb Rest Contours
          ctx.fillStyle = '#2d140d';
          ctx.beginPath();
          ctx.ellipse(-wheelR * 0.68, -wheelR * 0.72, 10, 6, -0.7, 0, Math.PI * 2);
          ctx.ellipse(wheelR * 0.68, -wheelR * 0.72, 10, 6, 0.7, 0, Math.PI * 2);
          ctx.fill();

          // Inner Chrome Rim Ring
          ctx.beginPath();
          ctx.arc(0, 0, wheelR - (isMobile ? 9 : 12), 0, Math.PI * 2);
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.3)';
          ctx.stroke();

          // 3 Brushed Satin Chrome Spokes
          const spokeGrad = ctx.createLinearGradient(-wheelR, -10, wheelR, 10);
          spokeGrad.addColorStop(0, '#cbd5e1');
          spokeGrad.addColorStop(0.5, '#f1f5f9');
          spokeGrad.addColorStop(1, '#94a3b8');
          ctx.fillStyle = spokeGrad;

          // Left Horizontal Spoke with Touch Controls
          ctx.fillRect(-wheelR + 10, -9, wheelR * 0.58, isMobile ? 18 : 22);
          // Right Horizontal Spoke with Touch Controls
          ctx.fillRect(wheelR * 0.32, -9, wheelR * 0.58, isMobile ? 18 : 22);
          // Lower Vertical Spoke
          ctx.fillRect(-11, wheelR * 0.28, 22, wheelR * 0.62);

          // Multi-function Touch Button Pads on Spokes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-wheelR + 18, -6, 20, 12);
          ctx.fillRect(wheelR - 38, -6, 20, 12);

          // Button Icons
          ctx.fillStyle = '#94a3b8';
          ctx.font = '7px sans-serif';
          ctx.fillText('SET', -wheelR + 21, 3);
          ctx.fillText('VOL', wheelR - 35, 3);

          // Lower Spoke AMG Silver Badge
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-9, wheelR * 0.55, 18, 8);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 5.5px sans-serif';
          ctx.fillText('AMG', -6, wheelR * 0.55 + 6);

          // Center Hub (Airbag Boss & Mercedes Chrome Star)
          const hubR = isMobile ? 32 : 40;
          ctx.beginPath();
          ctx.arc(0, 0, hubR, 0, Math.PI * 2);
          ctx.fillStyle = '#220e0a';
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Outer hub stitching
          ctx.beginPath();
          ctx.arc(0, 0, hubR - 4, 0, Math.PI * 2);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = 'rgba(251, 233, 208, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);

          // 3D Mercedes-Benz Chrome Star in center of rotating wheel
          drawMercedesStar(0, 0, isMobile ? 15 : 19);

          ctx.restore();
          ctx.restore();

        } else {
          // -------------------------------------------------------------
          // PERSPECTIVE 2: THIRD-PERSON CHASE VIEW (Fastback GT with Dynamic Drift)
          // -------------------------------------------------------------
          const carY = height * 0.74 + Math.sin(time * 1.5) * 1.0;
          const carX = width * 0.5 + carLaneOffset * 0.5;

          // Dust Drift Plume (Expands at higher speed!)
          ctx.save();
          const dustSize = 1 + (currentSpeed / 75) * 0.4;
          ctx.fillStyle = 'rgba(230, 72, 51, 0.25)';
          ctx.beginPath();
          ctx.ellipse(carX - 52, carY + 14, 34 * dustSize, 10 * dustSize, -0.15, 0, Math.PI * 2);
          ctx.ellipse(carX + 52, carY + 14, 34 * dustSize, 10 * dustSize, 0.15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(251, 233, 208, 0.2)';
          ctx.beginPath();
          ctx.ellipse(carX - 44, carY + 18, 26 * dustSize, 8 * dustSize, -0.1, 0, Math.PI * 2);
          ctx.ellipse(carX + 44, carY + 18, 26 * dustSize, 8 * dustSize, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Headlight Beams illuminating the canyon road ahead
          ctx.save();
          const lightGlow = 0.25 + curAudio * 0.2;
          const beamGrad = ctx.createRadialGradient(
            carX,
            carY - 15,
            12,
            carX,
            carY - 160,
            220
          );
          beamGrad.addColorStop(0, `rgba(251, 233, 208, ${lightGlow})`);
          beamGrad.addColorStop(0.5, `rgba(230, 72, 51, ${lightGlow * 0.4})`);
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(carX - 28, carY - 12);
          ctx.lineTo(carX - 110, horizonY + 20);
          ctx.lineTo(carX + 110, horizonY + 20);
          ctx.lineTo(carX + 28, carY - 12);
          ctx.closePath();
          ctx.fillStyle = beamGrad;
          ctx.fill();
          ctx.restore();

          // The Fastback GT Coupe (Body leans into turns with currentSteer!)
          ctx.save();
          ctx.translate(carX, carY);
          ctx.rotate(currentSteer * 0.04); // Dynamic body banking!

          // Ground Contact Shadow
          ctx.beginPath();
          ctx.ellipse(0, 24, 58, 14, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(8, 12, 16, 0.95)';
          ctx.fill();

          // Performance Tires
          ctx.fillStyle = '#080c10';
          ctx.beginPath();
          ctx.roundRect(-55, 2, 22, 22, 5);
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(33, 2, 22, 22, 5);
          ctx.fill();

          // Gold/Chrome Wheel Rim Lips & Calipers
          ctx.strokeStyle = '#FBE9D0';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(-54, 4, 6, 18);
          ctx.strokeRect(48, 4, 6, 18);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-51, 9, 3, 8);
          ctx.fillRect(48, 9, 3, 8);

          // Lower Diffuser & Quad Chrome Exhausts
          ctx.fillStyle = '#0a1016';
          ctx.beginPath();
          ctx.roundRect(-46, 8, 92, 14, 4);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-16, 8); ctx.lineTo(-16, 22);
          ctx.moveTo(16, 8); ctx.lineTo(16, 22);
          ctx.stroke();

          // Quad Exhaust Pipes
          const exhaustGlow = (currentSpeed / 150) * 0.6 + curAudio * 0.4;
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.fillStyle = `rgba(230, 72, 51, ${0.4 + exhaustGlow})`;
          ctx.beginPath();
          ctx.arc(-34, 15, 4.5, 0, Math.PI * 2);
          ctx.arc(-24, 15, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(24, 15, 4.5, 0, Math.PI * 2);
          ctx.arc(34, 15, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Muscular Body Haunches
          const bodyGrad = ctx.createLinearGradient(0, -18, 0, 10);
          bodyGrad.addColorStop(0, '#223844');
          bodyGrad.addColorStop(0.5, '#16252e');
          bodyGrad.addColorStop(1, '#0e181e');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.roundRect(-50, -16, 100, 32, 9);
          ctx.fill();

          ctx.strokeStyle = 'rgba(251, 233, 208, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-48, -10);
          ctx.quadraticCurveTo(-38, -14, -26, -14);
          ctx.moveTo(48, -10);
          ctx.quadraticCurveTo(38, -14, 26, -14);
          ctx.stroke();

          // Chrome Bumper Bar
          const bumperGrad = ctx.createLinearGradient(0, 2, 0, 8);
          bumperGrad.addColorStop(0, '#f8fafc');
          bumperGrad.addColorStop(0.5, '#cbd5e1');
          bumperGrad.addColorStop(1, '#64748b');
          ctx.fillStyle = bumperGrad;
          ctx.beginPath();
          ctx.roundRect(-48, 2, 96, 5, 2.5);
          ctx.fill();

          // Sloping Fastback Rear Window
          ctx.fillStyle = '#0d161d';
          ctx.beginPath();
          ctx.roundRect(-34, -36, 68, 25, 7);
          ctx.fill();

          const glassGrad = ctx.createLinearGradient(0, -34, 0, -14);
          glassGrad.addColorStop(0, 'rgba(144, 174, 173, 0.5)');
          glassGrad.addColorStop(0.6, 'rgba(251, 233, 208, 0.35)');
          glassGrad.addColorStop(1, 'rgba(230, 72, 51, 0.3)');
          ctx.fillStyle = glassGrad;
          ctx.beginPath();
          ctx.moveTo(-30, -14);
          ctx.lineTo(-22, -33);
          ctx.lineTo(22, -33);
          ctx.lineTo(30, -14);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-24, -27); ctx.lineTo(24, -27);
          ctx.moveTo(-26, -21); ctx.lineTo(26, -21);
          ctx.stroke();

          // Ducktail Spoiler Lip
          ctx.fillStyle = '#1c303b';
          ctx.beginPath();
          ctx.moveTo(-34, -14);
          ctx.lineTo(34, -14);
          ctx.lineTo(32, -11);
          ctx.lineTo(-32, -11);
          ctx.closePath();
          ctx.fill();

          // Recessed Fascia Panel & Triple Vertical Ruby Taillights
          ctx.fillStyle = '#060a0e';
          ctx.beginPath();
          ctx.roundRect(-42, -9, 84, 11, 3);
          ctx.fill();

          const tailBloom = 12 + curAudio * 15;
          ctx.shadowBlur = tailBloom;
          ctx.shadowColor = 'rgba(230, 72, 51, 0.95)';
          ctx.fillStyle = '#ff2222';

          for (let b = 0; b < 3; b++) {
            ctx.fillRect(-38 + b * 6, -8, 4, 9);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-37 + b * 6, -6, 2, 5);
            ctx.fillStyle = '#ff2222';
          }

          for (let b = 0; b < 3; b++) {
            ctx.fillRect(23 + b * 6, -8, 4, 9);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(24 + b * 6, -6, 2, 5);
            ctx.fillStyle = '#ff2222';
          }
          ctx.shadowBlur = 0;

          drawMercedesStar(0, -3.5, 6.5);

          ctx.fillStyle = '#080d12';
          ctx.fillRect(-12, 3.5, 24, 7);
          ctx.fillStyle = '#FBE9D0';
          ctx.font = 'bold 5px monospace';
          ctx.fillText('SCENIC GT', -11, 8.5);

          ctx.restore();
        }
      } else {
        // OTHER MODES (Rose, Night, Rain, Focus)
        const bgGradient = ctx.createLinearGradient(0, 0, width * 0.8, height);
        bgGradient.addColorStop(0, config.gradient.from);
        bgGradient.addColorStop(0.5, config.gradient.via);
        bgGradient.addColorStop(1, config.gradient.to);

        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        const auraGradient = ctx.createRadialGradient(
          width * 0.5 + Math.sin(time * 0.2) * (width * 0.08),
          height * 0.4,
          40,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.65
        );

        const glowEnergy = 1 + curAudio * 0.4;
        if (mood === 'rose') {
          auraGradient.addColorStop(0, `rgba(244, 63, 94, ${0.08 * glowEnergy})`);
          auraGradient.addColorStop(0.5, `rgba(190, 24, 93, ${0.04 * glowEnergy})`);
          auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (mood === 'night') {
          auraGradient.addColorStop(0, `rgba(99, 102, 241, ${0.08 * glowEnergy})`);
          auraGradient.addColorStop(0.5, `rgba(79, 70, 229, ${0.03 * glowEnergy})`);
          auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (mood === 'rain') {
          auraGradient.addColorStop(0, `rgba(56, 189, 248, ${0.09 * glowEnergy})`);
          auraGradient.addColorStop(0.5, `rgba(14, 116, 144, ${0.04 * glowEnergy})`);
          auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          auraGradient.addColorStop(0, `rgba(52, 211, 153, ${0.07 * glowEnergy})`);
          auraGradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.03 * glowEnergy})`);
          auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = auraGradient;
        ctx.fillRect(0, 0, width, height);
      }

      if (prefersReducedMotion) {
        return;
      }

      // 7. RENDER PARTICLES
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const smoothPulse = Math.sin(time * 0.4 + i) * 0.08;
        const currentAlpha = Math.max(
          0.05,
          Math.min(0.8, p.baseAlpha + smoothPulse + curAudio * 0.15)
        );

        if (mood === 'rain') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + (p.length || 15));
          ctx.strokeStyle = `rgba(186, 230, 253, ${currentAlpha * 0.75})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.stroke();

          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
        } else if (mood === 'night') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 231, 255, ${currentAlpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(199, 210, 254, 0.4)';
          ctx.fill();
          ctx.shadowBlur = 0;

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        } else if (mood === 'rose') {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
          }
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 113, 133, ${currentAlpha})`;
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(244, 63, 94, 0.4)';
          ctx.fill();
          ctx.restore();

          p.x += p.vx;
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
        } else if (mood === 'drive') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 233, 208, ${currentAlpha})`;
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(230, 72, 51, 0.4)';
          ctx.fill();
          ctx.shadowBlur = 0;

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 243, 208, ${currentAlpha})`;
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(52, 211, 153, 0.35)';
          ctx.fill();
          ctx.shadowBlur = 0;

          p.x += p.vx;
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [mood, config, drivePerspective]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-1000 ease-in-out"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Interactive Driving HUD Controls Hint (When in Scenic Drive mode) */}
      {mood === 'drive' && (
        <>
          {/* Desktop HUD Pill */}
          <div className="fixed top-20 right-4 z-30 pointer-events-auto hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl glass-panel text-slate-300 text-xs border border-white/10 shadow-lg animate-in fade-in duration-500">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{hudSpeed} KM/H</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
              <span className="text-slate-400 text-[10px] font-normal">TRIP</span>
              <span>{hudDistance.toFixed(2)} KM</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">W / S</span>
              <span>Speed</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono ml-1">A / D</span>
              <span>Steer</span>
            </div>
          </div>

          {/* Mobile On-Screen Touch Driving Controls & Speed Badge */}
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 sm:hidden flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-amber-300">{hudSpeed} KM/H</span>
            <span className="text-white/25">|</span>
            <span className="font-mono text-xs text-emerald-400 font-semibold">{hudDistance.toFixed(2)} KM</span>
            <span className="text-white/25">|</span>
            <span className="text-[10px] text-slate-300 uppercase font-mono">AMG GT</span>
          </div>

          {/* Mobile Touch Steering (Bottom Left - Above Player Bar) */}
          <div className="fixed bottom-20 left-3 z-30 sm:hidden flex items-center gap-2 pointer-events-auto select-none">
            <button
              onTouchStart={() => { touchControlsRef.current.steerLeft = true; }}
              onTouchEnd={() => { touchControlsRef.current.steerLeft = false; }}
              onMouseDown={() => { touchControlsRef.current.steerLeft = true; }}
              onMouseUp={() => { touchControlsRef.current.steerLeft = false; }}
              className="w-11 h-11 rounded-2xl bg-black/70 active:bg-emerald-500/35 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center text-white text-base font-bold transition-all active:scale-90"
              aria-label="Steer Left"
            >
              ◀
            </button>
            <button
              onTouchStart={() => { touchControlsRef.current.steerRight = true; }}
              onTouchEnd={() => { touchControlsRef.current.steerRight = false; }}
              onMouseDown={() => { touchControlsRef.current.steerRight = true; }}
              onMouseUp={() => { touchControlsRef.current.steerRight = false; }}
              className="w-11 h-11 rounded-2xl bg-black/70 active:bg-emerald-500/35 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center text-white text-base font-bold transition-all active:scale-90"
              aria-label="Steer Right"
            >
              ▶
            </button>
          </div>

          {/* Mobile Touch Pedals: Brake & Gas (Bottom Right - Above Player Bar) */}
          <div className="fixed bottom-20 right-3 z-30 sm:hidden flex items-center gap-2 pointer-events-auto select-none">
            <button
              onTouchStart={() => { touchControlsRef.current.brake = true; }}
              onTouchEnd={() => { touchControlsRef.current.brake = false; }}
              onMouseDown={() => { touchControlsRef.current.brake = true; }}
              onMouseUp={() => { touchControlsRef.current.brake = false; }}
              className="w-11 h-11 rounded-2xl bg-black/70 active:bg-rose-500/35 backdrop-blur-xl border border-rose-500/35 shadow-xl flex items-center justify-center text-rose-400 text-[11px] font-mono font-bold transition-all active:scale-90"
              aria-label="Brake"
            >
              STOP
            </button>
            <button
              onTouchStart={() => { touchControlsRef.current.accelerate = true; }}
              onTouchEnd={() => { touchControlsRef.current.accelerate = false; }}
              onMouseDown={() => { touchControlsRef.current.accelerate = true; }}
              onMouseUp={() => { touchControlsRef.current.accelerate = false; }}
              className="w-11 h-11 rounded-2xl bg-black/70 active:bg-emerald-500/35 backdrop-blur-xl border border-emerald-500/35 shadow-xl flex items-center justify-center text-emerald-400 text-[11px] font-mono font-bold transition-all active:scale-90"
              aria-label="Gas / Accelerate"
            >
              GAS
            </button>
          </div>
        </>
      )}
    </>
  );
}