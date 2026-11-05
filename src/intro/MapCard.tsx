import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries50m from "world-atlas/countries-50m.json";
import { AVU_GOLD } from "./Ecriture";
import { clamp, PLAYFAIR, SORA, soft } from "./shared";

// A map overlay on a transparent background, placed in the lower part of the
// frame under the speakers. Cards' palette: cream land, the country in AVU
// gold, each place marked (a dot for a city, a ring for a wine region);
// labels sit on the map itself. The camera
// eases in from the wider region to the country, then holds.
const TEXT = "#4A443B";
const LAND = "#F4EFE6";
const CREAM = "#FBF8F2";
export const MAP_DURATION = 3 * 30;

export type MapCardProps = {
  // ISO 3166-1 numeric code as used by Natural Earth, e.g. "710"
  countryId: string;
  countryName: string;
  // Where the country name sits ([lon, lat]); clear of enclaves and the city
  countryLabelAt: [number, number];
  // Places appear one after another. A city gets a dot, a wine region a
  // ring. The label goes to the right of the mark unless labelSide is "left".
  places: {
    name: string;
    lon: number;
    lat: number;
    kind: "city" | "region";
    labelSide?: "right" | "left";
    // Move the label away from the mark ([dx, dy] px); a thin leader line
    // joins them. For places too close together to label side by side.
    labelOffset?: [number, number];
  }[];
  // Camera: where the move starts and ends ([lon, lat] and Mercator scale)
  from: { center: [number, number]; scale: number };
  to: { center: [number, number]; scale: number };
};

const topo = countries50m as unknown as Topology<{
  countries: GeometryCollection<{ name: string }>;
}>;
const COUNTRIES = (
  feature(topo, topo.objects.countries) as FeatureCollection<
    Geometry,
    { name: string }
  >
).features;

// The camera target lands in the lower part of the frame, under the speakers
// and above the platform's caption area.
const MAP_FOCUS_Y = 1420;
// The surrounding countries fade out within this ellipse instead of ending
// in a hard edge
const FADE_RX = 660;
const FADE_RY = 420;

export const MapCard: React.FC<MapCardProps> = ({
  countryId,
  countryName,
  countryLabelAt,
  places,
  from,
  to,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Camera move: zoom eased in log space so it feels even, 0 → 1.8 s
  const t = interpolate(frame, [0, 54], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.15, 1),
  });
  const scale = Math.exp(
    Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * t,
  );
  const center: [number, number] = [
    from.center[0] + (to.center[0] - from.center[0]) * t,
    from.center[1] + (to.center[1] - from.center[1]) * t,
  ];
  const projection = geoMercator()
    .center(center)
    .scale(scale)
    .translate([width / 2, MAP_FOCUS_Y]);
  const path = geoPath(projection);

  const country = COUNTRIES.find((c) => c.id === countryId) as
    | Feature<Geometry, { name: string }>
    | undefined;
  const [kx, ky] = projection(countryLabelAt) ?? [0, 0];

  const ease = { ...clamp, easing: soft };
  const mapIn = interpolate(frame, [0, 14], [0, 1], ease);
  const countryIn = interpolate(frame, [20, 44], [0, 1], ease);
  const labelsIn = interpolate(frame, [48, 64], [0, 1], ease);

  return (
    <AbsoluteFill>
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          opacity: mapIn,
          // A soft shadow lifts the map off whatever footage is underneath
          filter: "drop-shadow(0px 8px 22px rgba(43, 38, 30, 0.28))",
        }}
      >
        <defs>
          <radialGradient
            id="map-fade"
            gradientUnits="userSpaceOnUse"
            cx={width / 2}
            cy={MAP_FOCUS_Y}
            r={FADE_RX}
            gradientTransform={`translate(${width / 2} ${MAP_FOCUS_Y}) scale(1 ${FADE_RY / FADE_RX}) translate(${-width / 2} ${-MAP_FOCUS_Y})`}
          >
            <stop offset="0.35" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="map-fade-mask" maskUnits="userSpaceOnUse">
            <rect width={width} height={height} fill="url(#map-fade)" />
          </mask>
        </defs>
        <g mask="url(#map-fade-mask)">
          {COUNTRIES.map((c) =>
            c.id === countryId ? null : (
              <path
                key={String(c.id) + c.properties.name}
                d={path(c) ?? ""}
                fill={LAND}
                fillOpacity={0.55}
                stroke={TEXT}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
            ),
          )}
        </g>

        {/* The country itself stays solid: only its neighbours fade out */}
        {country ? (
          <>
            <path
              d={path(country) ?? ""}
              fill={LAND}
              stroke={TEXT}
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            <path
              d={path(country) ?? ""}
              fill={AVU_GOLD}
              fillOpacity={countryIn}
              stroke={AVU_GOLD}
              strokeWidth={1.5}
              strokeOpacity={countryIn}
            />
          </>
        ) : null}

        <text
          x={kx}
          y={ky}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={SORA}
          fontSize={26}
          letterSpacing="0.42em"
          fill={CREAM}
          opacity={labelsIn}
        >
          {countryName.toUpperCase()}
        </text>

        {places.map((place, i) => {
          // Each place lands 8 frames after the previous one
          const at = 42 + i * 8;
          const [px, py] = projection([place.lon, place.lat]) ?? [0, 0];
          const markIn = interpolate(frame, [at, at + 10], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.back(2)),
          });
          const pulse = interpolate(frame, [at + 6, at + 40], [0, 1], clamp);
          const textIn = interpolate(frame, [at + 6, at + 20], [0, 1], ease);
          const left = place.labelSide === "left";
          const markR = place.kind === "city" ? 10 : 15;
          const [ox, oy] = place.labelOffset ?? [
            (left ? -1 : 1) * (markR + 12),
            0,
          ];
          const dist = Math.hypot(ox, oy);
          const leader = dist > markR + 30;
          return (
            <g key={place.name}>
              <circle
                cx={px}
                cy={py}
                r={markR + pulse * 34}
                fill="none"
                stroke={CREAM}
                strokeWidth={2}
                opacity={(1 - pulse) * 0.9 * (pulse > 0 ? 1 : 0)}
              />
              {place.kind === "city" ? (
                <>
                  <circle
                    cx={px}
                    cy={py}
                    r={markR * markIn}
                    fill={CREAM}
                    stroke={TEXT}
                    strokeWidth={2.5}
                  />
                  <circle cx={px} cy={py} r={4 * markIn} fill={TEXT} />
                </>
              ) : (
                <>
                  <circle
                    cx={px}
                    cy={py}
                    r={markR * markIn}
                    fill={CREAM}
                    fillOpacity={0.22}
                    stroke={CREAM}
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                  />
                  <circle cx={px} cy={py} r={3.5 * markIn} fill={CREAM} />
                </>
              )}
              {leader ? (
                <line
                  x1={px + (ox / dist) * (markR + 4)}
                  y1={py + (oy / dist) * (markR + 4)}
                  x2={px + ox - (left ? -8 : 8)}
                  y2={py + oy}
                  stroke={CREAM}
                  strokeWidth={1.5}
                  opacity={textIn}
                />
              ) : null}
              <text
                x={px + ox}
                y={py + oy}
                textAnchor={left ? "end" : "start"}
                dominantBaseline="middle"
                fontFamily={PLAYFAIR}
                fontStyle="italic"
                fontSize={44}
                fill={CREAM}
                opacity={textIn}
              >
                {place.name}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
