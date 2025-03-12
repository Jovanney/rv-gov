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
      20
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const reticleMaterial = new THREE.MeshBasicMaterial();
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const loadModel = (position: THREE.Vector3) => {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      scene.add(mesh);
    };

    const onSelect = () => {
      if (reticle.visible) {
        const position = new THREE.Vector3();
        reticle.getWorldPosition(position);
        loadModel(position);
      }
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );

    let hitTestSource: XRHitTestSource | null = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let localReferenceSpace: XRReferenceSpace | null = null;

    const onSessionStart = async (session: XRSession) => {
      session.addEventListener("end", onSessionEnd);
      localReferenceSpace = await session.requestReferenceSpace("local");
      const viewerSpace = await session.requestReferenceSpace("viewer");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hitTestSource = await (session as any).requestHitTestSource({
        space: viewerSpace,
      });
    };

    // Função para encerrar a sessão de AR
    const onSessionEnd = () => {
      hitTestSource = null;
      localReferenceSpace = null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer.xr.addEventListener("sessionstart", (event: any) => {
      onSessionStart(event.session);
    });
    renderer.xr.addEventListener("sessionend", onSessionEnd);

    const animate = () => {
      renderer.setAnimationLoop(
        (timestamp: DOMHighResTimeStamp, frame: XRFrame) => {
          if (frame) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hitTestResults = (frame as any).getHitTestResults(
              hitTestSource
            );

            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            } else {
              reticle.visible = false;
            }
          }
          renderer.render(scene, camera);
        }
      );
    };

    animate();
  }, []);

  return null;
}
