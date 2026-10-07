import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * HeroIsometricDiorama3D
 * An architectural isometric diorama representing the "Career Foundation & Evidence Studio",
 * styled after physical architectural models with soft natural studio lighting,
 * realistic directional shadows on a pure white canvas, modern pavilion, and procedural trees.
 */
export default function HeroIsometricDiorama3D({ onInspectSection }) {
  const mountRef = useRef(null);
  const [activeFeature, setActiveFeature] = useState('overview');
  const [lightingMode, setLightingMode] = useState('day'); // 'day' | 'dusk'

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);

    // 2. Camera setup - Isometric feel with low FOV perspective or orthographic
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 100);
    // True isometric position ratio: x=y=z
    const isoDistance = 11.5;
    camera.position.set(isoDistance, isoDistance * 0.88, isoDistance);
    camera.lookAt(0, 0.2, 0);

    // 3. Renderer with soft PCF shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 4. Lighting - Soft natural architectural studio sun
    const ambientLight = new THREE.AmbientLight(0xFFFAF2, 1.25);
    scene.add(ambientLight);

    // Key sunlight casting long soft shadows to the back-right (matching reference image)
    const sunLight = new THREE.DirectionalLight(0xFFF6E8, 2.2);
    sunLight.position.set(9, 14, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Warm soft fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xF0EAE1, 0.6);
    fillLight.position.set(-8, 5, -6);
    scene.add(fillLight);

    // Interior pavilion warm point light
    const interiorLight = new THREE.PointLight(0xFFB366, 1.6, 4.5);
    interiorLight.position.set(0, 0.55, 0.1);
    scene.add(interiorLight);

    // 5. Floor shadow receiver plane (pure white canvas catching warm soft shadows)
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({
      opacity: 0.16,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.32;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Main Group for diorama containing all platform objects
    const dioramaGroup = new THREE.Group();
    scene.add(dioramaGroup);

    // ==========================================
    // 6. PROCEDURAL GEOMETRY: The Sliced Earth Platform
    // ==========================================
    const platformSize = 3.6;
    const platformHeight = 0.35;

    // A. Subterranean Earth / Stratum Base (Dark soil with layered cross-section)
    const earthGeo = new THREE.BoxGeometry(platformSize, platformHeight, platformSize);
    
    // Canvas texture for subterranean geological slice
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 512;
    earthCanvas.height = 512;
    const eCtx = earthCanvas.getContext('2d');
    eCtx.fillStyle = '#2B231D'; // dark rich soil base
    eCtx.fillRect(0, 0, 512, 512);
    // Soil speckles & stratification
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * 512;
      const x = Math.random() * 512;
      eCtx.fillStyle = Math.random() > 0.5 ? '#1C1612' : '#3E342B';
      eCtx.fillRect(x, y, Math.random() * 8 + 2, Math.random() * 4 + 1);
    }
    // Subterranean layer line (terracotta sediment band)
    eCtx.fillStyle = '#B76E52';
    eCtx.fillRect(0, 240, 512, 12);
    eCtx.fillStyle = '#C5A15A';
    eCtx.fillRect(0, 310, 512, 8);

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.9,
      metalness: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.y = -platformHeight / 2;
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    dioramaGroup.add(earthMesh);

    // B. Lush Landscape Top Surface (Muted architectural grass / ground cover)
    const grassGeo = new THREE.BoxGeometry(platformSize + 0.02, 0.04, platformSize + 0.02);
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const gCtx = grassCanvas.getContext('2d');
    gCtx.fillStyle = '#4E6838'; // natural botanical sage-green
    gCtx.fillRect(0, 0, 512, 512);
    // Organic stippling
    for (let i = 0; i < 600; i++) {
      gCtx.fillStyle = Math.random() > 0.5 ? '#5A7542' : '#41572E';
      gCtx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTexture,
      roughness: 0.85,
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.y = 0.01;
    grassMesh.receiveShadow = true;
    grassMesh.castShadow = true;
    dioramaGroup.add(grassMesh);

    // ==========================================
    // 7. MODERN ARCHITECTURAL PAVILION
    // ==========================================
    const houseGroup = new THREE.Group();
    dioramaGroup.add(houseGroup);
    // Position pavilion centered towards the back half
    houseGroup.position.set(-0.1, 0.02, -0.2);

    const houseWidth = 2.4;
    const houseDepth = 1.15;
    const houseHeight = 0.82;

    // Pavilion Walls (Off-white architectural panels)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF7F6F2,
      roughness: 0.6,
      metalness: 0.05,
    });

    const houseBodyGeo = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
    const houseBody = new THREE.Mesh(houseBodyGeo, wallMat);
    houseBody.position.y = houseHeight / 2;
    houseBody.castShadow = true;
    houseBody.receiveShadow = true;
    houseGroup.add(houseBody);

    // Corrugated / Ribbed Metal Seam Roof
    const roofWidth = houseWidth + 0.22;
    const roofDepth = houseDepth + 0.22;
    const roofGeo = new THREE.BoxGeometry(roofWidth, 0.07, roofDepth);
    
    // Canvas texture for standing seam ribbed metal roof (clean zinc grey)
    const roofCanvas = document.createElement('canvas');
    roofCanvas.width = 512;
    roofCanvas.height = 512;
    const rCtx = roofCanvas.getContext('2d');
    rCtx.fillStyle = '#B4BAC1'; // zinc metal
    rCtx.fillRect(0, 0, 512, 512);
    // Standing seams
    rCtx.fillStyle = '#8F969E';
    for (let x = 0; x < 512; x += 32) {
      rCtx.fillRect(x, 0, 4, 512);
    }
    const roofTexture = new THREE.CanvasTexture(roofCanvas);
    const roofMat = new THREE.MeshStandardMaterial({
      map: roofTexture,
      roughness: 0.45,
      metalness: 0.35,
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = houseHeight + 0.035;
    // Subtle architectural shed pitch
    roofMesh.rotation.x = -0.06;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    houseGroup.add(roofMesh);

    // Windows & Timber/Terracotta Frames on the Front Facade
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xFFE0B2, // warm illuminated glass
      emissive: 0xFFAA44,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.1,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xB76E52, // Terracotta wood trim
      roughness: 0.7,
    });

    // 4 front windows along facade
    const winWidth = 0.32;
    const winHeight = 0.44;
    const winY = 0.46;
    const winZ = houseDepth / 2 + 0.01;
    const winPositions = [-0.78, -0.32, 0.22, 0.68];

    winPositions.forEach((wx, idx) => {
      // Glass pane
      const winGeo = new THREE.PlaneGeometry(winWidth, winHeight);
      const winMesh = new THREE.Mesh(winGeo, windowMat);
      winMesh.position.set(wx, winY, winZ);
      houseGroup.add(winMesh);

      // Window Frame outline
      const frameGeo = new THREE.BoxGeometry(winWidth + 0.04, winHeight + 0.04, 0.03);
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(wx, winY, winZ - 0.01);
      frameMesh.castShadow = true;
      houseGroup.add(frameMesh);
    });

    // Concrete Entry Porch
    const porchGeo = new THREE.BoxGeometry(0.55, 0.04, 0.35);
    const porchMat = new THREE.MeshStandardMaterial({ color: 0xE7E5DF, roughness: 0.8 });
    const porchMesh = new THREE.Mesh(porchGeo, porchMat);
    porchMesh.position.set(-0.32, 0.02, houseDepth / 2 + 0.18);
    porchMesh.receiveShadow = true;
    houseGroup.add(porchMesh);

    // ==========================================
    // 8. STEPPING STONE PATHWAY (The Career Roadmap Trail)
    // ==========================================
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xD8D6CE,
      roughness: 0.75,
    });

    const stepPositions = [
      { x: -0.32, z: 0.95 },
      { x: -0.28, z: 1.18 },
      { x: -0.22, z: 1.40 },
      { x: -0.15, z: 1.62 },
    ];

    stepPositions.forEach((pos, i) => {
      const stoneGeo = new THREE.BoxGeometry(0.28 - i * 0.02, 0.025, 0.16);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(pos.x, 0.02, pos.z);
      stone.rotation.y = (Math.random() - 0.5) * 0.2;
      stone.receiveShadow = true;
      stone.castShadow = true;
      dioramaGroup.add(stone);
    });

    // ==========================================
    // 9. ARCHITECTURAL HERO TREES & FOLIAGE
    // ==========================================
    // A. Hero Tree behind the house (matches reference image position and scale)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(0.18, 0, -1.05);
    dioramaGroup.add(treeGroup);

    // Wooden Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.11, 1.35, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.35 / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Canopy Clustered Foliage (Natural spherical botanical cloud)
    const foliageMat1 = new THREE.MeshStandardMaterial({
      color: 0x3E5A2A, // deep rich foliage
      roughness: 0.85,
    });
    const foliageMat2 = new THREE.MeshStandardMaterial({
      color: 0x4D6F34, // highlighted leafy foliage
      roughness: 0.8,
    });
    const foliageMat3 = new THREE.MeshStandardMaterial({
      color: 0x5C803E, // sunny canopy apex
      roughness: 0.75,
    });

    const canopyCluster = [
      { r: 0.52, x: 0, y: 1.45, z: 0, mat: foliageMat2 },
      { r: 0.44, x: -0.22, y: 1.35, z: 0.15, mat: foliageMat1 },
      { r: 0.42, x: 0.25, y: 1.38, z: -0.12, mat: foliageMat1 },
      { r: 0.38, x: 0.12, y: 1.62, z: 0.08, mat: foliageMat3 },
      { r: 0.34, x: -0.15, y: 1.58, z: -0.1, mat: foliageMat3 },
      { r: 0.32, x: 0, y: 1.76, z: 0, mat: foliageMat3 },
    ];

    canopyCluster.forEach((c) => {
      const folGeo = new THREE.DodecahedronGeometry(c.r, 2);
      const folMesh = new THREE.Mesh(folGeo, c.mat);
      folMesh.position.set(c.x, c.y, c.z);
      folMesh.castShadow = true;
      folMesh.receiveShadow = true;
      treeGroup.add(folMesh);
    });

    // B. Secondary Smaller Ornamental Shrub near the left side
    const shrubGroup = new THREE.Group();
    shrubGroup.position.set(-1.25, 0, -0.3);
    dioramaGroup.add(shrubGroup);

    const shrubTrunkGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6);
    const shrubTrunk = new THREE.Mesh(shrubTrunkGeo, trunkMat);
    shrubTrunk.position.y = 0.25;
    shrubTrunk.castShadow = true;
    shrubGroup.add(shrubTrunk);

    const sFolGeo = new THREE.DodecahedronGeometry(0.28, 1);
    const sFol = new THREE.Mesh(sFolGeo, foliageMat2);
    sFol.position.set(0, 0.55, 0);
    sFol.castShadow = true;
    shrubGroup.add(sFol);

    // C. Little Accent Bush near front edge
    const accentBushGeo = new THREE.DodecahedronGeometry(0.18, 1);
    const accentBush = new THREE.Mesh(accentBushGeo, foliageMat1);
    accentBush.position.set(-0.8, 0.08, 0.85);
    accentBush.castShadow = true;
    dioramaGroup.add(accentBush);

    // ==========================================
    // 10. INTERACTION: Smooth Drag / Orbit & Cursor Parallax
    // ==========================================
    let isDragging = false;
    let previousMouseX = 0;
    let rotationVelocity = 0;
    let targetRotationY = -0.45; // default pleasing angle showing facade and tree
    let currentRotationY = -0.45;
    let targetTiltX = 0.05;
    let currentTiltX = 0.05;

    const onMouseDown = (e) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        targetRotationY += deltaX * 0.01;
        previousMouseX = e.clientX;
      } else {
        // Subtle cursor parallax
        targetTiltX = 0.05 - normY * 0.12;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    let prevTouchX = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        prevTouchX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevTouchX;
        targetRotationY += deltaX * 0.01;
        prevTouchX = e.touches[0].clientX;
      }
    };
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    // Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 11. ANIMATION LOOP
    // ==========================================
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle auto-rotation if idle
      if (!isDragging) {
        targetRotationY += 0.0012;
      }

      // Smooth damping interpolation
      currentRotationY += (targetRotationY - currentRotationY) * 0.07;
      currentTiltX += (targetTiltX - currentTiltX) * 0.07;

      dioramaGroup.rotation.y = currentRotationY;
      dioramaGroup.rotation.x = currentTiltX;

      // Micro breathing float
      dioramaGroup.position.y = Math.sin(elapsed * 1.1) * 0.035;

      // Subtle foliage leaf vibration
      treeGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      grassGeo.dispose();
      grassMat.dispose();
      houseBodyGeo.dispose();
      wallMat.dispose();
      roofGeo.dispose();
      roofMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
    };
  }, []);

  return (
    <div className="hero-3d-wrapper" style={{ height: '540px' }}>
      <div 
        className="canvas-3d-container" 
        ref={mountRef}
        style={{ cursor: 'grab', background: '#FFFFFF', border: '1px solid var(--border-soft)' }}
      >
        {/* Floating Telemetry Badge Overlay (Physical Editorial Aesthetic) */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(6px)',
          border: '1px solid var(--border-soft)',
          padding: '8px 14px',
          borderRadius: '4px',
          pointerEvents: 'none',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <span className="label-caps" style={{ color: 'var(--accent-warm)', display: 'block', fontSize: '0.68rem' }}>
            PHYSICAL GROUNDING MODEL // ISOMETRIC 3D
          </span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            Career Foundation Pavilion
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Grounded in verified codebase evidence • 78/100
          </div>
        </div>

        {/* Tactile Controls at Bottom */}
        <div style={{
          position: 'absolute',
          bottom: '14px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <span className="mono-token" style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.88)',
            padding: '4px 8px',
            borderRadius: '3px',
            border: '1px solid var(--border-subtle)'
          }}>
            DRAG TO ROTATE 360° // STUDIO LIGHTING
          </span>

          <span className="mono-token" style={{
            fontSize: '0.7rem',
            color: 'var(--accent-sage)',
            fontWeight: 600,
            background: 'var(--accent-sage-soft)',
            padding: '4px 8px',
            borderRadius: '3px',
            border: '1px solid var(--accent-sage-border)'
          }}>
            VERIFIED TERRITORY ✓
          </span>
        </div>
      </div>
    </div>
  );
}
