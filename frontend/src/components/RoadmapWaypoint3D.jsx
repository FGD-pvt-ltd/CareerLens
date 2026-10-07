import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * RoadmapWaypoint3D
 * An isometric 3D architectural milestone totem on a stone plinth.
 * Natural studio lighting, soft shadows on white canvas.
 */
export default function RoadmapWaypoint3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);

    const camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 100);
    camera.position.set(4.2, 4.0, 4.2);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xFFF9F0, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF4E6, 2.0);
    sunLight.position.set(4, 7, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Floor Shadow Receiver
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.14 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);

    // Base Stepping Stone / Plinth
    const group = new THREE.Group();
    scene.add(group);

    const baseGeo = new THREE.BoxGeometry(1.4, 0.18, 1.4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xF6F4EF, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.09;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Architectural Milestone Monolith (Terracotta & Brass trim)
    const totemGeo = new THREE.BoxGeometry(0.35, 0.85, 0.35);
    const totemMat = new THREE.MeshStandardMaterial({ color: 0x171716, roughness: 0.4 });
    const totem = new THREE.Mesh(totemGeo, totemMat);
    totem.position.y = 0.55;
    totem.castShadow = true;
    group.add(totem);

    // Terracotta accent ring
    const ringGeo = new THREE.BoxGeometry(0.38, 0.08, 0.38);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xB76E52, roughness: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.85;
    group.add(ring);

    // Floating Milestone Beacon Prism
    const prismGeo = new THREE.OctahedronGeometry(0.16, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0xC5A15A,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0xC5A15A,
      emissiveIntensity: 0.2
    });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.y = 1.18;
    prism.castShadow = true;
    group.add(prism);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      group.rotation.y = elapsed * 0.4;
      prism.rotation.y = elapsed * 0.8;
      prism.position.y = 1.18 + Math.sin(elapsed * 2) * 0.04;

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
      totemGeo.dispose();
      ringGeo.dispose();
      prismGeo.dispose();
    };
  }, []);

  return (
    <div style={{ width: '220px', height: '200px', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '0',
        right: '0',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--text-muted)'
      }}>
        ISOMETRIC WAYPOINT // 3D
      </div>
    </div>
  );
}
