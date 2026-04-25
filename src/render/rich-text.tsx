import type { ReactElement } from "react";

interface MarkedTextOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  fontWeight?: 400 | 500 | 600 | 700;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right";
  textTransform?: "none" | "uppercase";
  highlightBackground: string;
  highlightColor?: string;
  highlightPaddingX?: number;
  highlightPaddingY?: number;
  highlightRadius?: number;
  paragraphGap?: number;
}

interface Segment {
  kind: "text" | "highlight";
  value: string;
}

const parseSegments = (value: string): Segment[] => {
  const segments: Segment[] = [];
  const pattern = /\[\[(.+?)\]\]/g;
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({
        kind: "text",
        value: value.slice(lastIndex, index)
      });
    }

    segments.push({
      kind: "highlight",
      value: match[1]
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < value.length) {
    segments.push({
      kind: "text",
      value: value.slice(lastIndex)
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          kind: "text",
          value
        }
      ];
};

export const renderMarkedText = (
  value: string,
  options: MarkedTextOptions
): ReactElement => {
  const paragraphs = value.split("\n\n").filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap:
          options.paragraphGap ??
          Math.max(14, Math.round(options.fontSize * 0.34))
      }}
    >
      {paragraphs.map((paragraph, paragraphIndex) => (
        <div
          key={`paragraph-${paragraphIndex}`}
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontFamily: options.fontFamily,
            fontSize: options.fontSize,
            fontWeight: options.fontWeight ?? 400,
            lineHeight: options.lineHeight,
            color: options.color,
            letterSpacing: options.letterSpacing ?? 0,
            textAlign: options.textAlign ?? "left",
            textTransform: options.textTransform ?? "none"
          }}
        >
          {parseSegments(paragraph).map((segment, segmentIndex) =>
            segment.kind === "highlight" ? (
              <span
                key={`segment-${paragraphIndex}-${segmentIndex}`}
                style={{
                  backgroundColor: options.highlightBackground,
                  color: options.highlightColor ?? options.color,
                  paddingLeft: options.highlightPaddingX ?? 10,
                  paddingRight: options.highlightPaddingX ?? 10,
                  paddingTop: options.highlightPaddingY ?? 4,
                  paddingBottom: options.highlightPaddingY ?? 4,
                  borderRadius: options.highlightRadius ?? 3
                }}
              >
                {segment.value}
              </span>
            ) : (
              <span key={`segment-${paragraphIndex}-${segmentIndex}`}>{segment.value}</span>
            )
          )}
        </div>
      ))}
    </div>
  );
};
