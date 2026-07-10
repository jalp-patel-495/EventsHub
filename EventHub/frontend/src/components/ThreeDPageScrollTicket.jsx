import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeDPageScrollTicket = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    // WebGL Renderer with Alpha enabled (for transparent background overlay)
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Detect light/dark mode
    const isLight = document.documentElement.classList.contains('light');

    // Create Hidden Canvas for high-definition ticket texture drawing
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 300;
    const ctx = textureCanvas.getContext('2d');

    // Create Hidden Canvas for back-side ticket texture drawing
    const backTextureCanvas = document.createElement('canvas');
    backTextureCanvas.width = 512;
    backTextureCanvas.height = 300;
    const backCtx = backTextureCanvas.getContext('2d');

    const drawTicketTexture = (currentThemeLight) => {
      ctx.clearRect(0, 0, 512, 300);

      // Background Gradient matching EventHub styling
      const grad = ctx.createLinearGradient(0, 0, 512, 300);
      if (currentThemeLight) {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#FFF1F2'); // Soft red-pink tint
      } else {
        grad.addColorStop(0, '#1E1B4B'); // Deep Indigo
        grad.addColorStop(0.5, '#111827'); // Near black
        grad.addColorStop(1, '#4C1D95'); // Deep Purple
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 300);

      // Border neon glow outline
      const themeColor = '#3B82F6'; // EventHub theme primary pink
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 492, 280);

      // Ticket Cutout circles
      ctx.fillStyle = currentThemeLight ? '#e2e8f0' : '#0c0714';
      ctx.beginPath();
      ctx.arc(10, 150, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(502, 150, 24, 0, Math.PI * 2);
      ctx.fill();

      // Dotted perforation line (split line at x = 140)
      ctx.strokeStyle = currentThemeLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(140, 15);
      ctx.lineTo(140, 285);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Left Stub (QR Code & Pass Info) ---
      const qrX = 35;
      const qrY = 70;
      const qrSize = 80;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
      ctx.fill();
      ctx.strokeStyle = themeColor;
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

      ctx.fillStyle = currentThemeLight ? '#3B82F6' : '#60A5FA';
      ctx.font = 'bold 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIP PASS', 75, 185);

      ctx.fillStyle = currentThemeLight ? '#9CA3AF' : 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 9px "Inter", sans-serif';
      ctx.fillText('#EHB-90823-VIP', 75, 205);

      // --- Right Body (Branding & Event details) ---
      ctx.textAlign = 'left';
      ctx.fillStyle = currentThemeLight ? '#111827' : '#FFFFFF';
      ctx.font = '800 24px "Outfit", sans-serif';
      ctx.fillText('AHMEDABAD', 175, 75);
      ctx.fillStyle = '#3B82F6';
      ctx.fillText('EVENT HUB', 175, 105);

      ctx.fillStyle = currentThemeLight ? '#4B5563' : '#9CA3AF';
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillText('TICKET TYPE:', 175, 155);
      ctx.fillStyle = currentThemeLight ? '#1F2937' : '#F3F4F6';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.fillText('VIP METAVERSE ACCESS', 175, 175);

      ctx.fillStyle = currentThemeLight ? '#4B5563' : '#9CA3AF';
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillText('VENUE:', 175, 215);
      ctx.fillStyle = currentThemeLight ? '#1F2937' : '#F3F4F6';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillText('SINDHU BHAVAN ARENA', 175, 235);

      // Date Badge
      ctx.fillStyle = 'rgba(248, 68, 100, 0.15)';
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(380, 50, 100, 42, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = themeColor;
      ctx.font = 'bold 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JULY 2026', 430, 76);
    };

    const drawTicketBackTexture = (currentThemeLight) => {
      backCtx.clearRect(0, 0, 512, 300);

      // Background gradient
      const grad = backCtx.createLinearGradient(0, 0, 512, 300);
      if (currentThemeLight) {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#FFF1F2');
      } else {
        grad.addColorStop(0, '#110C1A'); // Dark purple
        grad.addColorStop(0.5, '#1E1B4B'); // Indigo
        grad.addColorStop(1, '#0C0714'); // Blackish
      }
      backCtx.fillStyle = grad;
      backCtx.fillRect(0, 0, 512, 300);

      // Border glow outline
      const themeColor = '#3B82F6';
      backCtx.strokeStyle = themeColor;
      backCtx.lineWidth = 6;
      backCtx.strokeRect(10, 10, 492, 280);

      // Ticket Cutout circles
      backCtx.fillStyle = currentThemeLight ? '#e2e8f0' : '#0c0714';
      backCtx.beginPath();
      backCtx.arc(10, 150, 24, 0, Math.PI * 2);
      backCtx.fill();
      backCtx.beginPath();
      backCtx.arc(502, 150, 24, 0, Math.PI * 2);
      backCtx.fill();

      // Dotted perforation line (split line at x = 140)
      backCtx.strokeStyle = currentThemeLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
      backCtx.lineWidth = 2;
      backCtx.setLineDash([8, 8]);
      backCtx.beginPath();
      backCtx.moveTo(140, 15);
      backCtx.lineTo(140, 285);
      backCtx.stroke();
      backCtx.setLineDash([]);

      // --- Left section (Stub Back) ---
      backCtx.fillStyle = currentThemeLight ? '#111827' : '#FFFFFF';
      backCtx.font = 'bold 11px "Inter", sans-serif';
      backCtx.textAlign = 'center';
      backCtx.fillText('SCAN ENTRY', 75, 55);

      // Draw barcode lines
      const bcX = 35;
      const bcY = 80;
      const bcW = 80;
      const bcH = 45;
      backCtx.fillStyle = currentThemeLight ? '#111827' : '#FFFFFF';
      let currX = bcX;
      while (currX < bcX + bcW) {
        const lineW = Math.random() > 0.5 ? 2 : 4;
        const gap = Math.random() > 0.5 ? 2 : 3;
        backCtx.fillRect(currX, bcY, lineW, bcH);
        currX += lineW + gap;
      }

      backCtx.fillStyle = currentThemeLight ? '#9CA3AF' : 'rgba(255, 255, 255, 0.4)';
      backCtx.font = 'bold 8px "Inter", sans-serif';
      backCtx.fillText('SECURE PASS', 75, 145);

      // --- Right section (Main Back) ---
      backCtx.textAlign = 'left';
      backCtx.fillStyle = currentThemeLight ? '#111827' : '#FFFFFF';
      backCtx.font = '800 18px "Outfit", sans-serif';
      backCtx.fillText('TERMS & CONDITIONS', 175, 60);

      // Draw bullet items
      backCtx.font = '500 11px "Inter", sans-serif';
      backCtx.fillStyle = currentThemeLight ? '#4B5563' : '#9CA3AF';
      backCtx.fillText('• This ticket is a non-transferable single-entry pass.', 175, 95);
      backCtx.fillText('• Present QR code stub at the venue gateway for scan.', 175, 125);
      backCtx.fillText('• Organizers reserve the right of admission control.', 175, 155);
      backCtx.fillText('• Powered by Ahmedabad EventHub Secure Protocols.', 175, 185);

      // Draw large transparent watermark logo in background
      backCtx.save();
      backCtx.globalAlpha = 0.04;
      backCtx.fillStyle = themeColor;
      backCtx.font = 'bold 90px "Outfit", sans-serif';
      backCtx.fillText('EHB', 220, 220);
      backCtx.restore();
    };

    drawTicketTexture(isLight);
    drawTicketBackTexture(isLight);

    const canvasTexture = new THREE.CanvasTexture(textureCanvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    // Clone and map UVs for Left Half (Stub)
    const leftTexture = canvasTexture.clone();
    leftTexture.repeat.set(140 / 512, 1);
    leftTexture.offset.set(0, 0);
    leftTexture.needsUpdate = true;

    // Clone and map UVs for Right Half (Main Body)
    const rightTexture = canvasTexture.clone();
    rightTexture.repeat.set((512 - 140) / 512, 1);
    rightTexture.offset.set(140 / 512, 0);
    rightTexture.needsUpdate = true;

    // Generate Back-Side Textures
    const backCanvasTexture = new THREE.CanvasTexture(backTextureCanvas);
    backCanvasTexture.colorSpace = THREE.SRGBColorSpace;

    // Clone, map, and mirror UVs for Left Back (Stub Back)
    const leftBackTexture = backCanvasTexture.clone();
    leftBackTexture.repeat.set(-140 / 512, 1);
    leftBackTexture.offset.set(140 / 512, 0);
    leftBackTexture.needsUpdate = true;

    // Clone, map, and mirror UVs for Right Back (Main Body Back)
    const rightBackTexture = backCanvasTexture.clone();
    rightBackTexture.repeat.set(-(512 - 140) / 512, 1);
    rightBackTexture.offset.set(1.0, 0);
    rightBackTexture.needsUpdate = true;

    // Materials
    const leftFaceMaterial = new THREE.MeshPhysicalMaterial({
      map: leftTexture,
      roughness: 0.15,
      metalness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });

    const rightFaceMaterial = new THREE.MeshPhysicalMaterial({
      map: rightTexture,
      roughness: 0.15,
      metalness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });

    const leftBackMaterial = new THREE.MeshPhysicalMaterial({
      map: leftBackTexture,
      roughness: 0.25,
      metalness: 0.3,
      side: THREE.DoubleSide
    });

    const rightBackMaterial = new THREE.MeshPhysicalMaterial({
      map: rightBackTexture,
      roughness: 0.25,
      metalness: 0.3,
      side: THREE.DoubleSide
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0xdddddd : 0x221a2f,
      metalness: 0.8,
      roughness: 0.2
    });

    const leftMaterials = [
      sideMaterial, // +X
      sideMaterial, // -X
      sideMaterial, // +Y
      sideMaterial, // -Y
      leftFaceMaterial, // +Z
      leftBackMaterial  // -Z
    ];

    const rightMaterials = [
      sideMaterial, // +X
      sideMaterial, // -X
      sideMaterial, // +Y
      sideMaterial, // -Y
      rightFaceMaterial, // +Z
      rightBackMaterial  // -Z
    ];

    // Parent group for viewport movement and global rotation
    const ticketGroup = new THREE.Group();
    scene.add(ticketGroup);

    // Left Half ticket mesh (width = 0.875)
    const leftGeometry = new THREE.BoxGeometry(0.875, 1.8, 0.08);
    const leftTicketMesh = new THREE.Mesh(leftGeometry, leftMaterials);
    leftTicketMesh.castShadow = true;
    ticketGroup.add(leftTicketMesh);

    // Right Half ticket mesh (width = 2.325)
    const rightGeometry = new THREE.BoxGeometry(2.325, 1.8, 0.08);
    const rightTicketMesh = new THREE.Mesh(rightGeometry, rightMaterials);
    rightTicketMesh.castShadow = true;
    ticketGroup.add(rightTicketMesh);

    // Default merged coordinates
    leftTicketMesh.position.x = -1.1625;
    rightTicketMesh.position.x = 0.4375;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.0 : 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.2 : 1.6);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    // Colorful point lights for ambient neon glow reflections
    const colorLight1 = new THREE.PointLight(0xf84464, 4, 12);
    colorLight1.position.set(-3, 4, 3);
    scene.add(colorLight1);

    const colorLight2 = new THREE.PointLight(0x3b82f6, 3, 12);
    colorLight2.position.set(3, -4, 3);
    scene.add(colorLight2);

    // Mouse movement listeners for interactive tilt
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      
      const targetX = 0.0;
      const targetY = 0.0;
      const targetZ = 0.0;
      const targetScale = 1.1; // Standard fit scale
      const targetRotX = 0.0;
      const targetRotY = 0.0;
      const targetRotZ = 0.0;
      const targetSeparation = 0.0; // Unsplit static
      const localSplitFactor = 0.0; // Static unsplit

      const calculatedTargetY = targetY;

      // 2. Smoothly interpolate group translation and scale
      ticketGroup.position.x += (targetX - ticketGroup.position.x) * 0.08;
      ticketGroup.position.y += (calculatedTargetY - ticketGroup.position.y) * 0.08;
      ticketGroup.position.z += (targetZ - ticketGroup.position.z) * 0.08;
      
      const currentScale = THREE.MathUtils.lerp(ticketGroup.scale.x, targetScale, 0.08);
      ticketGroup.scale.set(currentScale, currentScale, currentScale);

      // 3. Smoothly interpolate group rotation (adding mouse tilt)
      const mouseRotX = mouseY * 0.3;
      const mouseRotY = mouseX * 0.35;
      
      ticketGroup.rotation.x += (targetRotX + mouseRotX - ticketGroup.rotation.x) * 0.08;
      ticketGroup.rotation.y += (targetRotY + mouseRotY - ticketGroup.rotation.y) * 0.08;
      ticketGroup.rotation.z += (targetRotZ - ticketGroup.rotation.z) * 0.08;

      // 4. Update the split separation of the halves
      leftTicketMesh.position.x += (-1.1625 - targetSeparation - leftTicketMesh.position.x) * 0.1;
      rightTicketMesh.position.x += (0.4375 + targetSeparation - rightTicketMesh.position.x) * 0.1;

      // Local mesh pitch rotation during split
      leftTicketMesh.rotation.y += (-0.35 * localSplitFactor - leftTicketMesh.rotation.y) * 0.1;
      leftTicketMesh.rotation.z += (-0.08 * localSplitFactor - leftTicketMesh.rotation.z) * 0.1;
      rightTicketMesh.rotation.y += (0.35 * localSplitFactor - rightTicketMesh.rotation.y) * 0.1;
      rightTicketMesh.rotation.z += (0.08 * localSplitFactor - rightTicketMesh.rotation.z) * 0.1;

      // Animate neon light coordinates
      colorLight1.position.x = Math.sin(elapsedTime * 1.5) * 4;
      colorLight1.position.y = Math.cos(elapsedTime * 1.5) * 4;
      colorLight2.position.x = -Math.sin(elapsedTime * 1.2) * 4;
      colorLight2.position.y = -Math.cos(elapsedTime * 1.2) * 4;

      // Camera lookup setup
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Theme monitor interval
    let prevTheme = isLight;
    const themeMonitor = setInterval(() => {
      const currentLight = document.documentElement.classList.contains('light');
      if (currentLight !== prevTheme) {
        prevTheme = currentLight;
        ambientLight.intensity = currentLight ? 1.0 : 0.45;
        dirLight.intensity = currentLight ? 1.2 : 1.6;
        
        drawTicketTexture(currentLight);
        drawTicketBackTexture(currentLight);
        canvasTexture.needsUpdate = true;
        leftTexture.needsUpdate = true;
        rightTexture.needsUpdate = true;
        backCanvasTexture.needsUpdate = true;
        leftBackTexture.needsUpdate = true;
        rightBackTexture.needsUpdate = true;
        
        sideMaterial.color.setHex(currentLight ? 0xdddddd : 0x221a2f);
      }
    }, 500);

    // Resize Handler
    const handleResize = () => {
      if (!canvas || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      clearInterval(themeMonitor);
      cancelAnimationFrame(animationFrameId);

      // Clean up GPU objects
      leftGeometry.dispose();
      rightGeometry.dispose();
      leftFaceMaterial.dispose();
      rightFaceMaterial.dispose();
      leftBackMaterial.dispose();
      rightBackMaterial.dispose();
      sideMaterial.dispose();
      canvasTexture.dispose();
      leftTexture.dispose();
      rightTexture.dispose();
      backCanvasTexture.dispose();
      leftBackTexture.dispose();
      rightBackTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative pointer-events-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default ThreeDPageScrollTicket;
