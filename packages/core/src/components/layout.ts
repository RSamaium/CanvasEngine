import type { Props } from "../engine/reactive";
import type { EdgeSize, LayoutBorder, Size } from "./types/DisplayObject";

export type LayoutStyle = Record<string, unknown>;

const DIRECT_LAYOUT_PROPS = [
  "display",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "aspectRatio",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignContent",
  "alignSelf",
  "gap",
  "rowGap",
  "columnGap",
  "top",
  "right",
  "bottom",
  "left",
  "objectFit",
  "objectPosition",
  "transformOrigin",
] as const;

const CONTAINER_LAYOUT_PROPS = [
  "display",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignContent",
  "gap",
  "rowGap",
  "columnGap",
  "padding",
] as const;

const ITEM_LAYOUT_PROPS = [
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "aspectRatio",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignSelf",
  "top",
  "right",
  "bottom",
  "left",
  "objectFit",
  "objectPosition",
  "transformOrigin",
  "positionType",
  "margin",
  "border",
] as const;

const FLEX_ITEM_PROPS = [
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignSelf",
  "margin",
] as const;

const PERCENTAGE_DEPENDENT_PROPS = [
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "top",
  "right",
  "bottom",
  "left",
] as const;

type EdgePrefix = "margin" | "padding";

function expandEdges(prefix: EdgePrefix, value: EdgeSize): LayoutStyle {
  if (!Array.isArray(value)) return { [prefix]: value };

  if (value.length === 2) {
    const [vertical, horizontal] = value;
    return {
      [`${prefix}Top`]: vertical,
      [`${prefix}Right`]: horizontal,
      [`${prefix}Bottom`]: vertical,
      [`${prefix}Left`]: horizontal,
    };
  }

  const [top, right, bottom, left] = value;
  return {
    [`${prefix}Top`]: top,
    [`${prefix}Right`]: right,
    [`${prefix}Bottom`]: bottom,
    [`${prefix}Left`]: left,
  };
}

export function isLayoutBorder(value: unknown): value is LayoutBorder {
  return (
    typeof value === "number" ||
    (Array.isArray(value) &&
      (value.length === 2 || value.length === 4) &&
      value.every((side) => typeof side === "number"))
  );
}

function expandBorder(value: LayoutBorder): LayoutStyle {
  if (!Array.isArray(value)) return { borderWidth: value };

  if (value.length === 2) {
    const [vertical, horizontal] = value;
    return {
      borderTopWidth: vertical,
      borderRightWidth: horizontal,
      borderBottomWidth: vertical,
      borderLeftWidth: horizontal,
    };
  }

  const [top, right, bottom, left] = value;
  return {
    borderTopWidth: top,
    borderRightWidth: right,
    borderBottomWidth: bottom,
    borderLeftWidth: left,
  };
}

function anchorToTransformOrigin(anchor: unknown): string | undefined {
  if (Array.isArray(anchor) && anchor.length === 2) {
    return `${Number(anchor[0]) * 100}% ${Number(anchor[1]) * 100}%`;
  }
  if (anchor && typeof anchor === "object" && "x" in anchor && "y" in anchor) {
    const point = anchor as { x: number; y: number };
    return `${Number(point.x) * 100}% ${Number(point.y) * 100}%`;
  }
  return undefined;
}

export function normalizeLayoutProps(
  props: Props,
  options: { containerAnchor?: boolean } = {},
): LayoutStyle {
  const style: LayoutStyle = {};

  for (const key of DIRECT_LAYOUT_PROPS) {
    if (props[key] !== undefined) style[key] = props[key];
  }

  if (props.positionType !== undefined) style.position = props.positionType;
  if (props.margin !== undefined) Object.assign(style, expandEdges("margin", props.margin));
  if (props.padding !== undefined) Object.assign(style, expandEdges("padding", props.padding));
  if (isLayoutBorder(props.border)) Object.assign(style, expandBorder(props.border));

  if (
    options.containerAnchor &&
    props.transformOrigin === undefined &&
    props.anchor !== undefined
  ) {
    const transformOrigin = anchorToTransformOrigin(props.anchor);
    if (transformOrigin) style.transformOrigin = transformOrigin;
  }

  return style;
}

export function hasLayoutContainerProps(props: Props): boolean {
  return Boolean(
    props.isRoot ||
      CONTAINER_LAYOUT_PROPS.some((key) => props[key] !== undefined),
  );
}

export function hasLayoutNodeProps(props: Props): boolean {
  if (hasLayoutContainerProps(props)) return true;
  if (
    (typeof props.width === "string" && props.width.endsWith("%")) ||
    (typeof props.height === "string" && props.height.endsWith("%"))
  ) {
    return true;
  }
  return ITEM_LAYOUT_PROPS.some((key) =>
    key === "border" ? isLayoutBorder(props.border) : props[key] !== undefined,
  );
}

function containsPercentage(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsPercentage);
  return typeof value === "string" && value.endsWith("%");
}

/**
 * Returns true when a node uses layout values that cannot be resolved without
 * a Yoga box on its direct parent.
 *
 * A fixed-size flex container can be an independent Yoga root. Percentages,
 * trailing insets and flex-item properties, however, are relative to a parent.
 */
export function requiresLayoutParent(props: Props): boolean {
  if (props.right !== undefined || props.bottom !== undefined) return true;

  if (FLEX_ITEM_PROPS.some((key) => props[key] !== undefined)) return true;

  return PERCENTAGE_DEPENDENT_PROPS.some((key) =>
    containsPercentage(props[key]),
  );
}

export function withLayoutSize(
  props: Props,
  width: Size,
  height: Size,
): Props {
  return { ...props, width, height };
}
