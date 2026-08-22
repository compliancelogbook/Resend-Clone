/**
 * Reference-locked hero interaction: loads the recovered Resend Spline scene
 * in a fixed hero footprint, then rotates its cube pivot only. Pointer movement
 * never changes translation, preserving the visual's stable reference position.
 */
import Spline from "@splinetool/react-spline";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

const SCENE_URL = "/manus-storage/resend-reference-cube_13a0743b.splinecode";
const FALLBACK_URL = "/manus-storage/resend-clone-hero-object_8f7bed89.png";

type Rotation = { x: number; y: number; z: number };
type SplineNode = { name?: string; type?: string; rotation?: Rotation };
type SplineApplication = { getAllObjects: () => SplineNode[] };

export default function HeroCube3D() {
  const pivotRef = useRef<SplineNode | null>(null);
  const rotationRef = useRef<Rotation>({ x: 0, y: 0, z: 0 });
  const dragRef = useRef({ pointerId: -1, startX: 0, startY: 0, startRotation: { x: 0, y: 0, z: 0 } });
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  function onLoad(application: unknown) {
    const app = application as SplineApplication;
    const objects = app.getAllObjects();
    const cube = objects.find((object) => /cube|rubik|block/i.test(object.name ?? ""))
      ?? objects.find((object) => /group/i.test(object.type ?? "") && object.rotation)
      ?? objects.find((object) => object.rotation && /mesh|shape/i.test(object.type ?? ""))
      ?? objects.find((object) => object.rotation);

    if (cube?.rotation) {
      pivotRef.current = cube;
      rotationRef.current = { x: cube.rotation.x, y: cube.rotation.y, z: cube.rotation.z };
    }
    setLoaded(true);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!pivotRef.current?.rotation) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: { ...rotationRef.current },
    };
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== dragRef.current.pointerId || !pivotRef.current?.rotation) return;
    const width = Math.max(event.currentTarget.clientWidth, 1);
    const height = Math.max(event.currentTarget.clientHeight, 1);
    const yaw = ((event.clientX - dragRef.current.startX) / width) * Math.PI * 2.5;
    const pitch = ((event.clientY - dragRef.current.startY) / height) * Math.PI * 1.6;
    const next = {
      x: Math.max(-1.18, Math.min(1.18, dragRef.current.startRotation.x - pitch)),
      y: dragRef.current.startRotation.y + yaw,
      z: dragRef.current.startRotation.z,
    };
    pivotRef.current.rotation.x = next.x;
    pivotRef.current.rotation.y = next.y;
    pivotRef.current.rotation.z = next.z;
    rotationRef.current = next;
  }

  function releasePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== dragRef.current.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current.pointerId = -1;
    setDragging(false);
  }

  return (
    <div
      className={`spline-hero ${loaded ? "is-loaded" : ""} ${dragging ? "is-dragging" : ""}`}
      data-spline-ready={loaded ? "true" : "false"}
      data-spline-pivot={pivotRef.current ? "true" : "false"}
      aria-label="Interactive 3D cube. Drag to rotate."
      role="img"
      onPointerDownCapture={onPointerDown}
      onPointerMoveCapture={onPointerMove}
      onPointerUpCapture={releasePointer}
      onPointerCancelCapture={releasePointer}
    >
      <AnimatePresence>
        {!loaded && (
          <motion.img
            className="spline-fallback"
            src={FALLBACK_URL}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>
      <Spline scene={SCENE_URL} onLoad={onLoad} renderOnDemand={false} />
      <span className="spline-drag-hint" aria-hidden="true">Drag to rotate</span>
    </div>
  );
}
