import type React from "react";
import { useId } from "react";
import { interpolate } from "remotion";
import { AVU, AVU_GOLD_STOPS } from "../../theme/avu";
import { AVU_LOGO_PARTS, AVU_LOGO_VIEWBOX as VB } from "./logoPaths";

export type AvuLogoProps = {
  /** 0–1: the mark's outline is drawn as a glowing line. */
  readonly drawProgress?: number;
  /** 0–1: the mark fills with gold. */
  readonly fillProgress?: number;
  /** Opacity of the outline (fade it out once the fill is in). */
  readonly strokeOpacity?: number;
  /** 0–1: soft left-to-right wipe revealing "AVU". */
  readonly wordmarkProgress?: number;
  /** 0–1: "LUXURY WINES" opens from the centre outwards. */
  readonly taglineProgress?: number;
  /** 0–1: a diagonal light sweep across the whole logo (0 or 1 = hidden). */
  readonly sheenProgress?: number;
  readonly style?: React.CSSProperties;
};

/**
 * The AVU Luxury Wines logo as animatable SVG. With all progress values at
 * 1 (the defaults) it renders the static logo. The logo's proportions and
 * shapes are never altered, only revealed.
 */
export const AvuLogo: React.FC<AvuLogoProps> = ({
  drawProgress = 1,
  fillProgress = 1,
  strokeOpacity = 0,
  wordmarkProgress = 1,
  taglineProgress = 1,
  sheenProgress = 0,
  style,
}) => {
  // Unique ids so several logos can render on the same frame.
  const id = useId().replace(/:/g, "");
  const { mark, wordmark, tagline } = AVU_LOGO_PARTS;

  // Soft wipe edge (in logo pixels) travelling across the wordmark (x 421–1581).
  const wipeEdge = 180;
  const wipeX = interpolate(wordmarkProgress, [0, 1], [421 - wipeEdge, 1600]);
  // Tagline opens symmetrically around its centre (x ≈ 1000).
  const tagHalf = taglineProgress * 1000;
  // Light band travelling from left to right.
  const sheenX = interpolate(sheenProgress, [0, 1], [-500, 2500]);
  const showSheen = sheenProgress > 0 && sheenProgress < 1;

  return (
    <svg
      viewBox={`${VB.x} ${VB.y} ${VB.width} ${VB.height}`}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1={0} y1={0} x2={1} y2={1}>
          {AVU_GOLD_STOPS.map((stop) => (
            <stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>
        <linearGradient
          id={`${id}-wipe`}
          gradientUnits="userSpaceOnUse"
          x1={wipeX}
          y1={0}
          x2={wipeX + wipeEdge}
          y2={0}
        >
          <stop offset={0} stopColor="white" />
          <stop offset={1} stopColor="black" />
        </linearGradient>
        <mask
          id={`${id}-wordmark-mask`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={2000}
          height={1900}
        >
          <rect
            x={0}
            y={0}
            width={2000}
            height={1900}
            fill={`url(#${id}-wipe)`}
          />
        </mask>
        <clipPath id={`${id}-tagline-clip`}>
          <rect
            x={1000 - tagHalf - 20}
            y={1700}
            width={tagHalf * 2 + 40}
            height={200}
          />
        </clipPath>
        <linearGradient
          id={`${id}-sheen`}
          gradientUnits="userSpaceOnUse"
          x1={sheenX - 280}
          y1={0}
          x2={sheenX + 280}
          y2={0}
          gradientTransform="rotate(18 1000 944)"
        >
          <stop offset={0} stopColor={AVU.highlight} stopOpacity={0} />
          <stop offset={0.5} stopColor={AVU.highlight} stopOpacity={0.7} />
          <stop offset={1} stopColor={AVU.highlight} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-logo-clip`}>
          <path
            transform={`translate(0 ${mark.y})`}
            d={mark.d}
            clipRule="evenodd"
          />
          <path
            transform={`translate(0 ${wordmark.y})`}
            d={wordmark.d}
            clipRule="evenodd"
          />
          <path
            transform={`translate(0 ${tagline.y})`}
            d={tagline.d}
            clipRule="evenodd"
          />
        </clipPath>
      </defs>

      {/* Mark: gold fill + glowing outline drawn along the path. */}
      <path
        transform={`translate(0 ${mark.y})`}
        d={mark.d}
        fill={`url(#${id}-gold)`}
        fillOpacity={fillProgress}
      />
      <path
        transform={`translate(0 ${mark.y})`}
        d={mark.d}
        fill="none"
        stroke={AVU.champagne}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - drawProgress}
        strokeOpacity={strokeOpacity}
        style={{ filter: "drop-shadow(0 0 10px rgba(228, 210, 160, 0.9))" }}
      />

      {/* "AVU": soft wipe with a slight rise. */}
      <g
        mask={`url(#${id}-wordmark-mask)`}
        transform={`translate(0 ${(1 - wordmarkProgress) * 24})`}
      >
        <path
          transform={`translate(0 ${wordmark.y})`}
          d={wordmark.d}
          fill={`url(#${id}-gold)`}
          fillRule="evenodd"
        />
      </g>

      {/* "LUXURY WINES": opens from the centre. */}
      <g clipPath={`url(#${id}-tagline-clip)`} opacity={taglineProgress}>
        <path
          transform={`translate(0 ${tagline.y})`}
          d={tagline.d}
          fill={`url(#${id}-gold)`}
          fillRule="evenodd"
        />
      </g>

      {/* Light sweep, clipped to the logo shapes. */}
      {showSheen ? (
        <g clipPath={`url(#${id}-logo-clip)`}>
          <rect
            x={0}
            y={0}
            width={2000}
            height={1900}
            fill={`url(#${id}-sheen)`}
          />
        </g>
      ) : null}
    </svg>
  );
};
