"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

export function ARScene() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      40
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const geometry = new THREE.PlaneGeometry(1, 0.5);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    const placa = new THREE.Mesh(geometry, material);
    placa.position.set(0, 1, -2);
    scene.add(placa);

    document.body.appendChild(ARButton.createButton(renderer));

    function animate() {
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    }

    animate();
  }, []);

  return <></>;
}
