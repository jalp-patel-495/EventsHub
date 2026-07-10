import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Compass, Ticket, MapPin } from 'lucide-react';

const ThreeDScrollShowcase = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  // Framer Motion useScroll for scroll-linking text highlights
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track the scroll value in a ref for the high-performance 60fps WebGL render loop
  const scrollValRef = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    scrollValRef.current = latest;
    
    // Update active text card based on scroll progress
    if (latest < 0.33) {
      setActiveStep(0);
    } else if (latest < 0.66) {
      setActiveStep(1);
    } else {
      setActiveStep(2);
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dimensions
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    // Renderer
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

    // Hidden Canvas for ticket texture
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 300;
    const ctx = textureCanvas.getContext('2d');

    const drawTicketTexture = (currentThemeLight) => {
      ctx.clearRect(0, 0, 512, 300);

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 512, 300);
      if (currentThemeLight) {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#FFF1F2'); // Soft pink/red tint
      } else {
        grad.addColorStop(0, '#1E1B4B'); // Indigo
        grad.addColorStop(0.5, '#111827'); // Blackish
        grad.addColorStop(1, '#4C1D95'); // Deep purple
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 300);

      // Border glow outline
      const themeColor = '#3B82F6'; // EventHub pink
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 492, 280);

      // Ticket Cutout circles
      ctx.fillStyle = currentThemeLight ? '#f1f3f7' : '#0d0f14';
      ctx.beginPath();
      ctx.arc(10, 150, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(502, 150, 24, 0, Math.PI * 2);
      ctx.fill();

      // Dotted line perforation
      ctx.strokeStyle = currentThemeLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(140, 15);
      ctx.lineTo(140, 285);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stub QR Code
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
      // Fill random pseudo QR pixels
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

      // Main Ticket Body
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

      // Badge
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

    drawTicketTexture(isLight);

    const canvasTexture = new THREE.CanvasTexture(textureCanvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    // Create left texture clone
    const leftTexture = canvasTexture.clone();
    leftTexture.repeat.set(140 / 512, 1);
    leftTexture.offset.set(0, 0);
    leftTexture.needsUpdate = true;

    // Create right texture clone
    const rightTexture = canvasTexture.clone();
    rightTexture.repeat.set((512 - 140) / 512, 1);
    rightTexture.offset.set(140 / 512, 0);
    rightTexture.needsUpdate = true;

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

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0xdddddd : 0x221a2f,
      metalness: 0.8,
      roughness: 0.2
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0xffffff : 0x110c1a,
      roughness: 0.3,
      metalness: 0.3
    });

    const leftMaterials = [
      sideMaterial, // +X
      sideMaterial, // -X
      sideMaterial, // +Y
      sideMaterial, // -Y
      leftFaceMaterial, // +Z
      backMaterial  // -Z
    ];

    const rightMaterials = [
      sideMaterial, // +X
      sideMaterial, // -X
      sideMaterial, // +Y
      sideMaterial, // -Y
      rightFaceMaterial, // +Z
      backMaterial  // -Z
    ];

    const ticketGroup = new THREE.Group();
    scene.add(ticketGroup);

    // Left geometry: width = 0.875, height = 1.8, depth = 0.08
    const leftGeometry = new THREE.BoxGeometry(0.875, 1.8, 0.08);
    const leftTicketMesh = new THREE.Mesh(leftGeometry, leftMaterials);
    leftTicketMesh.castShadow = true;
    leftTicketMesh.receiveShadow = true;
    ticketGroup.add(leftTicketMesh);

    // Right geometry: width = 2.325, height = 1.8, depth = 0.08
    const rightGeometry = new THREE.BoxGeometry(2.325, 1.8, 0.08);
    const rightTicketMesh = new THREE.Mesh(rightGeometry, rightMaterials);
    rightTicketMesh.castShadow = true;
    rightTicketMesh.receiveShadow = true;
    ticketGroup.add(rightTicketMesh);

    // Initialize positions
    leftTicketMesh.position.x = -1.1625;
    rightTicketMesh.position.x = 0.4375;

    // Orbiting Particles (Galaxy)
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const initialRadii = new Float32Array(particleCount);

    const baseColor = new THREE.Color(0x3b82f6);

    for (let i = 0; i < particleCount; i++) {
      // Random coordinates around a sphere
      const radius = 1.8 + Math.random() * 1.5;
      initialRadii[i] = radius;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random color variations matching main theme
      particleColors[i * 3] = baseColor.r + (Math.random() - 0.5) * 0.1;
      particleColors[i * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.1;
      particleColors[i * 3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Particle texture (using a simple circle sprite)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255,255,255,1)');
    pGrad.addColorStop(1, 'rgba(255,255,255,0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 0.9 : 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.0 : 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Dynamic orbiting neon point lights
    const colorLight1 = new THREE.PointLight(0x3b82f6, 5, 12);
    colorLight1.position.set(-3, 2, 2);
    scene.add(colorLight1);

    const colorLight2 = new THREE.PointLight(0xec4899, 4, 12);
    colorLight2.position.set(3, -2, 2);
    scene.add(colorLight2);

    // Interaction variables
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event) => {
      // Normalize mouse positions between -1 and 1
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Color definitions for each stage
    const themeColors = {
      0: { // Discovery: Indigo / Blue
        mesh: new THREE.Color(0x3b82f6),
        emissive: new THREE.Color(0x1e3a8a),
        light1: new THREE.Color(0x00d2ff),
        light2: new THREE.Color(0x7c3aed)
      },
      1: { // Ticketing: Pink / Rose / Violet
        mesh: new THREE.Color(0xf84464),
        emissive: new THREE.Color(0x881337),
        light1: new THREE.Color(0xec4899),
        light2: new THREE.Color(0xdb2777)
      },
      2: { // Venues: Emerald / Mint
        mesh: new THREE.Color(0x10b981),
        emissive: new THREE.Color(0x064e3b),
        light1: new THREE.Color(0x34d399),
        light2: new THREE.Color(0x059669)
      }
    };

    // Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const scrollProgress = scrollValRef.current; // Value between 0 and 1

      // 1. Determine active stage theme details
      let currentStage = 0;
      let stageProgress = 0; // progress within the current stage

      if (scrollProgress < 0.33) {
        currentStage = 0;
        stageProgress = scrollProgress / 0.33;
      } else if (scrollProgress < 0.66) {
        currentStage = 1;
        stageProgress = (scrollProgress - 0.33) / 0.33;
      } else {
        currentStage = 2;
        stageProgress = (scrollProgress - 0.66) / 0.34;
      }

      // Interpolate mesh side border color dynamically towards the active stage colors
      const targetColors = themeColors[currentStage];
      sideMaterial.color.lerp(targetColors.mesh, 0.05);
      colorLight1.color.lerp(targetColors.light1, 0.05);
      colorLight2.color.lerp(targetColors.light2, 0.05);

      // Update particle colors as well
      const colorsAttr = particleGeometry.attributes.color;
      if (colorsAttr) {
        for (let i = 0; i < particleCount; i++) {
          const colorIndex = i * 3;
          colorsAttr.array[colorIndex] += (targetColors.mesh.r - colorsAttr.array[colorIndex]) * 0.02;
          colorsAttr.array[colorIndex + 1] += (targetColors.mesh.g - colorsAttr.array[colorIndex + 1]) * 0.02;
          colorsAttr.array[colorIndex + 2] += (targetColors.mesh.b - colorsAttr.array[colorIndex + 2]) * 0.02;
        }
        colorsAttr.needsUpdate = true;
      }

      // 2. Rotate ticketGroup based on scroll progress + idle spin
      // Scroll spins the object elegantly
      ticketGroup.rotation.y = elapsedTime * 0.15 + (scrollProgress * Math.PI * 1.5);
      ticketGroup.rotation.x = elapsedTime * 0.1 + (scrollProgress * Math.PI * 0.4);
      ticketGroup.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;

      // 3. Calculate splitting distance of halves based on scroll progress
      // Peaking at 0.5 (middle) and merging back at 1.0
      const splitFactor = Math.sin(scrollProgress * Math.PI);
      const maxSeparation = 1.4; // Max distance they pull apart
      const targetSeparation = splitFactor * maxSeparation;

      leftTicketMesh.position.x += (-1.1625 - targetSeparation - leftTicketMesh.position.x) * 0.08;
      rightTicketMesh.position.x += (0.4375 + targetSeparation - rightTicketMesh.position.x) * 0.08;

      // Apply tilt to the split parts
      leftTicketMesh.rotation.y += (-0.35 * splitFactor - leftTicketMesh.rotation.y) * 0.08;
      leftTicketMesh.rotation.z += (-0.08 * splitFactor - leftTicketMesh.rotation.z) * 0.08;
      rightTicketMesh.rotation.y += (0.35 * splitFactor - rightTicketMesh.rotation.y) * 0.08;
      rightTicketMesh.rotation.z += (0.08 * splitFactor - rightTicketMesh.rotation.z) * 0.08;

      // 4. Move/Scale the ticketGroup based on scroll progress (storytelling transitions)
      let targetX = 0;
      let targetY = 0;
      let targetScale = 1.1;

      if (currentStage === 0) {
        // Discovery: Starts slightly to the right, moves to center
        targetX = THREE.MathUtils.lerp(0.8, -0.2, stageProgress);
        targetScale = THREE.MathUtils.lerp(0.95, 1.1, stageProgress);
      } else if (currentStage === 1) {
        // Ticketing: Splitting in center
        targetX = THREE.MathUtils.lerp(-0.2, 0, stageProgress);
        targetScale = THREE.MathUtils.lerp(1.1, 1.2, stageProgress);
      } else {
        // Venues: Merging back at center
        targetX = 0;
        targetScale = 1.1 + Math.sin(elapsedTime * 2.5) * 0.05;
      }

      ticketGroup.position.x += (targetX - ticketGroup.position.x) * 0.07;
      ticketGroup.position.y += (targetY + Math.sin(elapsedTime * 1.5) * 0.08 - ticketGroup.position.y) * 0.07; // Hover effect
      
      const sVal = THREE.MathUtils.lerp(ticketGroup.scale.x, targetScale, 0.07);
      ticketGroup.scale.set(sVal, sVal, sVal);

      // 5. Animate Orbiting Particles
      const posAttr = particleGeometry.attributes.position;
      const time = elapsedTime * 0.15;
      const orbitSpeed = 1.0 + (scrollProgress * 2.0);
      const orbitExpansion = currentStage === 2 ? 1.4 : 1.0;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const initialRadius = initialRadii[i] * orbitExpansion;
        const offset = i * 0.1;
        const angleX = time * orbitSpeed + offset;
        const angleY = time * 0.8 * orbitSpeed + offset;

        posAttr.array[idx] = initialRadius * Math.sin(angleX);
        posAttr.array[idx + 1] = initialRadius * Math.cos(angleY);
        posAttr.array[idx + 2] = initialRadius * Math.cos(angleX) * (1.0 + scrollProgress * 0.5);
      }
      posAttr.needsUpdate = true;
      
      particles.rotation.y = -elapsedTime * 0.05 - (scrollProgress * 0.8);
      particles.rotation.x = elapsedTime * 0.03;

      // 6. Orbiting Neon Point Lights
      colorLight1.position.x = Math.sin(elapsedTime * 1.8) * 3.5;
      colorLight1.position.y = Math.cos(elapsedTime * 1.8) * 3.5;
      colorLight1.position.z = Math.sin(elapsedTime * 1.0) * 2;

      colorLight2.position.x = -Math.sin(elapsedTime * 1.5) * 3.5;
      colorLight2.position.y = -Math.cos(elapsedTime * 1.5) * 3.5;
      colorLight2.position.z = -Math.cos(elapsedTime * 1.0) * 2;

      // Mouse influence on camera/mesh orientation (subtle tilt)
      camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 0.4 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Monitor theme shifts (light / dark)
    let prevTheme = isLight;
    const themeMonitor = setInterval(() => {
      const currentLight = document.documentElement.classList.contains('light');
      if (currentLight !== prevTheme) {
        prevTheme = currentLight;
        ambientLight.intensity = currentLight ? 0.9 : 0.35;
        dirLight.intensity = currentLight ? 1.0 : 1.2;
        
        drawTicketTexture(currentLight);
        canvasTexture.needsUpdate = true;
        leftTexture.needsUpdate = true;
        rightTexture.needsUpdate = true;
        
        sideMaterial.color.setHex(currentLight ? 0xdddddd : 0x221a2f);
        backMaterial.color.setHex(currentLight ? 0xffffff : 0x110c1a);
      }
    }, 500);

    // Resize Handler
    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const w = canvasRef.current.parentElement.clientWidth;
      const h = canvasRef.current.parentElement.clientHeight;
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
      
      // Dispose WebGL resources
      leftGeometry.dispose();
      rightGeometry.dispose();
      leftFaceMaterial.dispose();
      rightFaceMaterial.dispose();
      sideMaterial.dispose();
      backMaterial.dispose();
      canvasTexture.dispose();
      leftTexture.dispose();
      rightTexture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      pTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full min-h-[300vh] bg-gradient-to-b from-transparent via-dark-bg/40 to-transparent flex flex-col items-center select-none"
    >
      {/* Sticky 3D Canvas wrapper */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 to-emerald-500/5 blur-[120px] -z-10" />
        <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          {/* Empty left side to allow text visibility on larger screens (or text overlays canvas) */}
          <div className="hidden lg:block lg:col-span-6 h-full" />
          
          {/* Canvas container taking half on desktop, full screen on mobile */}
          <div className="col-span-12 lg:col-span-6 h-[50vh] lg:h-[75vh] w-full flex items-center justify-center pointer-events-auto">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full max-h-[600px] max-w-[600px] cursor-grab active:cursor-grabbing" 
            />
          </div>
        </div>
      </div>

      {/* Scrolling storytelling content sections */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-[100vh] z-20 pointer-events-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* Text content scrolls down */}
          <div className="col-span-12 lg:col-span-6 flex flex-col space-y-[45vh] pb-[30vh]">
            
            {/* Step 1: Discovery */}
            <motion.div 
              className={`glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-500 ${
                activeStep === 0 
                  ? 'opacity-100 scale-100 ring-2 ring-brand-primary/30 shadow-brand-primary/10' 
                  : 'opacity-40 scale-95'
              }`}
              initial={{ opacity: 0.1, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-200px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex p-3 rounded-2xl bg-brand-primary/10 text-brand-primary mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-primary/80">Experience Ahmedabad</span>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 text-dark-text tracking-tight font-sans">
                AI-Driven Event Discovery
              </h3>
              <p className="mt-4 text-sm sm:text-base text-dark-muted leading-relaxed font-light">
                Discover concerts, high-energy garba festivals, exhibitions, and professional tech meetups tailored completely to your tastes. Our intelligent recommendations surface the best events happening right in your neighborhood.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Garba Nights</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Concerts</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Food Festivals</span>
              </div>
            </motion.div>

            {/* Step 2: Ticketing */}
            <motion.div 
              className={`glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-500 ${
                activeStep === 1 
                  ? 'opacity-100 scale-100 ring-2 ring-rose-500/30 shadow-rose-500/10' 
                  : 'opacity-40 scale-95'
              }`}
              initial={{ opacity: 0.1, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-200px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-500 mb-6">
                <Ticket className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">Instant Access</span>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 text-dark-text tracking-tight font-sans">
                Next-Gen Secure Passports
              </h3>
              <p className="mt-4 text-sm sm:text-base text-dark-muted leading-relaxed font-light">
                Buy tickets seamlessly with Razorpay integrated checkout. Your tickets are issued as tamper-proof, high-security visual passes. Organizers scan secure QR codes directly from their mobile dashboards at the venue gates.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Razorpay Checkout</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Anti-Fraud QR Code</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Instant Stub Pass</span>
              </div>
            </motion.div>

            {/* Step 3: Venue Management */}
            <motion.div 
              className={`glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-500 ${
                activeStep === 2 
                  ? 'opacity-100 scale-100 ring-2 ring-emerald-500/30 shadow-emerald-500/10' 
                  : 'opacity-40 scale-95'
              }`}
              initial={{ opacity: 0.1, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-200px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Space & Logistics</span>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 text-dark-text tracking-tight font-sans">
                Premium Venues & Spatial Rental
              </h3>
              <p className="mt-4 text-sm sm:text-base text-dark-muted leading-relaxed font-light">
                List and rent out premium event plots, banquet halls, and open gardens across Ahmedabad. Plot owners manage availability calendars, set pricing tiers, and sign secure rental agreements with local planners.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Lawn & Hall Listings</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Booking Calendars</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-dark-muted">Lease Contracts</span>
              </div>
            </motion.div>

          </div>
          {/* Empty right side corresponding to canvas area */}
          <div className="hidden lg:block lg:col-span-6" />
        </div>
      </div>
    </div>
  );
};

export default ThreeDScrollShowcase;
