# Hero 3D Reference Evidence

## Public Runtime Findings

The reference hero loads three related first-party public assets: `https://resend.com/static/cube.splinecode`, `https://resend.com/static/cube-fallback.jpg`, and `https://resend.com/static/cube.mp4`. The rendered hero contains a `canvas` in a right-side wrapper with the `relative animate-webgl-scale-in-fade` class. At the inspected desktop viewport, that canvas measured approximately `638 × 550px` and occupied the right half of the hero. These signals confirm that the original object is a Spline scene rendered as live WebGL, with fallbacks for environments where it cannot render.

## Implementation Decision

The local page will replace its static generated hero object with a compact Three.js / React Three Fiber reconstruction rather than depend on an opaque third-party embedded scene. It will preserve the reference layout: fixed right-side visual footprint, softly lit near-black modular cube, drag-to-orbit rotation around a stable centre, constrained polar angle and damping, cursor feedback, and a static fallback for small or unavailable WebGL contexts.

## Local Runtime Check

The self-hosted Spline scene loads successfully into a `742 × 630px` hero canvas at the inspected desktop size, retaining the fixed right-side hero footprint. The loaded component reports a live rotatable pivot and one active canvas. Browser-scripted pointer events do not acquire a trusted pointer capture, so they cannot prove the full held-drag sequence; this is a browser automation restriction rather than a runtime error. The implementation uses native pointer capture and `touch-action: none`, so normal mouse and touch drags control rotation while the hero wrapper’s position remains fixed.

Desktop and mobile preview captures confirm that the Spline scene replaces the old flat hero image and remains inside the intended right-side composition. The production build completed successfully. The browser’s visual capture channel did not return an image during the final post-build navigation, but the project preview capture confirmed the rendered scene immediately before that check.

## Live Reference Geometry

At a `1280 × 1100px` browser viewport, the live Resend hero section measured `1270 × 950px` beginning at `y=58px`. Its Spline canvas measured `638 × 550px`, with its top at `y=218px` and left at `x=608px`. The canvas therefore began about `160px` into the hero (roughly 17% of its height) and occupied the right half with an approximately `1.16:1` footprint. The local correction is calibrated against those values and the user-provided 2048px reference captures.

The comparison identified the actual positioning defect: the local cube wrapper was a Framer Motion element, whose generated `transform` overrode the stylesheet's `translateY(-50%)`. Its measured top was `y=442px`, versus the live reference canvas at `y=218px`. The correction moves vertical centring to the independent CSS `translate` property, which composes with Framer Motion transforms, and restores the live reference canvas footprint of approximately `638 × 550px` at the measured viewport.

After the vertical correction, the local canvas measured `638 × 550px` at `y=218px`, matching the live reference exactly. Its left edge was `x=592px`, 16px left of the live reference's `x=608px`, so the final horizontal adjustment reduces the right inset by 16px to align the canvas edge as well.

## Sources

- [Resend homepage](https://resend.com/)
- [Public Spline scene asset](https://resend.com/static/cube.splinecode)
