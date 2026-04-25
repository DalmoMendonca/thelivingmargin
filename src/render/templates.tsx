import type { ReactElement } from "react";
import { brand } from "../config/brand.js";
import type { CarouselSlide, QueueItem } from "../types.js";
import { resolvePalette } from "./palette.js";

const canvas = {
  width: 1080,
  height: 1350
};

const topicLabel = (value: string, maxLength = 34) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
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
      !graphicMetaPattern.test(value.trim()) &&
      !graphicEngagementPattern.test(value.trim())
  );

const graphicFooter = (value?: string, fallback?: string) =>
  isGraphicSafeText(value) ? value : fallback;

const graphicKicker = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  if (!trimmed || /^slide\s+\d+/i.test(trimmed) || !isGraphicSafeText(trimmed)) {
    return fallback;
  }

  return trimmed;
};

const shell = (paletteName: string, children: ReactElement) => {
  const palette = resolvePalette(paletteName);

  return (
    <div
      style={{
        width: canvas.width,
        height: canvas.height,
        display: "flex",
        position: "relative",
        backgroundColor: palette.background,
        color: palette.text,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -140,
          right: -90,
          width: 420,
          height: 420,
          borderRadius: 9999,
          backgroundColor: palette.accentSoft,
          opacity: 0.18
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: 9999,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: palette.accent,
          opacity: 0.18
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 34,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: palette.secondary,
          opacity: 0.9
        }}
      />
      {children}
    </div>
  );
};

const topLabel = (paletteName: string, slotLabel?: string) => {
  const palette = resolvePalette(paletteName);

  return (
    <div
      style={{
        position: "absolute",
        top: 72,
        left: 80,
        right: 80,
        display: "flex",
        justifyContent: slotLabel ? "space-between" : "flex-start",
        alignItems: "center",
        fontFamily: "Space Grotesk",
        fontWeight: 500,
        fontSize: 26,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: palette.accent
      }}
    >
      <div>{brand.name}</div>
      {slotLabel ? <div>{slotLabel}</div> : null}
    </div>
  );
};

const singleOracle = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item.palette,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 110
      }}
    >
      {topLabel(item.palette)}
      <div
        style={{
          display: "flex",
          marginTop: 180,
          fontSize: 176,
          lineHeight: 0.7,
          color: palette.accent,
          fontFamily: "Instrument Serif"
        }}
      >
        “
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          marginTop: 10
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontSize: 96,
            lineHeight: 1.02
          }}
        >
          {content.headline}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: 50,
            lineHeight: 1.22,
            maxWidth: 860
          }}
        >
          {content.body}
        </div>
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
          <div
            style={{
              display: "flex",
              fontFamily: "Space Grotesk",
              fontSize: 28,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: palette.accent
            }}
          >
            {content.supportLine}
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
              textAlign: "right",
              fontFamily: "Newsreader",
              fontSize: 30,
              lineHeight: 1.2
            }}
          >
            {content.footer ?? item.angle}
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
    item.palette,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 92
      }}
    >
      {topLabel(item.palette)}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 36,
          marginTop: 184,
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
            gap: 34,
            flex: 1
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: palette.accent
            }}
          >
            {topicLabel(item.topic)}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 88,
              lineHeight: 1.02,
              maxWidth: 860
            }}
          >
            {content.headline}
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 760,
              fontFamily: "Newsreader",
              fontSize: 44,
              lineHeight: 1.24,
              color: palette.text
            }}
          >
            {content.body}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 28
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: 28,
            opacity: 0.8,
            maxWidth: 560
          }}
        >
          {content.supportLine ?? item.angle}
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
              paddingRight: 18,
              fontFamily: "Space Grotesk",
              fontSize: 22,
              textTransform: "uppercase",
              color: palette.accent,
              letterSpacing: 2
            }}
          >
            {graphicFooter(content.footer)}
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
    item.palette,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 84,
        paddingBottom: 84,
        paddingLeft: 78,
        paddingRight: 78
      }}
    >
      <div
        style={{
          display: "flex",
          width: 210,
          flexDirection: "column",
          paddingRight: 36,
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
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: palette.accent
          }}
        >
          {brand.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontFamily: "Newsreader",
            fontSize: 30,
            lineHeight: 1.18,
            color: palette.text
          }}
        >
          {content.footer ?? item.angle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: 54,
          paddingTop: 92,
          flex: 1
        }}
      >
        {topLabel(item.palette)}
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontSize: 92,
            lineHeight: 1.02,
            maxWidth: 680
          }}
        >
          {content.headline}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontFamily: "Newsreader",
            fontSize: 44,
            lineHeight: 1.22,
            maxWidth: 660
          }}
        >
          {content.body}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontFamily: "Space Grotesk",
            fontSize: 25,
            lineHeight: 1.3,
            letterSpacing: 1.3,
            textTransform: "uppercase",
            color: palette.accent
          }}
        >
          {content.supportLine ?? item.angle}
        </div>
      </div>
    </div>
  );
};

const singleSignal = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;

  return shell(
    item.palette,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 88
      }}
    >
      {topLabel(item.palette)}
      <div
        style={{
          display: "flex",
          marginTop: 190,
          alignItems: "stretch",
          gap: 24
        }}
      >
        <div
          style={{
            display: "flex",
            width: 240,
            minHeight: 240,
            padding: 24,
            backgroundColor: palette.accent,
            color: palette.background,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            fontSize: 28,
            textTransform: "uppercase",
            lineHeight: 1.1
          }}
        >
          {topicLabel(item.topic, 24)}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 24
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 88,
              lineHeight: 1.02
            }}
          >
            {content.headline}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Newsreader",
              fontSize: 42,
              lineHeight: 1.2
            }}
          >
            {content.body}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: 30,
            maxWidth: 560
          }}
        >
          {content.supportLine ?? item.angle}
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

const carouselSlide = (
  item: QueueItem,
  slide: CarouselSlide,
  index: number,
  total: number
) => {
  const palette = resolvePalette(item.palette);
  const isCover = index === 0;

  return shell(
    item.palette,
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 88
      }}
    >
      {topLabel(item.palette, `Slide ${index + 1}/${total}`)}
      <div
        style={{
          display: "flex",
          marginTop: 186,
          flexDirection: "column",
          gap: 28
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Space Grotesk",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: palette.accent
          }}
        >
          {graphicKicker(slide.kicker, topicLabel(item.topic))}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: isCover ? "Instrument Serif" : "Newsreader",
            fontSize: isCover ? 88 : 76,
            lineHeight: 1.04,
            maxWidth: 850
          }}
        >
          {slide.headline}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: 42,
            lineHeight: 1.22,
            maxWidth: 820
          }}
        >
          {slide.body}
        </div>
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: 28,
            maxWidth: 610
          }}
        >
          {graphicFooter(slide.footer, item.angle)}
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
  );
};

export const renderItemCard = (item: QueueItem) => {
  if (item.kind === "carousel" && item.carousel) {
    return item.carousel.map((slide, index) =>
      carouselSlide(item, slide, index, item.carousel!.length)
    );
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
