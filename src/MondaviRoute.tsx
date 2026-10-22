import { loadFont } from "@remotion/fonts";
import {
  geoNaturalEarth1,
  geoGraticule10,
  geoInterpolate,
  geoPath,
} from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-50m.json";
import statesTopo from "us-atlas/states-10m.json";

const FONT = "Cormorant Garamond";
loadFont({
  family: FONT,
  url: staticFile("fonts/cormorant-garamond-latin-500-normal.woff2"),
  weight: "500",
});
loadFont({
  family: FONT,
  url: staticFile("fonts/cormorant-garamond-latin-600-normal.woff2"),
  weight: "600",
});

const COLORS = {
  ocean: "#ECE5D8",
  oceanEdge: "#D9CFBD",
  land: "#D3C6AE",
  border: "#BFAF93",
  coast: "#B5A385",
  graticule: "#D8CEBD",
  highlight: "#7B2D3A",
  route: "#8A6438",
  plane: "#3A2C24",
  text: "#2F2520",
};

// Napa Valley (departure) and Bordeaux (arrival), [lon, lat].
const ORIGIN: [number, number] = [-122.29, 38.3];
const BORDEAUX: [number, number] = [-0.5792, 44.8378];

// Plane silhouette (Material "flight" glyph, pointing north in a 24×24 box).
const PLANE_PATH =
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";

const ROUTE_SAMPLES = 240;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const soft = Easing.bezier(0.33, 0, 0.2, 1);

type Pt = [number, number];

const useGeography = (width: number, height: number) => {
  return useMemo(() => {
    const world = worldTopo as unknown as Topology<{
      countries: GeometryCollection;
      land: GeometryCollection;
    }>;
    const states = statesTopo as unknown as Topology<{
      states: GeometryCollection<{ name: string }>;
    }>;

    const land = feature(world, world.objects.land);
    const borders = mesh(world, world.objects.countries, (a, b) => a !== b);
    const california = (
      feature(states, states.objects.states) as FeatureCollection<
        Geometry,
        { name: string }
      >
    ).features.find((f) => f.properties.name === "California");

    // North-up Natural Earth projection centred on the Atlantic: both
    // continents keep a familiar shape and the great-circle route arcs north.
    const projection = geoNaturalEarth1().rotate([58, 0]);
    projection.fitWidth(width, {
      type: "MultiPoint",
      coordinates: [
        [-139, 44],
        [23, 44],
      ],
    });
    // Centre the frame vertically on the mid-latitudes of the route.
    const [tx, ty] = projection.translate();
    const centreY = (projection([-55, 43]) as Pt)[1];
    projection.translate([tx, ty + height * 0.5 - centreY]);

    const path = geoPath(projection);
    const interp = geoInterpolate(ORIGIN, BORDEAUX);
    const route: Pt[] = Array.from(
      { length: ROUTE_SAMPLES + 1 },
      (_, i) => projection(interp(i / ROUTE_SAMPLES)) as Pt,
    );

    return {
      landD: path(land) ?? "",
      bordersD: path(borders) ?? "",
      californiaD: california ? (path(california) ?? "") : "",
      graticuleD: path(geoGraticule10()) ?? "",
      sphereD: path({ type: "Sphere" }) ?? "",
      origin: projection(ORIGIN) as Pt,
      bordeaux: projection(BORDEAUX) as Pt,
      route,
    };
  }, [width, height]);
};

// Point along the sampled route at progress t ∈ [0, 1].
const routeAt = (route: Pt[], t: number): Pt => {
  const f = t * (route.length - 1);
  const i = Math.min(Math.floor(f), route.length - 2);
  const k = f - i;
  return [
    route[i][0] + (route[i + 1][0] - route[i][0]) * k,
    route[i][1] + (route[i + 1][1] - route[i][1]) * k,
  ];
};

const partialRouteD = (route: Pt[], t: number) => {
  if (t <= 0) return "";
  const n = Math.floor(t * (route.length - 1));
  const pts = route.slice(0, n + 1);
  pts.push(routeAt(route, t));
  return "M" + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L");
};

const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  align: "left" | "right";
  opacity: number;
  rise: number;
}> = ({ x, y, text, align, opacity, rise }) => {
  const halo = COLORS.ocean;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: `${align === "right" ? "-100%" : "0"} ${rise}px`,
        opacity,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 50,
        letterSpacing: "0.03em",
        color: COLORS.text,
        whiteSpace: "nowrap",
        textShadow: `0 0 6px ${halo}, 0 0 14px ${halo}, 0 0 22px ${halo}`,
      }}
    >
      {text}
    </div>
  );
};

export const MondaviRoute: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const geo = useGeography(width, height);

  const s = (sec: number) => sec * fps;

  // Timeline (seconds)
  const caliIn = [0.5, 1.6];
  const bdxIn = [1.3, 2.4];
  const flight = [2.2, 6.6];
  const arrive = [6.4, 7.6];

  const flightT = interpolate(frame, [s(flight[0]), s(flight[1])], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0.05, 0.3, 1),
  });

  // Gentle camera drift: a slow push toward the Atlantic and Europe.
  const camScale = interpolate(frame, [0, durationInFrames], [1, 1.045], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const pivot: Pt = [width * 0.72, height * 0.5];
  const cam = (p: Pt): Pt => [
    pivot[0] + (p[0] - pivot[0]) * camScale,
    pivot[1] + (p[1] - pivot[1]) * camScale,
  ];

  const fadeIn = interpolate(frame, [0, s(0.8)], [0, 1], { ...clamp, easing: soft });

  const caliFill = interpolate(frame, [s(caliIn[0]), s(caliIn[1])], [0, 1], {
    ...clamp,
    easing: soft,
  });
  const bdxOn = interpolate(frame, [s(bdxIn[0]), s(bdxIn[1])], [0, 1], {
    ...clamp,
    easing: soft,
  });
  const arrival = interpolate(frame, [s(arrive[0]), s(arrive[1])], [0, 1], {
    ...clamp,
    easing: soft,
  });

  const planePos = cam(routeAt(geo.route, flightT));
  const ahead = cam(routeAt(geo.route, Math.min(flightT + 0.004, 1)));
  const behind = cam(routeAt(geo.route, Math.max(flightT - 0.004, 0)));
  const heading =
    (Math.atan2(ahead[1] - behind[1], ahead[0] - behind[0]) * 180) / Math.PI + 90;
  const planeOpacity = interpolate(
    frame,
    [s(flight[0]) - 6, s(flight[0]) + 6, s(flight[1]) - 8, s(flight[1]) + 4],
    [0, 1, 1, 0],
    clamp,
  );
  const planeScale = interpolate(
    flightT,
    [0, 0.12, 0.88, 1],
    [0.75, 1, 1, 0.75],
    { ...clamp, easing: soft },
  );

  const origin = cam(geo.origin);
  const bdx = cam(geo.bordeaux);

  // Slow, single expanding ring at Bordeaux on arrival.
  const ring = interpolate(frame, [s(arrive[0]), s(arrive[0] + 1.6)], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.2, 0.6, 0.3, 1),
  });

  const mapTransform = `translate(${pivot[0] * (1 - camScale)} ${pivot[1] * (1 - camScale)}) scale(${camScale})`;
  const routeD = partialRouteD(geo.route, flightT);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ocean }}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <radialGradient id="vignette" cx="50%" cy="48%" r="75%">
              <stop offset="55%" stopColor="#5A4636" stopOpacity={0} />
              <stop offset="100%" stopColor="#5A4636" stopOpacity={0.22} />
            </radialGradient>
            <radialGradient id="glow">
              <stop offset="0%" stopColor={COLORS.highlight} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.highlight} stopOpacity={0} />
            </radialGradient>
            <filter id="planeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#3A2C24" floodOpacity="0.28" />
            </filter>
          </defs>

          <g transform={mapTransform}>
            <path
              d={geo.graticuleD}
              fill="none"
              stroke={COLORS.graticule}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={geo.landD}
              fill={COLORS.land}
              stroke={COLORS.coast}
              strokeWidth={1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={geo.bordersD}
              fill="none"
              stroke={COLORS.border}
              strokeWidth={0.8}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.9}
            />
            <path
              d={geo.californiaD}
              fill={COLORS.highlight}
              fillOpacity={(0.55 - 0.15 * arrival) * caliFill}
              stroke={COLORS.highlight}
              strokeOpacity={0.9 * caliFill}
              strokeWidth={1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* Route */}
          <path
            d={routeD}
            transform={mapTransform}
            fill="none"
            stroke={COLORS.route}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeDasharray="1 9"
            vectorEffect="non-scaling-stroke"
            opacity={0.95}
          />

          {/* California departure point */}
          <circle cx={origin[0]} cy={origin[1]} r={7 * caliFill} fill={COLORS.highlight} />
          <circle
            cx={origin[0]}
            cy={origin[1]}
            r={13}
            fill="none"
            stroke={COLORS.highlight}
            strokeWidth={1.2}
            opacity={0.6 * caliFill}
          />

          {/* Bordeaux */}
          <circle
            cx={bdx[0]}
            cy={bdx[1]}
            r={34 + 26 * arrival}
            fill="url(#glow)"
            opacity={bdxOn * (0.5 + 0.5 * arrival)}
          />
          <circle
            cx={bdx[0]}
            cy={bdx[1]}
            r={14 + 36 * ring}
            fill="none"
            stroke={COLORS.highlight}
            strokeWidth={1.4}
            opacity={(1 - ring) * 0.7 * (ring > 0 ? 1 : 0)}
          />
          <circle
            cx={bdx[0]}
            cy={bdx[1]}
            r={13 + 3 * arrival}
            fill="none"
            stroke={COLORS.highlight}
            strokeWidth={1.2 + 0.6 * arrival}
            opacity={0.6 * bdxOn + 0.4 * arrival}
          />
          <circle cx={bdx[0]} cy={bdx[1]} r={(7 + 2 * arrival) * bdxOn} fill={COLORS.highlight} />

          {/* Plane */}
          <g
            transform={`translate(${planePos[0]} ${planePos[1]}) rotate(${heading}) scale(${1.55 * planeScale}) translate(-11.5 -12)`}
            opacity={planeOpacity}
            filter="url(#planeShadow)"
          >
            <path d={PLANE_PATH} fill={COLORS.plane} />
          </g>

          <rect width={width} height={height} fill="url(#vignette)" />
        </svg>

        <Label
          x={origin[0] + 96}
          y={origin[1] + 26}
          align="left"
          text="California, USA"
          opacity={caliFill}
          rise={(1 - caliFill) * 10}
        />
        <Label
          x={bdx[0] - 22}
          y={bdx[1] + 26}
          align="right"
          text="Bordeaux, France"
          opacity={bdxOn}
          rise={(1 - bdxOn) * 10}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
