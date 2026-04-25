import type { ReactElement } from "react";
import { brand } from "../config/brand.js";
import type { CarouselSlide, QueueItem } from "../types.js";
import { resolvePalette } from "./palette.js";
import { renderMarkedText } from "./rich-text.js";
import { surfaceDataUrl } from "./surfaces.js";

const canvas = {
  width: 1080,
  height: 1350
};

const stripMarkers = (value: string) => value.replace(/\[\[(.+?)\]\]/g, "$1");

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const shortLabel = (value: string, maxLength = 34) => {
  const cleaned = stripMarkers(value).replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trimEnd()}...`;
};

const graphicMetaPattern =
  /comment bait|thoughtful contrarian|uncomfortable, but useful|argue with this|comment if|save this|^(morning|midday|evening)\s+(prompt|reminder|practice)/i;
const graphicEngagementPattern = /^(comment|save|share|follow|tag)\b/i;

const isGraphicSafeText = (value?: string) =>
  Boolean(
    value &&
      !graphicMetaPattern.test(stripMarkers(value).trim()) &&
      !graphicEngagementPattern.test(stripMarkers(value).trim())
  );

const graphicFooter = (value?: string, fallback?: string) =>
  isGraphicSafeText(value) ? value : fallback;

const graphicKicker = (value: string | undefined, fallback: string) => {
  const cleaned = value ? shortLabel(value, 42) : "";
  if (!cleaned || /^slide\s+\d+/i.test(cleaned) || !isGraphicSafeText(cleaned)) {
    return fallback;
  }

  return cleaned;
};

const labelForItem = (item: QueueItem) => shortLabel(item.topic || titleCase(item.contentMode), 32);
const contentModeLabel = (item: QueueItem) => titleCase(item.contentMode);

const surfaceOverlayOpacity = (item: QueueItem) => {
  if (item.surfaceStyle === "charcoalGrain") {
    return 0.18;
  }

  if (item.surfaceStyle === "plasterBlue") {
    return 0.06;
  }

  return 0.1;
};

const contentPanel = (
  palette: ReturnType<typeof resolvePalette>,
  children: ReactElement,
  style?: Record<string, string | number>
) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      position: "relative",
      backgroundColor:
        palette.name === "midnightPaper"
          ? "rgba(24, 22, 20, 0.76)"
          : "rgba(248, 244, 238, 0.74)",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor:
        palette.name === "midnightPaper"
          ? "rgba(246, 239, 229, 0.16)"
          : "rgba(60, 40, 24, 0.08)",
      padding: 44,
      ...style
    }}
  >
    {children}
  </div>
);

const shell = (
  item: QueueItem,
  children: ReactElement,
  trailingLabel?: string
) => {
  const palette = resolvePalette(item.palette);

  return (
    <div
      style={{
        width: canvas.width,
        height: canvas.height,
        display: "flex",
        position: "relative",
        backgroundColor: palette.background,
        backgroundImage: `url(${surfaceDataUrl(item.surfaceStyle)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: palette.text,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: palette.background,
          opacity: surfaceOverlayOpacity(item)
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 34,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: palette.secondary,
          opacity: palette.name === "midnightPaper" ? 0.5 : 0.9
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: 9999,
          backgroundColor: palette.accentSoft,
          opacity: palette.name === "midnightPaper" ? 0.1 : 0.12
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: -100,
          width: 320,
          height: 320,
          borderRadius: 9999,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: palette.accent,
          opacity: palette.name === "midnightPaper" ? 0.08 : 0.16
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 78,
          right: 78,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "Space Grotesk",
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          color: palette.accent
        }}
      >
        <div>{brand.name}</div>
        <div>{trailingLabel ?? contentModeLabel(item)}</div>
      </div>
      {children}
    </div>
  );
};

const noteStripe = (
  palette: ReturnType<typeof resolvePalette>,
  label: string,
  width = 280
) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      fontFamily: "Space Grotesk",
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: palette.accent
    }}
  >
    <div
      style={{
        display: "flex",
        width: 16,
        height: 16,
        borderRadius: 9999,
        backgroundColor: palette.accent
      }}
    />
    <div>{shortLabel(label, width / 8)}</div>
  </div>
);

const singleHighlight = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 154,
        paddingBottom: 92,
        paddingLeft: 86,
        paddingRight: 86
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 742,
          marginTop: 88
        }}
      >
        {noteStripe(palette, labelForItem(item), 300)}
        <div style={{ display: "flex", marginTop: 38 }}>
          {renderMarkedText(content.headline, {
            fontFamily: "Newsreader",
            fontSize: 72,
            lineHeight: 1.16,
            color: palette.text,
            fontWeight: 600,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 12,
            highlightPaddingY: 3,
            paragraphGap: 18
          })}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            maxWidth: 720
          }}
        >
          {renderMarkedText(content.body, {
            fontFamily: "Newsreader",
            fontSize: 40,
            lineHeight: 1.24,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 10,
            highlightPaddingY: 2,
            paragraphGap: 18
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            gap: 32
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 420
            }}
          >
            {renderMarkedText(content.supportLine ?? item.angle, {
              fontFamily: "Space Grotesk",
              fontSize: 24,
              lineHeight: 1.3,
              color: palette.accent,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 8,
              highlightPaddingY: 2
            })}
          </div>
          {graphicFooter(content.footer) ? (
            <div
              style={{
                display: "flex",
                width: 302,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: palette.secondary,
                paddingTop: 14,
                paddingBottom: 14,
                paddingLeft: 18,
                paddingRight: 18
              }}
            >
              {renderMarkedText(graphicFooter(content.footer)!, {
                fontFamily: "Space Grotesk",
                fontSize: 20,
                lineHeight: 1.3,
                color: palette.accent,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                highlightBackground: palette.marker,
                highlightColor: palette.markerText,
                highlightPaddingX: 6,
                highlightPaddingY: 1
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const singleNotebook = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 154,
        paddingBottom: 86,
        paddingLeft: 80,
        paddingRight: 80
      }}
    >
      {contentPanel(
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            {noteStripe(palette, contentModeLabel(item), 220)}
            <div
              style={{
                display: "flex",
                fontFamily: "Space Grotesk",
                fontSize: 20,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: palette.accent
              }}
            >
              Page 01
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 34,
              maxWidth: 760
            }}
          >
            {renderMarkedText(content.headline, {
              fontFamily: "Instrument Serif",
              fontSize: 84,
              lineHeight: 1.05,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              maxWidth: 760
            }}
          >
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: 38,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 16
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 26,
              marginTop: "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                maxWidth: 470
              }}
            >
              {renderMarkedText(content.supportLine ?? item.angle, {
                fontFamily: "Space Grotesk",
                fontSize: 24,
                lineHeight: 1.3,
                color: palette.accent,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                highlightBackground: palette.marker,
                highlightColor: palette.markerText,
                highlightPaddingX: 8,
                highlightPaddingY: 2
              })}
            </div>
            {graphicFooter(content.footer) ? (
              <div
                style={{
                  display: "flex",
                  maxWidth: 280
                }}
              >
                {renderMarkedText(graphicFooter(content.footer)!, {
                  fontFamily: "Newsreader",
                  fontSize: 24,
                  lineHeight: 1.25,
                  color: palette.text,
                  textAlign: "right",
                  highlightBackground: palette.marker,
                  highlightColor: palette.markerText,
                  highlightPaddingX: 8,
                  highlightPaddingY: 2
                })}
              </div>
            ) : null}
          </div>
        </div>,
        {
          width: 1000,
          marginTop: 6
        }
      )}
    </div>
  );
};

const singleBroadside = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 154,
        paddingBottom: 88,
        paddingLeft: 84,
        paddingRight: 84
      }}
    >
      {contentPanel(
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {noteStripe(palette, labelForItem(item), 280)}
          <div
            style={{
              display: "flex",
              marginTop: 30,
              maxWidth: 850
            }}
          >
            {renderMarkedText(content.headline, {
              fontFamily: "Instrument Serif",
              fontSize: 82,
              lineHeight: 1.04,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 4
            })}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 820
            }}
          >
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: 36,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 26,
              marginTop: "auto",
              alignItems: "flex-end"
            }}
          >
            <div
              style={{
                display: "flex",
                maxWidth: 500
              }}
            >
              {renderMarkedText(content.supportLine ?? item.angle, {
                fontFamily: "Space Grotesk",
                fontSize: 23,
                lineHeight: 1.34,
                color: palette.accent,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                highlightBackground: palette.marker,
                highlightColor: palette.markerText,
                highlightPaddingX: 8,
                highlightPaddingY: 2
              })}
            </div>
            <div
              style={{
                display: "flex",
                width: 200,
                height: 200,
                borderRadius: 9999,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: palette.accent,
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Instrument Serif",
                fontSize: 76,
                color: palette.accent
              }}
            >
              ?
            </div>
          </div>
        </div>,
        {
          width: 912,
          marginLeft: "auto"
        }
      )}
    </div>
  );
};

const singleOracle = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        paddingTop: 166,
        paddingBottom: 96,
        paddingLeft: 102,
        paddingRight: 102
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 166,
          lineHeight: 0.7,
          color: palette.accent,
          fontFamily: "Instrument Serif"
        }}
      >
        "
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          marginTop: 4,
          maxWidth: 860
        }}
      >
        {renderMarkedText(content.headline, {
          fontFamily: "Instrument Serif",
          fontSize: 92,
          lineHeight: 1.03,
          color: palette.text,
          highlightBackground: palette.marker,
          highlightColor: palette.markerText,
          highlightPaddingX: 12,
          highlightPaddingY: 4
        })}
        {renderMarkedText(content.body, {
          fontFamily: "Newsreader",
          fontSize: 46,
          lineHeight: 1.24,
          color: palette.text,
          highlightBackground: palette.marker,
          highlightColor: palette.markerText,
          highlightPaddingX: 10,
          highlightPaddingY: 2
        })}
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}
      >
        {content.supportLine ? (
          <div style={{ display: "flex", maxWidth: 520 }}>
            {renderMarkedText(content.supportLine, {
              fontFamily: "Space Grotesk",
              fontSize: 26,
              lineHeight: 1.3,
              color: palette.accent,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 8,
              highlightPaddingY: 2
            })}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end"
          }}
        >
          <div
            style={{
              display: "flex",
              width: 280,
              height: 2,
              backgroundColor: palette.accent
            }}
          />
          <div
            style={{
              display: "flex",
              maxWidth: 420,
              textAlign: "right"
            }}
          >
            {renderMarkedText(content.footer ?? item.angle, {
              fontFamily: "Newsreader",
              fontSize: 30,
              lineHeight: 1.22,
              color: palette.text,
              textAlign: "right",
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 8,
              highlightPaddingY: 2
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const singleEditorial = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        paddingTop: 162,
        paddingBottom: 88,
        paddingLeft: 92,
        paddingRight: 92
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 34,
          flex: 1
        }}
      >
        <div
          style={{
            display: "flex",
            width: 16,
            backgroundColor: palette.accent,
            borderRadius: 9999
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            flex: 1
          }}
        >
          {noteStripe(palette, labelForItem(item), 280)}
          {renderMarkedText(content.headline, {
            fontFamily: "Instrument Serif",
            fontSize: 86,
            lineHeight: 1.03,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 12,
            highlightPaddingY: 4
          })}
          <div style={{ display: "flex", maxWidth: 760 }}>
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: 42,
              lineHeight: 1.26,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2
            })}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          marginTop: 28
        }}
      >
        <div style={{ display: "flex", maxWidth: 560 }}>
          {renderMarkedText(content.supportLine ?? item.angle, {
            fontFamily: "Newsreader",
            fontSize: 27,
            lineHeight: 1.28,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
        {graphicFooter(content.footer) ? (
          <div
            style={{
              display: "flex",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: palette.secondary,
              paddingTop: 14,
              paddingBottom: 14,
              paddingLeft: 18,
              paddingRight: 18
            }}
          >
            {renderMarkedText(graphicFooter(content.footer)!, {
              fontFamily: "Space Grotesk",
              fontSize: 20,
              lineHeight: 1.3,
              color: palette.accent,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 8,
              highlightPaddingY: 1
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const singleMargin = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 154,
        paddingBottom: 88,
        paddingLeft: 78,
        paddingRight: 78
      }}
    >
      <div
        style={{
          display: "flex",
          width: 232,
          flexDirection: "column",
          paddingRight: 34,
          borderRightWidth: 1,
          borderRightStyle: "solid",
          borderRightColor: palette.secondary
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Space Grotesk",
            fontSize: 22,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: palette.accent
          }}
        >
          {contentModeLabel(item)}
        </div>
        <div style={{ display: "flex", marginTop: 22 }}>
          {renderMarkedText(labelForItem(item), {
            fontFamily: "Space Grotesk",
            fontSize: 24,
            lineHeight: 1.28,
            color: palette.text,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
        <div style={{ display: "flex", marginTop: "auto" }}>
          {renderMarkedText(content.footer ?? item.angle, {
            fontFamily: "Newsreader",
            fontSize: 30,
            lineHeight: 1.22,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: 56,
          paddingTop: 12,
          flex: 1
        }}
      >
        <div style={{ display: "flex", maxWidth: 690 }}>
          {renderMarkedText(content.headline, {
            fontFamily: "Instrument Serif",
            fontSize: 92,
            lineHeight: 1.04,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 12,
            highlightPaddingY: 4
          })}
        </div>
        <div style={{ display: "flex", marginTop: 28, maxWidth: 670 }}>
          {renderMarkedText(content.body, {
            fontFamily: "Newsreader",
            fontSize: 42,
            lineHeight: 1.24,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 10,
            highlightPaddingY: 2
          })}
        </div>
        <div style={{ display: "flex", marginTop: 46, maxWidth: 620 }}>
          {renderMarkedText(content.supportLine ?? item.angle, {
            fontFamily: "Space Grotesk",
            fontSize: 25,
            lineHeight: 1.34,
            color: palette.accent,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
      </div>
    </div>
  );
};

const singleSignal = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        paddingTop: 158,
        paddingBottom: 88,
        paddingLeft: 88,
        paddingRight: 88
      }}
    >
      <div
        style={{
          display: "flex",
          marginTop: 34,
          alignItems: "stretch",
          gap: 24
        }}
      >
        <div
          style={{
            display: "flex",
            width: 250,
            minHeight: 250,
            padding: 24,
            backgroundColor: palette.accent,
            color: palette.background
          }}
        >
          {renderMarkedText(labelForItem(item), {
            fontFamily: "Space Grotesk",
            fontSize: 28,
            lineHeight: 1.2,
            color: palette.background,
            fontWeight: 700,
            textTransform: "uppercase",
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 24
          }}
        >
          {renderMarkedText(content.headline, {
            fontFamily: "Instrument Serif",
            fontSize: 84,
            lineHeight: 1.03,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 12,
            highlightPaddingY: 4
          })}
          {renderMarkedText(content.body, {
            fontFamily: "Newsreader",
            fontSize: 40,
            lineHeight: 1.22,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 10,
            highlightPaddingY: 2
          })}
        </div>
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 26
        }}
      >
        <div style={{ display: "flex", maxWidth: 560 }}>
          {renderMarkedText(content.supportLine ?? item.angle, {
            fontFamily: "Newsreader",
            fontSize: 30,
            lineHeight: 1.22,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: 9999,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: palette.accent,
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Instrument Serif",
            fontSize: 78,
            color: palette.accent
          }}
        >
          ?
        </div>
      </div>
    </div>
  );
};

const notebookCarousel = (
  item: QueueItem,
  slide: CarouselSlide,
  index: number,
  total: number
) => {
  const palette = resolvePalette(item.palette);

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 154,
        paddingBottom: 84,
        paddingLeft: 80,
        paddingRight: 80
      }}
    >
      {contentPanel(
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            {noteStripe(palette, graphicKicker(slide.kicker, labelForItem(item)), 240)}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 10
              }}
            >
              {Array.from({ length: total }).map((_, dotIndex) => (
                <div
                  key={`${item.id}-${dotIndex}`}
                  style={{
                    display: "flex",
                    width: dotIndex === index ? 44 : 14,
                    height: 14,
                    borderRadius: 9999,
                    backgroundColor:
                      dotIndex === index ? palette.accent : palette.secondary
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 34, maxWidth: 790 }}>
            {renderMarkedText(slide.headline, {
              fontFamily: index === 0 ? "Instrument Serif" : "Newsreader",
              fontSize: index === 0 ? 84 : 72,
              lineHeight: 1.06,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 790 }}>
            {renderMarkedText(slide.body, {
              fontFamily: "Newsreader",
              fontSize: 38,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 16
            })}
          </div>
          <div style={{ display: "flex", marginTop: "auto", maxWidth: 500 }}>
            {renderMarkedText(graphicFooter(slide.footer, item.angle)!, {
              fontFamily: "Space Grotesk",
              fontSize: 24,
              lineHeight: 1.32,
              color: palette.accent,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 8,
              highlightPaddingY: 2
            })}
          </div>
        </div>,
        {
          width: 1000
        }
      )}
    </div>,
    `Slide ${index + 1}/${total}`
  );
};

const highlightCarousel = (
  item: QueueItem,
  slide: CarouselSlide,
  index: number,
  total: number
) => {
  const palette = resolvePalette(item.palette);

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 166,
        paddingBottom: 88,
        paddingLeft: 92,
        paddingRight: 92
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%"
        }}
      >
        {noteStripe(palette, graphicKicker(slide.kicker, labelForItem(item)), 300)}
        <div style={{ display: "flex", marginTop: 34, maxWidth: 780 }}>
          {renderMarkedText(slide.headline, {
            fontFamily: "Newsreader",
            fontSize: index === 0 ? 76 : 68,
            lineHeight: 1.14,
            color: palette.text,
            fontWeight: 600,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 12,
            highlightPaddingY: 3
          })}
        </div>
        <div style={{ display: "flex", marginTop: 24, maxWidth: 760 }}>
          {renderMarkedText(slide.body, {
            fontFamily: "Newsreader",
            fontSize: 38,
            lineHeight: 1.28,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 10,
            highlightPaddingY: 2,
            paragraphGap: 16
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 26,
            marginTop: "auto"
          }}
        >
          <div style={{ display: "flex", maxWidth: 480 }}>
            {renderMarkedText(graphicFooter(slide.footer, item.angle)!, {
              fontFamily: "Space Grotesk",
              fontSize: 24,
              lineHeight: 1.32,
              color: palette.accent,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 8,
              highlightPaddingY: 2
            })}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 12
            }}
          >
            {Array.from({ length: total }).map((_, dotIndex) => (
              <div
                key={`${item.id}-${dotIndex}`}
                style={{
                  display: "flex",
                  width: dotIndex === index ? 44 : 14,
                  height: 14,
                  borderRadius: 9999,
                  backgroundColor:
                    dotIndex === index ? palette.accent : palette.secondary
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    `Slide ${index + 1}/${total}`
  );
};

const broadsideCarousel = (
  item: QueueItem,
  slide: CarouselSlide,
  index: number,
  total: number
) => {
  const palette = resolvePalette(item.palette);

  return shell(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 154,
        paddingBottom: 84,
        paddingLeft: 92,
        paddingRight: 92
      }}
    >
      {contentPanel(
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {noteStripe(palette, graphicKicker(slide.kicker, labelForItem(item)), 280)}
          <div style={{ display: "flex", marginTop: 32, maxWidth: 840 }}>
            {renderMarkedText(slide.headline, {
              fontFamily: index === 0 ? "Instrument Serif" : "Newsreader",
              fontSize: index === 0 ? 84 : 72,
              lineHeight: 1.06,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 820 }}>
            {renderMarkedText(slide.body, {
              fontFamily: "Newsreader",
              fontSize: 36,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 16
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 26,
              marginTop: "auto"
            }}
          >
            <div style={{ display: "flex", maxWidth: 520 }}>
              {renderMarkedText(graphicFooter(slide.footer, item.angle)!, {
                fontFamily: "Newsreader",
                fontSize: 28,
                lineHeight: 1.24,
                color: palette.text,
                highlightBackground: palette.marker,
                highlightColor: palette.markerText,
                highlightPaddingX: 8,
                highlightPaddingY: 2
              })}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 12
              }}
            >
              {Array.from({ length: total }).map((_, dotIndex) => (
                <div
                  key={`${item.id}-${dotIndex}`}
                  style={{
                    display: "flex",
                    width: dotIndex === index ? 44 : 14,
                    height: 14,
                    borderRadius: 9999,
                    backgroundColor:
                      dotIndex === index ? palette.accent : palette.secondary
                  }}
                />
              ))}
            </div>
          </div>
        </div>,
        {
          width: 920,
          marginLeft: "auto"
        }
      )}
    </div>,
    `Slide ${index + 1}/${total}`
  );
};

const editorialCarousel = (
  item: QueueItem,
  slide: CarouselSlide,
  index: number,
  total: number
) => {
  const palette = resolvePalette(item.palette);
  const isCover = index === 0;

  return shell(
    item,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        paddingTop: 160,
        paddingBottom: 86,
        paddingLeft: 88,
        paddingRight: 88
      }}
    >
      {noteStripe(palette, graphicKicker(slide.kicker, labelForItem(item)), 280)}
      <div
        style={{
          display: "flex",
          marginTop: 34,
          flexDirection: "column",
          gap: 24,
          maxWidth: 840
        }}
      >
        {renderMarkedText(slide.headline, {
          fontFamily: isCover ? "Instrument Serif" : "Newsreader",
          fontSize: isCover ? 86 : 72,
          lineHeight: 1.06,
          color: palette.text,
          highlightBackground: palette.marker,
          highlightColor: palette.markerText,
          highlightPaddingX: 12,
          highlightPaddingY: 3
        })}
        {renderMarkedText(slide.body, {
          fontFamily: "Newsreader",
          fontSize: 40,
          lineHeight: 1.25,
          color: palette.text,
          highlightBackground: palette.marker,
          highlightColor: palette.markerText,
          highlightPaddingX: 10,
          highlightPaddingY: 2,
          paragraphGap: 16
        })}
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24
        }}
      >
        <div style={{ display: "flex", maxWidth: 610 }}>
          {renderMarkedText(graphicFooter(slide.footer, item.angle)!, {
            fontFamily: "Newsreader",
            fontSize: 28,
            lineHeight: 1.24,
            color: palette.text,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 12
          }}
        >
          {Array.from({ length: total }).map((_, dotIndex) => (
            <div
              key={`${item.id}-${dotIndex}`}
              style={{
                display: "flex",
                width: dotIndex === index ? 44 : 14,
                height: 14,
                borderRadius: 9999,
                backgroundColor:
                  dotIndex === index ? palette.accent : palette.secondary
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    `Slide ${index + 1}/${total}`
  );
};

export const renderItemCard = (item: QueueItem) => {
  if (item.kind === "carousel" && item.carousel) {
    return item.carousel.map((slide, index) => {
      if (item.templateFamily === "highlight") {
        return highlightCarousel(item, slide, index, item.carousel!.length);
      }

      if (item.templateFamily === "notebook" || item.templateFamily === "lesson") {
        return notebookCarousel(item, slide, index, item.carousel!.length);
      }

      if (item.templateFamily === "broadside") {
        return broadsideCarousel(item, slide, index, item.carousel!.length);
      }

      return editorialCarousel(item, slide, index, item.carousel!.length);
    });
  }

  if (item.templateFamily === "highlight") {
    return [singleHighlight(item)];
  }

  if (item.templateFamily === "notebook" || item.templateFamily === "lesson") {
    return [singleNotebook(item)];
  }

  if (item.templateFamily === "broadside") {
    return [singleBroadside(item)];
  }

  if (item.templateFamily === "oracle") {
    return [singleOracle(item)];
  }

  if (item.templateFamily === "margin") {
    return [singleMargin(item)];
  }

  if (item.templateFamily === "signal") {
    return [singleSignal(item)];
  }

  return [singleEditorial(item)];
};
