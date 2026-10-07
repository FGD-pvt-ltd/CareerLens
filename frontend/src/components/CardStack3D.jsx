import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Physical 3D Card Stack
 * White materials, subtle warm contact shadows, natural studio lighting.
 * Responsive to cursor parallax and window scroll.
 */
export default function CardStack3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAFAF8);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // 3. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting setup (natural, warm, soft)
    const ambientLight = new THREE.AmbientLight(0xFDFBF7, 1.4);
    scene.add(ambientLight);

    // Main studio key light
    const keyLight = new THREE.DirectionalLight(0xFFF9F0, 1.8);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft warm fill light
    const fillLight = new THREE.DirectionalLight(0xF4EFE6, 0.7);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    // Subtle terracotta rim/edge bounce
    const rimLight = new THREE.DirectionalLight(0xB76E52, 0.35);
    rimLight.position.set(2, -4, -2);
    scene.add(rimLight);

    // 5. Back shadow receiver plane (warm surface)
    const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
    const shadowPlaneMat = new THREE.ShadowMaterial({
      opacity: 0.08,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.z = -1.2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Helper to generate crisp editorial card textures using Canvas
    function createCardTexture(type) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 680;
      const ctx = canvas.getContext('2d');

      // Card Background (Off-white matte paper)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fine border outline
      ctx.strokeStyle = '#E7E5DF';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      if (type === 'profile') {
        // Top Header line
        ctx.fillStyle = '#171716';
        ctx.font = 'bold 34px "Manrope", sans-serif';
        ctx.fillText('PROFIQ VERIFIED INSTRUMENT', 56, 90);

        ctx.fillStyle = '#686761';
        ctx.font = '500 22px "JetBrains Mono", monospace';
        ctx.fillText('ID // REF-2026-X89', 56, 130);

        // Accent tag (Terracotta)
        ctx.fillStyle = 'rgba(183, 110, 82, 0.12)';
        ctx.fillRect(720, 56, 240, 48);
        ctx.strokeStyle = '#B76E52';
        ctx.lineWidth = 2;
        ctx.strokeRect(720, 56, 240, 48);
        ctx.fillStyle = '#B76E52';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillText('CONFIDENCE 91%', 745, 88);

        // Divider
        ctx.strokeStyle = '#E7E5DF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(56, 175);
        ctx.lineTo(968, 175);
        ctx.stroke();

        // Candidate Profile info
        ctx.fillStyle = '#171716';
        ctx.font = 'bold 44px "Manrope", sans-serif';
        ctx.fillText('ALEX MORGAN', 56, 250);

        ctx.fillStyle = '#686761';
        ctx.font = '400 24px "Manrope", sans-serif';
        ctx.fillText('Senior Full-Stack Engineer • React & Systems', 56, 295);

        // Verification metrics row
        ctx.fillStyle = '#F6F4EF';
        ctx.fillRect(56, 350, 912, 140);
        ctx.strokeStyle = '#E7E5DF';
        ctx.strokeRect(56, 350, 912, 140);

        ctx.fillStyle = '#686761';
        ctx.font = '500 20px "JetBrains Mono", monospace';
        ctx.fillText('JOB READINESS', 90, 400);
        ctx.fillText('VERIFIED SKILLS', 390, 400);
        ctx.fillText('CONSISTENCY', 690, 400);

        ctx.fillStyle = '#171716';
        ctx.font = 'bold 44px "JetBrains Mono", monospace';
        ctx.fillText('78/100', 90, 455);
        ctx.fillText('14 PROVEN', 390, 455);
        ctx.fillText('94%', 690, 455);

        // Micro footer
        ctx.fillStyle = '#8E8D86';
        ctx.font = '500 18px "JetBrains Mono", monospace';
        ctx.fillText('STATUS: CLAIM AUDIT PASSED • GITHUB SYNCHRONIZED', 56, 560);
      } else if (type === 'evidence') {
        // Evidence stack card
        ctx.fillStyle = '#171716';
        ctx.font = 'bold 32px "Manrope", sans-serif';
        ctx.fillText('CONVERGED EVIDENCE STREAM', 56, 90);

        // Terracotta tag
        ctx.fillStyle = '#B76E52';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('4 PROJECTS • 127 COMMITS', 56, 140);

        // Divider
        ctx.strokeStyle = '#E7E5DF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(56, 180);
        ctx.lineTo(968, 180);
        ctx.stroke();

        ctx.fillStyle = '#686761';
        ctx.font = '400 26px "Manrope", sans-serif';
        ctx.fillText('1. core-platform (React, TypeScript, GraphQL) — 64 commits', 56, 250);
        ctx.fillText('2. distributed-cache (Go, Redis architecture) — 38 commits', 56, 310);
        ctx.fillText('3. design-tokens (Design System & Web Components) — 25 commits', 56, 370);

        ctx.fillStyle = '#7C866B';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('✓ RESUME CLAIM CONFIRMED VIA REPOSITORY RECURSION', 56, 480);
      } else {
        // Baseline card
        ctx.fillStyle = '#171716';
        ctx.font = 'bold 32px "Manrope", sans-serif';
        ctx.fillText('ROLE FIT REASONING ENGINE', 56, 90);
        ctx.fillStyle = '#C5A15A';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('TARGET: FULL STACK ARCHITECT', 56, 140);

        ctx.strokeStyle = '#E7E5DF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(56, 180);
        ctx.lineTo(968, 180);
        ctx.stroke();

        ctx.fillStyle = '#686761';
        ctx.font = '400 26px "Manrope", sans-serif';
        ctx.fillText('Primary Strengths: React 91%, Architecture 79%', 56, 260);
        ctx.fillText('Immediate Action: Docker 34%, Testing CI/CD 41%', 56, 330);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    }

    // 6. Create Card Geometry & Group
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardWidth = 3.6;
    const cardHeight = 2.4;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);

    // Card 3 (Bottom)
    const mat3 = new THREE.MeshStandardMaterial({
      map: createCardTexture('baseline'),
      roughness: 0.6,
      metalness: 0.05,
      color: 0xF4F2EB,
    });
    const card3 = new THREE.Mesh(cardGeo, mat3);
    card3.position.set(-0.35, -0.35, -0.32);
    card3.rotation.z = -0.07;
    card3.castShadow = true;
    card3.receiveShadow = true;
    cardGroup.add(card3);

    // Card 2 (Middle)
    const mat2 = new THREE.MeshStandardMaterial({
      map: createCardTexture('evidence'),
      roughness: 0.55,
      metalness: 0.05,
      color: 0xF9F8F5,
    });
    const card2 = new THREE.Mesh(cardGeo, mat2);
    card2.position.set(0.2, -0.15, -0.16);
    card2.rotation.z = 0.04;
    card2.castShadow = true;
    card2.receiveShadow = true;
    cardGroup.add(card2);

    // Card 1 (Top Hero Profile Card)
    const mat1 = new THREE.MeshStandardMaterial({
      map: createCardTexture('profile'),
      roughness: 0.5,
      metalness: 0.05,
      color: 0xFFFFFF,
    });
    const card1 = new THREE.Mesh(cardGeo, mat1);
    card1.position.set(0, 0.05, 0);
    card1.rotation.z = -0.015;
    card1.castShadow = true;
    card1.receiveShadow = true;
    cardGroup.add(card1);

    // 7. Interaction: Mouse tracking & smooth parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.12;
    let targetRotY = -0.18;
    let currentRotX = 0.12;
    let currentRotY = -0.18;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x;
      mouseY = y;
      targetRotY = -0.18 + x * 0.45;
      targetRotX = 0.12 - y * 0.35;
    };

    const handleMouseLeave = () => {
      targetRotX = 0.12;
      targetRotY = -0.18;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Scroll responsiveness
    let scrollY = window.scrollY;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Window resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for subtle physical inertia
      currentRotX += (targetRotX - currentRotX) * 0.06;
      currentRotY += (targetRotY - currentRotY) * 0.06;

      // Micro floating oscillation
      const floatY = Math.sin(elapsedTime * 0.9) * 0.04;
      const scrollTilt = Math.min(scrollY * 0.0003, 0.15);

      cardGroup.rotation.x = currentRotX - scrollTilt;
      cardGroup.rotation.y = currentRotY;
      cardGroup.position.y = floatY;

      // Subtle dynamic card parallax separation
      card1.position.z = 0 + Math.sin(elapsedTime * 1.1) * 0.02;
      card2.position.z = -0.16 + Math.cos(elapsedTime * 0.8) * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      cardGeo.dispose();
      mat1.dispose();
      mat2.dispose();
      mat3.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
    };
  }, []);

  return (
    <div className="hero-3d-wrapper">
      <div className="canvas-3d-container" ref={mountRef}>
        <div className="canvas-hint">STUDIO DEPTH • CURSOR PARALLAX</div>
      </div>
    </div>
  );
}
