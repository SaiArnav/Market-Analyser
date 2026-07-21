'use client';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function BrainAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.5, 4);
    const material = new THREE.MeshPhongMaterial({
      color: 0x007aff,
      wireframe: true,
      emissive: 0x007aff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const brain = new THREE.Mesh(geometry, material);
    scene.add(brain);

    const innerGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x007aff, transparent: true, opacity: 0.2 });
    const innerBrain = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerBrain);

    const particlesCount = 40;
    const particles = new THREE.Group();
    scene.add(particles);

    for (let i = 0; i < particlesCount; i++) {
      const pGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0x00ff88 : 0xffaa00 });
      const p = new THREE.Mesh(pGeo, pMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      p.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 2, Math.sin(angle) * radius);
      (p as any).userData = { angle, radius, speed: 0.01 + Math.random() * 0.02 };
      particles.add(p);
    }

    const light = new THREE.PointLight(0x007aff, 2, 10);
    light.position.set(0, 0, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 5;

    function animate() {
      requestAnimationFrame(animate);

      brain.rotation.y += 0.005;
      brain.rotation.x += 0.003;

      const sc = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      innerBrain.scale.setScalar(sc);

      particles.children.forEach((p) => {
        const ud = (p as any).userData;
        ud.angle += ud.speed;
        p.position.x = Math.cos(ud.angle) * ud.radius;
        p.position.z = Math.sin(ud.angle) * ud.radius;
        p.position.y += Math.sin(Date.now() * 0.001 + ud.angle) * 0.01;
      });

      renderer.render(scene, camera);
    }

    animate();

    function onResize() {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
