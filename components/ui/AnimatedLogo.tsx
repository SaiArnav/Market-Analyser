'use client';

/**
 * AnimatedLogo — Premium SVG logo for MarketAutopsy navbar.
 *
 * Recreates the brand logo (brain neural-network + "MarketAutopsy" wordmark)
 * as a pure SVG with Framer Motion animations.
 *
 * Animation sequence:
 *   0.00 – 1.20s  Brain outline draws in (pathLength 0 → 1)
 *   0.55 – 1.40s  Neural connections illuminate progressively
 *   0.80 – 1.50s  Nodes spring into existence
 *   1.10 – 1.55s  "AI" text fades in with blue glow
 *   1.15 – 1.75s  "MarketAutopsy" slides in from right
 *   1.45 – 1.95s  "AI Intelligence" subtitle fades in
 *
 * Post-intro ambient:
 *   - Soft breathing glow ellipse behind brain (loops)
 *   - Sparkle rings on 3 nodes (staggered repeating pulses)
 *   - Nodes softly breathe/pulse at staggered intervals
 *   - Tiny particles randomly flow along a few neural connections
 *
 * Hover:
 *   - scale 1.03 + soft blue drop-shadow (300 ms ease-out)
 *
 * Accessibility:
 *   - Respects prefers-reduced-motion (animations skipped)
 *   - aria-label on the Link, aria-hidden on SVG
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ─── Brain path (60 × 60 local space) ───────────────────────────────────── */
const BRAIN_PATH =
  'M 30 4 C 35 4 43 7 47 14 C 52 12 58 15 58 23 C 58 28 55 33 51 35 ' +
  'C 54 38 56 43 54 47 C 52 52 47 54 43 52 C 42 55 38 57 34 56 ' +
  'C 32 58 28 58 26 56 C 22 57 18 55 17 52 C 13 54 8 52 6 47 ' +
  'C 4 43 6 38 9 35 C 5 33 2 28 2 23 C 2 15 8 12 13 14 ' +
  'C 17 7 25 4 30 4 Z';

/* Brain fold / sulcus lines for anatomical fidelity */
const SULCI = [
  'M 29 7 Q 25 14 22 20',
  'M 36 14 Q 42 20 43 28',
  'M 15 30 Q 20 38 22 44',
];

/* ─── Neural network ─────────────────────────────────────────────────────── */
const NODES = [
  { x: 18, y: 15 }, // 0 – top-left
  { x: 30, y: 11 }, // 1 – top-center
  { x: 42, y: 15 }, // 2 – top-right
  { x: 50, y: 27 }, // 3 – right
  { x: 44, y: 42 }, // 4 – bottom-right
  { x: 34, y: 50 }, // 5 – bottom-center-right
  { x: 26, y: 50 }, // 6 – bottom-center-left
  { x: 16, y: 42 }, // 7 – bottom-left
  { x: 10, y: 27 }, // 8 – left
  { x: 24, y: 29 }, // 9 – inner-left
  { x: 38, y: 29 }, // 10 – inner-right
  { x: 30, y: 37 }, // 11 – center
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [5, 6], [6, 7], [7, 8], [8, 0],
  [0, 9], [1, 9], [2, 10], [3, 10],
  [9, 10], [9, 11], [10, 11], [6, 9], [5, 10],
];

/* Connections that particles travel on post-intro */
const PARTICLE_PATHS = [
  { from: 0, to: 1, delay: 0, duration: 1.6 },
  { from: 1, to: 2, delay: 1.4, duration: 1.6 },
  { from: 2, to: 3, delay: 2.8, duration: 1.7 },
  { from: 9, to: 11, delay: 0.8, duration: 1.3 },
  { from: 10, to: 11, delay: 2.2, duration: 1.3 },
  { from: 11, to: 5, delay: 3.5, duration: 1.5 },
];

function linePath(a: number, b: number) {
  return `M ${NODES[a].x} ${NODES[a].y} L ${NODES[b].x} ${NODES[b].y}`;
}

/* ─── Variant factories (per-element delays) ──────────────────────────────── */
function connVars(i: number) {
  return {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity: 0.38,
      transition: { duration: 0.45, delay: 0.55 + i * 0.048, ease: 'easeOut' as const },
    },
  };
}

function nodeVars(i: number) {
  return {
    hidden: { scale: 0, opacity: 0 },
    show: {
      scale: 1,
      opacity: 0.88,
      transition: {
        type: 'spring' as const,
        stiffness: 290,
        damping: 18,
        delay: 0.8 + i * 0.055,
      },
    },
  };
}

/* ─── Nodes that receive sparkle ring pulses ──────────────────────────────── */
const SPARKLE_IDX = [1, 5, 9] as const;

/* ─── Component ──────────────────────────────────────────────────────────── */
export function AnimatedLogo() {
  const [isIntroDone, setIsIntroDone] = useState(false);
  const reduced = useReducedMotion();
  const ini = reduced ? 'show' : 'hidden';

  useEffect(() => {
    if (reduced) {
      setIsIntroDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsIntroDone(true);
    }, 2000); // Wait for the 1.5–2s intro sequence to finish
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <Link
      href="/"
      aria-label="MarketAutopsy – AI Intelligence Platform"
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <motion.div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          filter: 'drop-shadow(0 0 0px rgba(79,140,255,0))',
          willChange: 'transform, filter',
          cursor: 'pointer',
        }}
        whileHover={
          reduced
            ? {}
            : {
                scale: 1.03,
                filter: 'drop-shadow(0 0 14px rgba(79,140,255,0.45))',
              }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <svg
          viewBox="0 0 248 60"
          aria-hidden="true"
          focusable="false"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: 'clamp(148px, 13vw, 192px)',
            height: 'clamp(35px, 3.2vw, 45px)',
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Soft node halo */}
            <filter id="logo-node-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Brain outline halo */}
            <filter id="logo-brain-glow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* "AI" text glow */}
            <filter id="logo-ai-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Ambient breathing glow (post-intro, loops) ──────────────── */}
          {!reduced && (
            <motion.ellipse
              cx="30"
              cy="30"
              rx="26"
              ry="26"
              fill="rgba(79,140,255,0.07)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0.4, 0.85, 0] }}
              transition={{
                duration: 4,
                delay: 2.2,
                repeat: Infinity,
                repeatDelay: 2.5,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* ── Brain outline (draws in) ──────────────────────────────────── */}
          <motion.path
            d={BRAIN_PATH}
            stroke="#4f8cff"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#logo-brain-glow)"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              show: {
                pathLength: 1,
                opacity: 0.92,
                transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            initial={ini}
            animate="show"
          />

          {/* ── Sulci / brain folds ───────────────────────────────────────── */}
          {SULCI.map((d, i) => (
            <motion.path
              key={`sulcus-${i}`}
              d={d}
              stroke="#4f8cff"
              strokeWidth="0.9"
              strokeLinecap="round"
              initial={reduced ? { opacity: 0.22 } : { opacity: 0 }}
              animate={{ opacity: 0.22 }}
              transition={{ delay: 1.0 + i * 0.09, duration: 0.4 }}
            />
          ))}

          {/* ── Neural connections (progressively light up) ───────────────── */}
          {CONNECTIONS.map(([a, b], i) => (
            <motion.path
              key={`conn-${i}`}
              d={linePath(a, b)}
              stroke="#4f8cff"
              strokeWidth="0.65"
              strokeLinecap="round"
              variants={connVars(i)}
              initial={ini}
              animate="show"
            />
          ))}

          {/* ── Neural connections particles (flow after intro is done) ───── */}
          {isIntroDone && !reduced && PARTICLE_PATHS.map((p, idx) => {
            const fromNode = NODES[p.from];
            const toNode = NODES[p.to];
            return (
              <motion.circle
                key={`particle-${idx}`}
                cx={fromNode.x}
                cy={fromNode.y}
                r="1.1"
                fill="#93c5fd"
                filter="url(#logo-node-glow)"
                animate={{
                  cx: [fromNode.x, toNode.x],
                  cy: [fromNode.y, toNode.y],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  repeatDelay: 5,
                  ease: "easeInOut"
                }}
              />
            );
          })}

          {/* ── Nodes (spring into existence, then softly pulse) ──────────── */}
          {NODES.map((n, i) => (
            <motion.circle
              key={`node-${i}`}
              cx={n.x}
              cy={n.y}
              r="2.3"
              fill="#4f8cff"
              filter="url(#logo-node-glow)"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              variants={nodeVars(i)}
              initial={ini}
              animate={isIntroDone && !reduced ? {
                scale: [1, 1.22, 1],
                opacity: [0.8, 1.0, 0.8]
              } : "show"}
              transition={isIntroDone && !reduced ? {
                duration: 3,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut"
              } : undefined}
            />
          ))}

          {/* ── Ambient sparkle rings on select nodes (loops every ~7–12 s) ─ */}
          {!reduced &&
            SPARKLE_IDX.map((ni, rank) => (
              <motion.circle
                key={`sparkle-${ni}`}
                cx={NODES[ni].x}
                cy={NODES[ni].y}
                r={3}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                initial={{ r: 3, opacity: 0 }}
                animate={{
                  r: [3, 11, 3],
                  opacity: [0, 0.55, 0],
                  strokeWidth: [1.2, 0.2, 1.2],
                }}
                transition={{
                  duration: 1.8,
                  delay: 2.8 + rank * 2.4,
                  repeat: Infinity,
                  repeatDelay: 6 + rank * 2,
                  ease: 'easeOut',
                }}
              />
            ))}

          {/* ── "AI" label inside brain ───────────────────────────────────── */}
          <motion.text
            x="30"
            y="32"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#60a5fa"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="Manrope, sans-serif"
            filter="url(#logo-ai-glow)"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            variants={{
              hidden: { opacity: 0, scale: 0.5 },
              show: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.45, delay: 1.1, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            initial={ini}
            animate="show"
          >
            AI
          </motion.text>

          {/* ── Vertical separator ────────────────────────────────────────── */}
          <motion.line
            x1="65"
            y1="14"
            x2="65"
            y2="46"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            initial={reduced ? { opacity: 0.6 } : { opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.05, duration: 0.35 }}
          />

          {/* ── Wordmark + subtitle (slide in together) ───────────────────── */}
          <motion.g
            variants={{
              hidden: { opacity: 0, x: 10 },
              show: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.6, delay: 1.15, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            initial={ini}
            animate="show"
          >
            {/* "MarketAutopsy" */}
            <text
              x="72"
              y="27"
              fill="#f0f0f5"
              fontSize="19"
              fontWeight="800"
              fontFamily="Manrope, sans-serif"
              letterSpacing="-0.04em"
            >
              MarketAutopsy
            </text>

            {/* "AI Intelligence" subtitle */}
            <motion.text
              x="72"
              y="42"
              fill="rgba(240,240,245,0.5)"
              fontSize="10.5"
              fontWeight="500"
              fontFamily="Inter, sans-serif"
              letterSpacing="0.03em"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 0.5, transition: { duration: 0.5, delay: 1.45 } },
              }}
              initial={ini}
              animate="show"
            >
              AI Intelligence
            </motion.text>
          </motion.g>
        </svg>
      </motion.div>
    </Link>
  );
}
