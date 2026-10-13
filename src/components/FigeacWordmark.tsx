import { display } from "../fonts";
import { colors } from "../theme";

// "CHATEAU-FIGEAC" wordmark: copper-gold letters, dark outline, red offset shadow.
export const FigeacWordmark: React.FC<{ fontSize: number }> = ({ fontSize }) => {
  const text = "CHATEAU-FIGEAC";
  const base: React.CSSProperties = {
    fontFamily: display,
    fontSize,
    letterSpacing: "0.06em",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  const shadow = Math.round(fontSize * 0.06);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ ...base, position: "absolute", left: shadow, top: shadow, color: colors.figeacRed }}>
        {text}
      </div>
      <div
        style={{
          ...base,
          position: "relative",
          background: "linear-gradient(170deg, #D9B98A 0%, #B98B5B 45%, #E3C9A0 60%, #A97A4C 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextStroke: `${Math.max(1.5, fontSize * 0.02)}px #1E1A16`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
