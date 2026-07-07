import React, { useEffect, useRef } from 'react';

const ThreeDEventBackground = ({ interactive = true }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse settings
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      clicked: false,
      clickX: 0,
      clickY: 0
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleClick = (e) => {
      mouse.clicked = true;
      mouse.clickX = e.clientX;
      mouse.clickY = e.clientY;
      spawnConfetti(e.clientX, e.clientY);
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
    }
    window.addEventListener('resize', handleResize);

    // Spotlight definition for concert vibe
    const spotlights = [
      {
        x: 0,
        y: 0,
        angle: 0.5,
        targetAngle: 0.5,
        color: 'rgba(248, 68, 100, 0.06)', // BookMyShow Rose Red
        beamWidth: 0.25,
        speed: 0.005
      },
      {
        x: width,
        y: 0,
        angle: 2.6,
        targetAngle: 2.6,
        color: 'rgba(59, 130, 246, 0.06)', // Indigo/Blue
        beamWidth: 0.22,
        speed: 0.004
      },
      {
        x: width / 2,
        y: 0,
        angle: 1.5,
        targetAngle: 1.5,
        color: 'rgba(236, 72, 153, 0.06)', // Pink/Magenta
        beamWidth: 0.3,
        speed: 0.006
      }
    ];

    // Floating Event Items (Music Notes, Tickets, Sparkles, Diamonds, Glows)
    const colors = [
      'rgba(248, 68, 100, ',  // BookMyShow Rose Red
      'rgba(59, 130, 246, ',  // Blue
      'rgba(236, 72, 153, ',  // Pink/Magenta
      'rgba(168, 85, 247, '   // Purple
    ];
    const particles = [];
    const particleCount = 28; // Optimized count for high-fps rendering
    const perspective = 300;
    const particleTypes = ['circle', 'glow', 'ticket', 'sparkle', 'diamond', 'note'];

    class EventElement {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width - width / 2;
        this.y = Math.random() * height - height / 2;
        this.z = init ? Math.random() * 800 : 800;
        this.type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        this.scaleSize = Math.random() * 12 + 8; // Size scale
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.35 + 0.15;
        this.speedZ = -(Math.random() * 1.0 + 0.3);
        this.angle = Math.random() * Math.PI * 2;
        this.spin = Math.random() * 0.015 - 0.0075;
      }

      update() {
        this.z += this.speedZ;
        this.angle += this.spin;
        if (this.z <= 0) {
          this.reset(false);
        }
      }

      draw() {
        const scale = perspective / (perspective + this.z);
        // Parallax offset
        const pX = (mouse.x - width / 2) * 0.05 * (1 - scale);
        const pY = (mouse.y - height / 2) * 0.05 * (1 - scale);

        const xProj = this.x * scale + width / 2 + pX;
        const yProj = this.y * scale + height / 2 + pY;
        const sizeProj = this.scaleSize * scale;

        if (xProj < -50 || xProj > width + 50 || yProj < -50 || yProj > height + 50) return;

        const currentOpacity = this.opacity * (1 - this.z / 800);

        ctx.save();
        ctx.translate(xProj, yProj);
        ctx.rotate(this.angle);

        // Render type-based vector path (Fast & Hardware Accelerated)
        if (this.type === 'note') {
          ctx.fillStyle = this.color + currentOpacity + ')';
          
          // Head (ellipse/circle)
          ctx.beginPath();
          ctx.arc(-sizeProj * 0.3, sizeProj * 0.3, sizeProj * 0.35, 0, Math.PI * 2);
          ctx.fill();
          
          // Stem (line up)
          ctx.beginPath();
          ctx.rect(0, -sizeProj * 1.0, sizeProj * 0.18, sizeProj * 1.3);
          ctx.fill();
          
          // Flag (bezier path to right)
          ctx.beginPath();
          ctx.moveTo(sizeProj * 0.18, -sizeProj * 1.0);
          ctx.bezierCurveTo(sizeProj * 0.5, -sizeProj * 1.0, sizeProj * 0.8, -sizeProj * 0.5, sizeProj * 0.8, -sizeProj * 0.1);
          ctx.lineTo(sizeProj * 0.8, -sizeProj * 0.3);
          ctx.bezierCurveTo(sizeProj * 0.8, -sizeProj * 0.7, sizeProj * 0.5, -sizeProj * 1.2, sizeProj * 0.18, -sizeProj * 1.2);
          ctx.closePath();
          ctx.fill();
        } else if (this.type === 'ticket') {
          ctx.strokeStyle = this.color + currentOpacity + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.rect(-sizeProj * 1.2, -sizeProj * 0.8, sizeProj * 2.4, sizeProj * 1.6);
          ctx.stroke();

          // Inside ticket text stub line
          ctx.strokeStyle = this.color + (currentOpacity * 0.4) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-sizeProj * 0.6, 0);
          ctx.lineTo(sizeProj * 0.6, 0);
          ctx.stroke();
        } else if (this.type === 'sparkle') {
          ctx.strokeStyle = this.color + currentOpacity + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-sizeProj * 1.5, 0);
          ctx.lineTo(sizeProj * 1.5, 0);
          ctx.moveTo(0, -sizeProj * 1.5);
          ctx.lineTo(0, sizeProj * 1.5);
          ctx.stroke();
        } else if (this.type === 'diamond') {
          ctx.fillStyle = this.color + (currentOpacity * 0.8) + ')';
          ctx.beginPath();
          ctx.moveTo(0, -sizeProj);
          ctx.lineTo(sizeProj, 0);
          ctx.moveTo(sizeProj, 0);
          ctx.lineTo(0, sizeProj);
          ctx.lineTo(-sizeProj, 0);
          ctx.closePath();
          ctx.fill();
        } else if (this.type === 'glow') {
          const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sizeProj * 3);
          glowGrad.addColorStop(0, this.color + currentOpacity + ')');
          glowGrad.addColorStop(1, this.color + '0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, sizeProj * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Glow Circle
          ctx.fillStyle = this.color + currentOpacity + ')';
          ctx.beginPath();
          ctx.arc(0, 0, sizeProj, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Confetti ripple system on clicks
    const confettiColors = ['#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444'];
    let confettis = [];

    function spawnConfetti(cx, cy) {
      for (let i = 0; i < 30; i++) {
        confettis.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.7) * 10 - 2,
          size: Math.random() * 6 + 4,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
          gravity: 0.25
        });
      }
    }

    // Initialize floating items
    for (let i = 0; i < particleCount; i++) {
      particles.push(new EventElement());
    }

    const isLightMode = () => document.documentElement.classList.contains('light');

    const animate = () => {
      // 1. Draw backdrop gradient based on theme
      if (isLightMode()) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#cbd5e1');
        gradient.addColorStop(0.5, '#e2e8f0');
        gradient.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0c0714'); // Very dark violet top
        gradient.addColorStop(0.5, '#06050b'); // Dark deep blue center
        gradient.addColorStop(1, '#020204'); // Pitch black bottom
        ctx.fillStyle = gradient;
      }
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse coordination (or automatic slow floating when not interactive)
      if (!interactive) {
        mouse.targetX = width / 2 + Math.sin(Date.now() * 0.0004) * 160;
        mouse.targetY = height / 2 + Math.cos(Date.now() * 0.0003) * 100;
      }

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // 2. Render moving Concert Spotlight beams
      spotlights.forEach((beam, index) => {
        // Swing beams slightly left and right
        const swing = Math.sin(Date.now() * beam.speed) * 0.35;
        // Make the third center beam track the mouse cursor
        if (index === 2) {
          const dx = mouse.x - beam.x;
          const dy = mouse.y - beam.y;
          beam.targetAngle = Math.atan2(dy, dx);
          // Interpolate angle
          beam.angle += (beam.targetAngle - beam.angle) * 0.08;
        } else {
          beam.angle = beam.targetAngle + swing;
        }

        const endX = beam.x + Math.cos(beam.angle) * Math.max(width, height);
        const endY = beam.y + Math.sin(beam.angle) * Math.max(width, height);

        // Draw light beam cone
        ctx.save();
        const rawColor = beam.color;
        // Dim the spotlights in light mode so they are extremely subtle
        const beamColor = isLightMode() 
          ? rawColor.replace('0.06', '0.02') 
          : rawColor;

        const beamGrad = ctx.createLinearGradient(beam.x, beam.y, endX, endY);
        beamGrad.addColorStop(0, beamColor);
        beamGrad.addColorStop(0.5, beamColor.replace('0.06', '0.01').replace('0.02', '0.005'));
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(beam.x, beam.y);
        ctx.lineTo(
          beam.x + Math.cos(beam.angle - beam.beamWidth) * Math.max(width, height),
          beam.y + Math.sin(beam.angle - beam.beamWidth) * Math.max(width, height)
        );
        ctx.lineTo(
          beam.x + Math.cos(beam.angle + beam.beamWidth) * Math.max(width, height),
          beam.y + Math.sin(beam.angle + beam.beamWidth) * Math.max(width, height)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 3. Render and Update floating 3D event items
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // 4. Render and Update confetti ripples
      confettis = confettis.filter((c) => c.opacity > 0);
      confettis.forEach((c) => {
        c.vy += c.gravity;
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotationSpeed;
        c.opacity -= 0.015;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((c.rotation * Math.PI) / 180);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, c.opacity);
        ctx.beginPath();
        // Rectangular confetti paper
        ctx.rect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
      }
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none -z-10"
      style={{ display: 'block' }}
    />
  );
};

export default ThreeDEventBackground;
