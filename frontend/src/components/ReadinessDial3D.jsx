import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ReadinessDial3D
 * Physical 3D isometric score dial & architectural monolith
 * Sits inside Section 04 (Readiness) on a charcoal surface with soft warm directional studio rim lighting.
 */
export default function ReadinessDial3D({ score = 78 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1F1F1E);

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(4.5, 4.2, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Studio Lighting for dark charcoal scene
    const ambientLight = new THREE.AmbientLight(0x3D3D3A, 1.2);
    scene.add(ambientLight);

    // Warm Key Light highlighting the dial face
    const keyLight = new THREE.DirectionalLight(0xFFF2E0, 2.0);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Warm terracotta rim light catching the bevel edge
    const rimLight = new THREE.DirectionalLight(0xB76E52, 1.4);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Base Charcoal Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.22, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x171716,
      roughness: 0.8,
      metalness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.15;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // The Precision Dial Cylinder
    const dialRadius = 1.35;
    const dialHeight = 0.25;
    const dialGeo = new THREE.CylinderGeometry(dialRadius, dialRadius, dialHeight, 64);

    // Generate dial face texture with tick marks and numerals (0 to 100)
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 1024;
    dialCanvas.height = 1024;
    const ctx = dialCanvas.getContext('2d');

    // Dial background
    ctx.fillStyle = '#262624';
    ctx.fillRect(0, 0, 1024, 1024);

    // Outer circular boundary
    ctx.strokeStyle = '#3E3E3A';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(512, 512, 480, 0, Math.PI * 2);
    ctx.stroke();

    // 100 Radial Tick Marks
    const cx = 512;
    const cy = 512;
    const rOuter = 460;
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 1.5 + Math.PI * 0.75;
      const isMajor = i % 10 === 0;
      const isMid = i % 5 === 0;
      const tickLen = isMajor ? 36 : isMid ? 24 : 14;

      const x1 = cx + Math.cos(angle) * (rOuter - tickLen);
      const y1 = cy + Math.sin(angle) * (rOuter - tickLen);
      const x2 = cx + Math.cos(angle) * rOuter;
      const y2 = cy + Math.sin(angle) * rOuter;

      ctx.strokeStyle = isMajor ? '#F6F4EF' : isMid ? '#9E9D96' : '#5E5E58';
      ctx.lineWidth = isMajor ? 4 : isMid ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (isMajor && i <= 100) {
        const textR = rOuter - 58;
        const tx = cx + Math.cos(angle) * textR;
        const ty = cy + Math.sin(angle) * textR;
        ctx.fillStyle = '#9E9D96';
        ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), tx, ty);
      }
    }

    // Dial Center Core
    ctx.fillStyle = '#B76E52';
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();

    const dialTexture = new THREE.CanvasTexture(dialCanvas);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTexture,
      roughness: 0.5,
      metalness: 0.3,
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.y = 0.08;
    dialMesh.castShadow = true;
    dialMesh.receiveShadow = true;
    scene.add(dialMesh);

    // Indicator Needle (Warm Terracotta architectural blade)
    const needleGroup = new THREE.Group();
    needleGroup.position.set(0, 0.22, 0);
    scene.add(needleGroup);

    const needleGeo = new THREE.BoxGeometry(0.06, 0.04, 1.05);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0xB76E52,
      roughness: 0.3,
      metalness: 0.4,
    });
    const needleMesh = new THREE.Mesh(needleGeo, needleMat);
    needleMesh.position.z = -0.52; // pivot from center
    needleMesh.castShadow = true;
    needleGroup.add(needleMesh);

    // Center brass cap
    const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xC5A15A, roughness: 0.3, metalness: 0.6 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 0.02;
    needleGroup.add(capMesh);

    // Map score (78/100) to angular rotation
    // 0 to 100 maps to: 0.75 PI to 2.25 PI
    const targetAngle = -((score / 100) * Math.PI * 1.5 + Math.PI * 0.75 - Math.PI / 2);
    needleGroup.rotation.y = targetAngle;

    // Interaction & Animation
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle breathing float & gentle micro-tilt
      scene.rotation.y = Math.sin(elapsed * 0.6) * 0.05;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      baseGeo.dispose();
      dialGeo.dispose();
      needleGeo.dispose();
    };
  }, [score]);

  return (
    <div style={{
      width: '100%',
      height: '280px',
      position: 'relative',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid var(--charcoal-border)'
    }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        color: 'var(--accent-warm)',
        letterSpacing: '0.08em'
      }}>
        PHYSICAL CALIBRATION DIAL // 78 INDEX
      </div>
    </div>
  );
}
