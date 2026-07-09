import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeDTicket = ({ variant = 'vip' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Off-screen canvas for ticket texture
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 300;
    const ctx = textureCanvas.getContext('2d');

    // Draw Ticket Graphic Design
    const drawTicketTexture = (isLight) => {
      ctx.clearRect(0, 0, 512, 300);

      // Background Gradient based on variant
      const grad = ctx.createLinearGradient(0, 0, 512, 300);
      if (variant === 'access') {
        if (isLight) {
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(1, '#EFF6FF'); // Soft blue
        } else {
          grad.addColorStop(0, '#0F172A'); // Slate-900
          grad.addColorStop(0.5, '#1E293B'); // Slate-800
          grad.addColorStop(1, '#1D4ED8'); // Deep blue
        }
      } else if (variant === 'creator') {
        if (isLight) {
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(1, '#FFFBEB'); // Soft gold
        } else {
          grad.addColorStop(0, '#2E1065'); // Violet-950
          grad.addColorStop(0.5, '#1E1B4B'); // Indigo-950
          grad.addColorStop(1, '#78350F'); // Amber-900
        }
      } else if (variant === 'secure') {
        if (isLight) {
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(1, '#F0FDF4'); // Soft green
        } else {
          grad.addColorStop(0, '#022C22'); // Emerald-950
          grad.addColorStop(0.5, '#064E3B'); // Emerald-900
          grad.addColorStop(1, '#065F46'); // Teal-800
        }
      } else { // 'vip'
        if (isLight) {
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(1, '#FFF1F2'); // Soft pink
        } else {
          grad.addColorStop(0, '#1E1B4B'); // Indigo/violet
          grad.addColorStop(0.5, '#111827'); // Near black
          grad.addColorStop(1, '#4C1D95'); // Deep purple
        }
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 300);

      // Border glow outline based on variant
      let themeColor = '#3B82F6'; // Default 'vip' pink
      if (variant === 'access') themeColor = '#3B82F6';
      else if (variant === 'creator') themeColor = '#F59E0B';
      else if (variant === 'secure') themeColor = '#10B981';

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 492, 280);

      // Ticket Cutout circles on left/right borders
      ctx.fillStyle = isLight ? '#f1f3f7' : '#0d0f14'; // blend with outer background
      ctx.beginPath();
      ctx.arc(10, 150, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(502, 150, 24, 0, Math.PI * 2);
      ctx.fill();

      // Dotted perforations line across the middle
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(140, 15);
      ctx.lineTo(140, 285);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // --- Left section (Stub) ---
      if (variant === 'access') {
        // Access keycard padlock shape
        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AUTH GATEWAY', 75, 45);

        // Draw a padlock symbol
        const padlockX = 50;
        const padlockY = 85;
        // White backing
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(padlockX - 10, padlockY - 10, 70, 70, 10);
        ctx.fill();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Shackle
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(padlockX + 25, padlockY + 15, 14, Math.PI, 0);
        ctx.stroke();
        // Padlock body
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.roundRect(padlockX + 5, padlockY + 15, 40, 30, 6);
        ctx.fill();
        // Lock keyhole
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(padlockX + 25, padlockY + 26, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(padlockX + 23, padlockY + 28, 4, 10);

        ctx.fillStyle = isLight ? '#3B82F6' : '#60A5FA';
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.fillText('ACCESS KEY', 75, 185);

        ctx.fillStyle = isLight ? '#9CA3AF' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 9px "Inter", sans-serif';
        ctx.fillText('#KEY-7729-AUTH', 75, 205);

      } else if (variant === 'creator') {
        // Creator member pass star
        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEMBER PASS', 75, 45);

        // White backing
        const starX = 75;
        const starY = 110;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(starX, starY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw golden star
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(starX, starY - 20); // Top point
        ctx.lineTo(starX + 5, starY - 6);
        ctx.lineTo(starX + 20, starY - 6); // Right point
        ctx.lineTo(starX + 8, starY + 4);
        ctx.lineTo(starX + 13, starY + 20); // Bottom right
        ctx.lineTo(starX, starY + 10);
        ctx.lineTo(starX - 13, starY + 20); // Bottom left
        ctx.lineTo(starX - 8, starY + 4);
        ctx.lineTo(starX - 20, starY - 6); // Left point
        ctx.lineTo(starX - 5, starY - 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isLight ? '#F59E0B' : '#FBBF24';
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.fillText('CREATOR', 75, 185);

        ctx.fillStyle = isLight ? '#9CA3AF' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 9px "Inter", sans-serif';
        ctx.fillText('#CRT-88301-HUB', 75, 205);

      } else if (variant === 'secure') {
        // Recovery Shield
        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VERIFICATION', 75, 45);

        // White backing
        const shX = 75;
        const shY = 110;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(shX - 25, shY - 25, 50, 50, 8);
        ctx.fill();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw green shield shape
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.moveTo(shX, shY - 18);
        ctx.lineTo(shX + 14, shY - 14);
        ctx.lineTo(shX + 14, shY + 4);
        ctx.bezierCurveTo(shX + 14, shY + 14, shX, shY + 20, shX, shY + 20);
        ctx.bezierCurveTo(shX, shY + 20, shX - 14, shY + 14, shX - 14, shY + 4);
        ctx.lineTo(shX - 14, shY - 14);
        ctx.closePath();
        ctx.fill();

        // Inner white checkmark
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(shX - 6, shY);
        ctx.lineTo(shX - 2, shY + 4);
        ctx.lineTo(shX + 6, shY - 4);
        ctx.stroke();

        ctx.fillStyle = isLight ? '#10B981' : '#34D399';
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.fillText('RECOVERY', 75, 185);

        ctx.fillStyle = isLight ? '#9CA3AF' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 9px "Inter", sans-serif';
        ctx.fillText('#SEC-5509-RST', 75, 205);

      } else { // default 'vip'
        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TICKET STUB', 75, 45);

        // QR Code (Square)
        const qrX = 35;
        const qrY = 70;
        const qrSize = 80;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
        ctx.fill();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.stroke();

        const drawFinder = (fx, fy) => {
          ctx.fillStyle = '#111827';
          ctx.fillRect(fx, fy, 24, 24);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(fx + 3, fy + 3, 18, 18);
          ctx.fillStyle = '#111827';
          ctx.fillRect(fx + 6, fy + 6, 12, 12);
        };

        drawFinder(qrX, qrY);
        drawFinder(qrX + qrSize - 24, qrY);
        drawFinder(qrX, qrY + qrSize - 24);

        ctx.fillStyle = '#111827';
        for (let r = 0; r < qrSize; r += 4) {
          for (let c = 0; c < qrSize; c += 4) {
            const isTopLeft = r < 28 && c < 28;
            const isTopRight = r < 28 && c > qrSize - 28;
            const isBottomLeft = r > qrSize - 28 && c < 28;
            if (!isTopLeft && !isTopRight && !isBottomLeft) {
              if (Math.random() > 0.4) {
                ctx.fillRect(qrX + c, qrY + r, 4, 4);
              }
            }
          }
        }

        ctx.fillStyle = isLight ? '#3B82F6' : '#60A5FA';
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VIP PASS', 75, 185);

        ctx.fillStyle = isLight ? '#9CA3AF' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 9px "Inter", sans-serif';
        ctx.fillText('#EHB-90823-VIP', 75, 205);
      }

      // --- Right section (Main body) ---
      ctx.textAlign = 'left';

      if (variant === 'access') {
        ctx.fillStyle = isLight ? '#111827' : '#FFFFFF';
        ctx.font = '800 24px "Outfit", sans-serif';
        ctx.fillText('SECURE GATEWAY', 175, 75);
        ctx.fillStyle = '#3B82F6';
        ctx.fillText('AUTH CONTROL', 175, 105);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('STATUS:', 175, 155);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText('SIGN IN REQUIRED', 175, 175);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('PROTOCOL:', 175, 215);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.fillText('TLS HANDSHAKE / JWT', 175, 235);

      } else if (variant === 'creator') {
        ctx.fillStyle = isLight ? '#111827' : '#FFFFFF';
        ctx.font = '800 24px "Outfit", sans-serif';
        ctx.fillText('CREATOR HUB', 175, 75);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('MEMBERSHIP', 175, 105);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('ACCOUNT LEVEL:', 175, 155);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText('UNLIMITED HOSTING', 175, 175);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('BENEFIT:', 175, 215);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.fillText('ZERO PLATFORM FEE', 175, 235);

      } else if (variant === 'secure') {
        ctx.fillStyle = isLight ? '#111827' : '#FFFFFF';
        ctx.font = '800 24px "Outfit", sans-serif';
        ctx.fillText('SECURITY CENTER', 175, 75);
        ctx.fillStyle = '#10B981';
        ctx.fillText('RESET ENGINE', 175, 105);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('TOKEN ACTION:', 175, 155);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText('PASSWORD RESET', 175, 175);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('STATUS:', 175, 215);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.fillText('AUTHORIZATION PENDING', 175, 235);

      } else { // default 'vip'
        ctx.fillStyle = isLight ? '#111827' : '#FFFFFF';
        ctx.font = '800 24px "Outfit", sans-serif';
        ctx.fillText('AHMEDABAD', 175, 75);
        ctx.fillStyle = '#3B82F6';
        ctx.fillText('EVENT HUB', 175, 105);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('TICKET TYPE:', 175, 155);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText('VIP METAVERSE ACCESS', 175, 175);

        ctx.fillStyle = isLight ? '#4B5563' : '#9CA3AF';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.fillText('VENUE:', 175, 215);
        ctx.fillStyle = isLight ? '#1F2937' : '#F3F4F6';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.fillText('SINDHU BHAVAN ARENA', 175, 235);
      }

      // Dynamic Date Tag badge on the top right
      let badgeBg = 'rgba(248, 68, 100, 0.15)';
      if (variant === 'access') badgeBg = 'rgba(59, 130, 246, 0.15)';
      else if (variant === 'creator') badgeBg = 'rgba(245, 158, 11, 0.15)';
      else if (variant === 'secure') badgeBg = 'rgba(16, 185, 129, 0.15)';

      ctx.fillStyle = badgeBg;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(380, 50, 100, 42, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = themeColor;
      ctx.font = 'bold 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      
      let badgeLabel = 'JULY 2026';
      if (variant === 'access') badgeLabel = 'SYS ACTIVE';
      else if (variant === 'creator') badgeLabel = 'JOIN NOW';
      else if (variant === 'secure') badgeLabel = 'SECURE';
      
      ctx.fillText(badgeLabel, 430, 76);
    };

    // Check light/dark mode
    const isLight = document.documentElement.classList.contains('light');
    drawTicketTexture(isLight);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Create 3D Ticket Mesh (A flat box with slight depth)
    const geometry = new THREE.BoxGeometry(3.2, 1.8, 0.08);

    // Front, back, and side materials
    const faceMaterial = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.15,
      metalness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      bumpScale: 0.05,
      side: THREE.DoubleSide
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0xdddddd : 0x221a2f,
      metalness: 0.8,
      roughness: 0.2
    });

    const materials = [
      sideMaterial, // right
      sideMaterial, // left
      sideMaterial, // top
      sideMaterial, // bottom
      faceMaterial, // front
      faceMaterial  // back
    ];

    const ticketMesh = new THREE.Mesh(geometry, materials);
    ticketMesh.castShadow = true;
    scene.add(ticketMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.0 : 0.4);
    scene.add(ambientLight);

    // Key directional light for reflections
    const dirLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.2 : 1.5);
    dirLight.position.set(5, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Colorful point lights for neon reflections (glowing event vibe)
    const pinkLight = new THREE.PointLight(0xf84464, 4, 10);
    pinkLight.position.set(-3, 3, 2);
    scene.add(pinkLight);

    // Dynamic light color based on variant
    let secondaryColorHex = 0x3b82f6; // default blue
    if (variant === 'creator') secondaryColorHex = 0xf59e0b; // gold
    else if (variant === 'secure') secondaryColorHex = 0x10b981; // green

    const blueLight = new THREE.PointLight(secondaryColorHex, 3, 10);
    blueLight.position.set(3, -3, 2);
    scene.add(blueLight);

    // Interaction vars
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      // Normalized coordinates from -1 to 1
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Set target rotations based on mouse position
      targetRotationY = mouseX * 0.5;
      targetRotationX = -mouseY * 0.4;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Handle touch controls for mobile devices
    const handleTouchMove = (event) => {
      if (event.touches.length === 1) {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
        targetRotationY = mouseX * 0.5;
        targetRotationX = -mouseY * 0.4;
      }
    };
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Animate loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Idle floating animation
      let floatOffsetY = Math.sin(elapsedTime * 1.5) * 0.12;
      let idleRotationY = Math.sin(elapsedTime * 0.5) * 0.15;
      let idleRotationX = 0;
      let swingZ = Math.sin(elapsedTime * 1.0) * 0.05;

      if (variant === 'access') {
        // Smooth constant clean rotation around Y axis
        idleRotationY = elapsedTime * 0.4;
        floatOffsetY = Math.sin(elapsedTime * 2.0) * 0.08;
        swingZ = Math.sin(elapsedTime * 1.5) * 0.03;
      } else if (variant === 'creator') {
        // Breathing scale + slow constant majestic orbit
        const scaleVal = 1.0 + Math.sin(elapsedTime * 2.0) * 0.025;
        ticketMesh.scale.set(scaleVal, scaleVal, scaleVal);
        idleRotationY = elapsedTime * 0.25;
        floatOffsetY = Math.sin(elapsedTime * 1.2) * 0.08;
        swingZ = Math.cos(elapsedTime * 0.8) * 0.04;
      } else if (variant === 'secure') {
        // Faster wobbling scanning sweep
        floatOffsetY = Math.sin(elapsedTime * 2.5) * 0.06;
        idleRotationY = Math.sin(elapsedTime * 1.8) * 0.25;
        idleRotationX = Math.cos(elapsedTime * 1.8) * 0.1;
        swingZ = Math.sin(elapsedTime * 3.0) * 0.15;
      }

      // Interpolate mesh rotation towards target
      ticketMesh.rotation.y += (targetRotationY + idleRotationY - ticketMesh.rotation.y) * 0.08;
      ticketMesh.rotation.x += (targetRotationX + idleRotationX - ticketMesh.rotation.x) * 0.08;
      ticketMesh.rotation.z += (swingZ - ticketMesh.rotation.z) * 0.08;
      ticketMesh.position.y = floatOffsetY;

      // Animate point light positions for dynamic lighting
      pinkLight.position.x = Math.sin(elapsedTime) * 3;
      pinkLight.position.y = Math.cos(elapsedTime) * 3;
      blueLight.position.x = -Math.sin(elapsedTime * 1.2) * 3;
      blueLight.position.y = -Math.cos(elapsedTime * 1.2) * 3;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Theme monitor interval
    let prevThemeLight = isLight;
    const themeInterval = setInterval(() => {
      const currentLight = document.documentElement.classList.contains('light');
      if (currentLight !== prevThemeLight) {
        prevThemeLight = currentLight;
        drawTicketTexture(currentLight);
        texture.needsUpdate = true;
        // Update background ambient and directional light intensities
        ambientLight.intensity = currentLight ? 1.0 : 0.4;
        dirLight.intensity = currentLight ? 1.2 : 1.5;
        sideMaterial.color.setHex(currentLight ? 0xdddddd : 0x221a2f);
      }
    }, 500);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      clearInterval(themeInterval);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      faceMaterial.dispose();
      sideMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [variant]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[320px] sm:h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing"
    />
  );
};

export default ThreeDTicket;
