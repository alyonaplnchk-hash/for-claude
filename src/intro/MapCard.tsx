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
import {
  clamp,
  Grain,
  PLAYFAIR,
  SORA,
  soft,
  StorePhoto,
  Vignette,
} from "./shared";

// A short map insert in the cards' palette: cream land, the country in AVU
// gold, the city marked with a gold dot. The camera eases in from the wider
// region to the country, then holds.
const TEXT = "#4A443B";
const LAND = "#F4EFE6";
const CREAM = "#FBF8F2";
export const MAP_DURATION = 3 * 30;

export type MapCardProps = {
  label: string;
  // ISO 3166-1 numeric code as used by Natural Earth, e.g. "710"
  countryId: string;
  countryName: string;
  city: { name: string; lon: number; lat: number };
  // Camera: where the move starts and ends ([lon, lat] and Mercator scale)
  from: { center: [number, number]; scale: number };
  to: { center: [number, number]; scale: number };
  photo: string;
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

// Where the camera target lands on screen: above the caption
const MAP_FOCUS_Y = 960;
// The map dissolves into the backdrop instead of ending in a hard edge
const MAP_MASK =
  "radial-gradient(ellipse 64% 30% at 50% 50%, #000 60%, transparent 100%)";

export const MapCard: React.FC<MapCardProps> = ({
  label,
  countryId,
  countryName,
  city,
  from,
  to,
  photo,
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
  const [cx, cy] = projection([city.lon, city.lat]) ?? [0, 0];

  const ease = { ...clamp, easing: soft };
  const mapIn = interpolate(frame, [0, 14], [0, 1], ease);
  const countryIn = interpolate(frame, [20, 44], [0, 1], ease);
  const dotIn = interpolate(frame, [42, 52], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(2)),
  });
  const ring = interpolate(frame, [48, 84], [0, 1], clamp);
  const labelsIn = interpolate(frame, [48, 64], [0, 1], ease);

  return (
    <AbsoluteFill style={{ backgroundColor: "#EEE8DD" }}>
      <StorePhoto
        src={photo}
        durationInFrames={MAP_DURATION}
        blurTo={11}
        blurFrom={[-1, 0]}
        tone="saturate(0.72) sepia(0.12) brightness(0.95)"
      />
      <AbsoluteFill style={{ backgroundColor: "#EFE9DE", opacity: 0.55 }} />
      <Vignette color="#B7AA94" strength={0.35} />

      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          opacity: mapIn,
          maskImage: MAP_MASK,
          WebkitMaskImage: MAP_MASK,
        }}
      >
        {COUNTRIES.map((c) =>
          c.id === countryId ? null : (
            <path
              key={String(c.id) + c.properties.name}
              d={path(c) ?? ""}
              fill={LAND}
              fillOpacity={0.7}
              stroke={TEXT}
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          ),
        )}
        {country ? (
          <>
            <path
              d={path(country) ?? ""}
              fill={LAND}
              stroke={TEXT}
              strokeOpacity={0.22}
              strokeWidth={1}
            />
            <path
              d={path(country) ?? ""}
              fill={AVU_GOLD}
              fillOpacity={0.82 * countryIn}
              stroke={AVU_GOLD}
              strokeWidth={1.5}
              strokeOpacity={countryIn}
            />
          </>
        ) : null}

        {/* City: a pulse ring, then the dot */}
        <circle
          cx={cx}
          cy={cy}
          r={14 + ring * 46}
          fill="none"
          stroke={AVU_GOLD}
          strokeWidth={2}
          opacity={(1 - ring) * 0.8 * (ring > 0 ? 1 : 0)}
        />
        <circle
          cx={cx}
          cy={cy}
          r={13 * dotIn}
          fill={CREAM}
          stroke={TEXT}
          strokeWidth={3}
        />
        <circle cx={cx} cy={cy} r={6 * dotIn} fill={TEXT} />
      </svg>

      <Grain opacity={0.11} />

      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "flex-end" }}
      >
        <div
          style={{
            marginBottom: 470,
            textAlign: "center",
            opacity: labelsIn,
            translate: `0px ${(1 - labelsIn) * 12}px`,
          }}
        >
          <div
            style={{
              fontFamily: PLAYFAIR,
              fontStyle: "italic",
              fontSize: 76,
              color: TEXT,
            }}
          >
            {city.name}
          </div>
          <div
            style={{
              fontFamily: SORA,
              fontSize: 28,
              letterSpacing: "0.5em",
              paddingLeft: "0.5em",
              color: AVU_GOLD,
              marginTop: 18,
            }}
          >
            {countryName.toUpperCase()}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div
          style={{
            marginTop: 300,
            fontFamily: SORA,
            fontSize: 26,
            letterSpacing: "0.5em",
            paddingLeft: "0.5em",
            color: AVU_GOLD,
            opacity: interpolate(frame, [0, 12], [0, 1], ease),
          }}
        >
          {label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
