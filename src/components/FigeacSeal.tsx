import { display } from "../fonts";

const DOTS = new Array(56).fill(true).map((_, i) => {
  const a = (i / 56) * Math.PI * 2;
  return { x: 100 + Math.cos(a) * 85, y: 100 + Math.sin(a) * 85 };
});

const Diamond: React.FC<{ y: number }> = ({ y }) => (
  <g>
    <path d={`M100 ${y - 9} L116 ${y} L100 ${y + 9} L84 ${y} Z`} fill="#8E2A20" stroke="#E07A63" strokeWidth={1.2} />
    <path d={`M100 ${y - 4} L107 ${y} L100 ${y + 4} L93 ${y} Z`} fill="#B53A2B" />
  </g>
);

// Embossed red capsule seal of Château Figeac.
export const FigeacSeal: React.FC<{ size: number }> = ({ size }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="sealFill" cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#D65A45" />
          <stop offset="60%" stopColor="#B63C2D" />
          <stop offset="100%" stopColor="#7E2219" />
        </radialGradient>
      </defs>
      <circle cx={100} cy={100} r={97} fill="url(#sealFill)" />
      <circle cx={100} cy={100} r={95} fill="none" stroke="#6A1C15" strokeWidth={2} />
      <circle cx={100} cy={100} r={76} fill="none" stroke="#8E2A20" strokeWidth={1.5} />
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.2} fill="#8E2A20" stroke="#E07A63" strokeWidth={0.6} />
      ))}
      <Diamond y={50} />
      <Diamond y={150} />
      {["CHATEAU", "FIGEAC"].map((word, i) => (
        <g key={word} fontFamily={display} fontSize={38} textAnchor="middle" letterSpacing={1}>
          <text x={101} y={96 + i * 36} fill="#E9866F">{word}</text>
          <text x={100} y={95 + i * 36} fill="#7A2017">{word}</text>
        </g>
      ))}
    </svg>
  );
};
