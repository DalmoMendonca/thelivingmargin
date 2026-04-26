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

const cleanLength = (value?: string) =>
  stripMarkers(value ?? "")
    .replace(/\s+/g, " ")
    .trim().length;

const shortLabel = (value: string, maxLength = 38) => {
  const cleaned = stripMarkers(value).replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trimEnd()}...`;
};

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const scaleByLength = (
  value: string | undefined,
  base: number,
  floor: number,
  divisor: number
) => clamp(base - Math.max(0, cleanLength(value) - divisor) * 0.28, floor, base);

const safeOptionalText = (value?: string, maxLength = 86) => {
  if (!value) {
    return undefined;
  }

  return cleanLength(value) <= maxLength ? value : undefined;
};

const pageLabel = (index: number) => `PAGE ${index + 1}`;

const panelBackground = (item: QueueItem) => {
  if (item.surfaceStyle === "charcoalGrain") {
    return "rgba(21, 20, 19, 0.78)";
  }

  return "rgba(248, 244, 237, 0.9)";
};

const panelBorder = (item: QueueItem, palette: ReturnType<typeof resolvePalette>) => {
  if (item.surfaceStyle === "charcoalGrain") {
    return "rgba(247, 238, 226, 0.16)";
  }

  return palette.secondary;
};

const surfaceOverlay = (item: QueueItem) => {
  if (item.surfaceStyle === "charcoalGrain") {
    return "rgba(10, 10, 10, 0.28)";
  }

  if (item.surfaceStyle === "plasterBlue") {
    return "rgba(236, 242, 242, 0.26)";
  }

  return "rgba(245, 240, 233, 0.16)";
};

const topBar = (
  palette: ReturnType<typeof resolvePalette>,
  rightLabel?: string
) => (
  <div
    style={{
      position: "absolute",
      top: 54,
      left: 66,
      right: 66,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "Space Grotesk",
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: 2.2,
      textTransform: "uppercase",
      color: palette.accent
    }}
  >
    <div>{brand.name}</div>
    <div>{rightLabel ?? ""}</div>
  </div>
);

const tagRow = (
  palette: ReturnType<typeof resolvePalette>,
  label: string
) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      fontFamily: "Space Grotesk",
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: palette.accent
    }}
  >
    <div
      style={{
        display: "flex",
        width: 12,
        height: 12,
        borderRadius: 9999,
        backgroundColor: palette.accent
      }}
    />
    <div>{shortLabel(label, 42)}</div>
  </div>
);

const footerBlock = (
  palette: ReturnType<typeof resolvePalette>,
  supportLine?: string,
  footer?: string,
  align: "left" | "right" = "left"
) => {
  const safeSupport = safeOptionalText(supportLine, 88);
  const safeFooter = safeOptionalText(footer, 88);
  if (!safeSupport && !safeFooter) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        gap: 16,
        marginTop: "auto"
      }}
    >
      {safeSupport ? (
        <div style={{ display: "flex", maxWidth: 520 }}>
          {renderMarkedText(safeSupport, {
            fontFamily: "Space Grotesk",
            fontSize: 22,
            lineHeight: 1.32,
            color: palette.accent,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
      ) : null}
      {safeFooter ? (
        <div style={{ display: "flex", maxWidth: 460 }}>
          {renderMarkedText(safeFooter, {
            fontFamily: "Newsreader",
            fontSize: 26,
            lineHeight: 1.22,
            color: palette.text,
            textAlign: align,
            highlightBackground: palette.marker,
            highlightColor: palette.markerText,
            highlightPaddingX: 8,
            highlightPaddingY: 2
          })}
        </div>
      ) : null}
    </div>
  );
};

const frame = (
  item: QueueItem,
  child: ReactElement,
  options?: {
    page?: string;
  }
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
          backgroundColor: surfaceOverlay(item)
        }}
      />
      {topBar(palette, options?.page)}
      {child}
    </div>
  );
};

const panel = (
  item: QueueItem,
  palette: ReturnType<typeof resolvePalette>,
  children: ReactElement,
  style?: Record<string, string | number>
) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      position: "relative",
      width: 820,
      minHeight: 1000,
      paddingTop: 52,
      paddingBottom: 50,
      paddingLeft: 52,
      paddingRight: 52,
      backgroundColor: panelBackground(item),
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: panelBorder(item, palette),
      ...style
    }}
  >
    {children}
  </div>
);

const wallSingle = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;
  const headlineSize = scaleByLength(content.headline, 76, 54, 86);
  const bodySize = scaleByLength(content.body, 34, 28, 180);

  return frame(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 128,
        paddingBottom: 94,
        paddingLeft: 92,
        paddingRight: 92,
        alignItems: "center"
      }}
    >
      {panel(
        item,
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {tagRow(palette, item.topic || titleCase(item.contentMode))}
          <div style={{ display: "flex", marginTop: 30, maxWidth: 670 }}>
            {renderMarkedText(content.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.04,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 660 }}>
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.26,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, content.supportLine, content.footer)}
        </div>
      )}
    </div>
  );
};

const notebookSingle = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;
  const headlineSize = scaleByLength(content.headline, 82, 56, 90);
  const bodySize = scaleByLength(content.body, 36, 28, 190);

  return frame(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 138,
        paddingBottom: 92,
        paddingLeft: 96,
        paddingRight: 96
      }}
    >
      {panel(
        item,
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
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            {tagRow(palette, titleCase(item.contentMode))}
            <div
              style={{
                display: "flex",
                width: 92,
                height: 18,
                backgroundColor: palette.accentSoft,
                opacity: 0.4
              }}
            />
          </div>
          <div style={{ display: "flex", marginTop: 32, maxWidth: 690 }}>
            {renderMarkedText(content.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.02,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 28, maxWidth: 670 }}>
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, content.supportLine, content.footer)}
        </div>,
        {
          width: 840
        }
      )}
    </div>
  );
};

const broadsideSingle = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;
  const headlineSize = scaleByLength(content.headline, 68, 46, 110);
  const bodySize = scaleByLength(content.body, 32, 25, 320);

  return frame(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 146,
        paddingBottom: 98,
        paddingLeft: 96,
        paddingRight: 96,
        justifyContent: "center"
      }}
    >
      {panel(
        item,
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {tagRow(palette, item.topic || titleCase(item.contentMode))}
          <div style={{ display: "flex", marginTop: 30, maxWidth: 620 }}>
            {renderMarkedText(content.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.06,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 28, maxWidth: 620 }}>
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.34,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, content.supportLine, content.footer)}
        </div>,
        {
          width: 720,
          minHeight: 1030
        }
      )}
    </div>
  );
};

const darkSingle = (item: QueueItem) => {
  const palette = resolvePalette(item.palette);
  const content = item.single!;
  const headlineSize = scaleByLength(content.headline, 78, 54, 84);
  const bodySize = scaleByLength(content.body, 34, 28, 180);

  return frame(
    item,
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 136,
        paddingBottom: 92,
        paddingLeft: 90,
        paddingRight: 90,
        alignItems: "center"
      }}
    >
      {panel(
        item,
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {tagRow(palette, item.topic || titleCase(item.contentMode))}
          <div style={{ display: "flex", marginTop: 32, maxWidth: 660 }}>
            {renderMarkedText(content.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.04,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 650 }}>
            {renderMarkedText(content.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, content.supportLine, content.footer)}
        </div>,
        {
          width: 780,
          minHeight: 980
        }
      )}
    </div>
  );
};

const carouselPage = (
  item: QueueItem,
  slide: CarouselSlide,
  index: number,
  renderer: (item: QueueItem, slide: CarouselSlide, index: number) => ReactElement
) => frame(item, renderer(item, slide, index), { page: pageLabel(index) });

const wallCarouselContent = (item: QueueItem, slide: CarouselSlide) => {
  const palette = resolvePalette(item.palette);
  const headlineSize = scaleByLength(slide.headline, 72, 50, 76);
  const bodySize = scaleByLength(slide.body, 34, 28, 180);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 138,
        paddingBottom: 94,
        paddingLeft: 92,
        paddingRight: 92,
        alignItems: "center"
      }}
    >
      {panel(
        item,
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {tagRow(palette, slide.kicker || item.topic || titleCase(item.contentMode))}
          <div style={{ display: "flex", marginTop: 30, maxWidth: 670 }}>
            {renderMarkedText(slide.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.04,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 660 }}>
            {renderMarkedText(slide.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, slide.footer, undefined)}
        </div>
      )}
    </div>
  );
};

const notebookCarouselContent = (item: QueueItem, slide: CarouselSlide) => {
  const palette = resolvePalette(item.palette);
  const headlineSize = scaleByLength(slide.headline, 78, 54, 84);
  const bodySize = scaleByLength(slide.body, 34, 28, 170);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 138,
        paddingBottom: 92,
        paddingLeft: 96,
        paddingRight: 96
      }}
    >
      {panel(
        item,
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
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            {tagRow(palette, slide.kicker || titleCase(item.contentMode))}
            <div
              style={{
                display: "flex",
                width: 92,
                height: 18,
                backgroundColor: palette.accentSoft,
                opacity: 0.4
              }}
            />
          </div>
          <div style={{ display: "flex", marginTop: 30, maxWidth: 690 }}>
            {renderMarkedText(slide.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.03,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 670 }}>
            {renderMarkedText(slide.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, slide.footer, undefined)}
        </div>,
        {
          width: 840
        }
      )}
    </div>
  );
};

const broadsideCarouselContent = (item: QueueItem, slide: CarouselSlide) => {
  const palette = resolvePalette(item.palette);
  const headlineSize = scaleByLength(slide.headline, 62, 44, 88);
  const bodySize = scaleByLength(slide.body, 31, 24, 240);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 146,
        paddingBottom: 98,
        paddingLeft: 96,
        paddingRight: 96,
        justifyContent: "center"
      }}
    >
      {panel(
        item,
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {tagRow(palette, slide.kicker || item.topic || titleCase(item.contentMode))}
          <div style={{ display: "flex", marginTop: 28, maxWidth: 620 }}>
            {renderMarkedText(slide.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.06,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 24, maxWidth: 620 }}>
            {renderMarkedText(slide.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.34,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, slide.footer, undefined)}
        </div>,
        {
          width: 720,
          minHeight: 1030
        }
      )}
    </div>
  );
};

const darkCarouselContent = (item: QueueItem, slide: CarouselSlide) => {
  const palette = resolvePalette(item.palette);
  const headlineSize = scaleByLength(slide.headline, 72, 50, 80);
  const bodySize = scaleByLength(slide.body, 34, 28, 170);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 136,
        paddingBottom: 92,
        paddingLeft: 90,
        paddingRight: 90,
        alignItems: "center"
      }}
    >
      {panel(
        item,
        palette,
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          {tagRow(palette, slide.kicker || item.topic || titleCase(item.contentMode))}
          <div style={{ display: "flex", marginTop: 32, maxWidth: 660 }}>
            {renderMarkedText(slide.headline, {
              fontFamily: "Instrument Serif",
              fontSize: headlineSize,
              lineHeight: 1.04,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 12,
              highlightPaddingY: 3
            })}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 650 }}>
            {renderMarkedText(slide.body, {
              fontFamily: "Newsreader",
              fontSize: bodySize,
              lineHeight: 1.28,
              color: palette.text,
              highlightBackground: palette.marker,
              highlightColor: palette.markerText,
              highlightPaddingX: 10,
              highlightPaddingY: 2,
              paragraphGap: 18
            })}
          </div>
          {footerBlock(palette, slide.footer, undefined)}
        </div>,
        {
          width: 780,
          minHeight: 980
        }
      )}
    </div>
  );
};

export const renderItemCard = (item: QueueItem) => {
  if (item.kind === "carousel" && item.carousel) {
    return item.carousel.map((slide, index) => {
      if (item.templateFamily === "notebook" || item.templateFamily === "lesson") {
        return carouselPage(item, slide, index, notebookCarouselContent);
      }

      if (item.templateFamily === "broadside") {
        return carouselPage(item, slide, index, broadsideCarouselContent);
      }

      if (item.templateFamily === "signal") {
        return carouselPage(item, slide, index, darkCarouselContent);
      }

      return carouselPage(item, slide, index, wallCarouselContent);
    });
  }

  if (item.templateFamily === "notebook" || item.templateFamily === "lesson") {
    return [notebookSingle(item)];
  }

  if (item.templateFamily === "broadside") {
    return [broadsideSingle(item)];
  }

  if (item.templateFamily === "signal") {
    return [darkSingle(item)];
  }

  return [wallSingle(item)];
};
