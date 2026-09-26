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

// These checks run several times per element on mount and on every update:
// plain loops, no closure per key.

function hasDefinedProp(props: Props, keys: readonly string[]): boolean {
  for (let i = 0; i < keys.length; i++) {
    if (props[keys[i]] !== undefined) return true;
  }
  return false;
}

export function hasLayoutContainerProps(props: Props): boolean {
  return Boolean(props.isRoot) || hasDefinedProp(props, CONTAINER_LAYOUT_PROPS);
}

export function hasLayoutNodeProps(props: Props): boolean {
  if (hasLayoutContainerProps(props)) return true;
  if (
    (typeof props.width === "string" && props.width.endsWith("%")) ||
    (typeof props.height === "string" && props.height.endsWith("%"))
  ) {
    return true;
  }
  for (let i = 0; i < ITEM_LAYOUT_PROPS.length; i++) {
    const key = ITEM_LAYOUT_PROPS[i];
    if (key === "border" ? isLayoutBorder(props.border) : props[key] !== undefined) return true;
  }
  return false;
}

function containsPercentage(value: unknown): boolean {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (containsPercentage(value[i])) return true;
    }
    return false;
  }
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

  if (hasDefinedProp(props, FLEX_ITEM_PROPS)) return true;

  for (let i = 0; i < PERCENTAGE_DEPENDENT_PROPS.length; i++) {
    if (containsPercentage(props[PERCENTAGE_DEPENDENT_PROPS[i]])) return true;
  }
  return false;
}

export function withLayoutSize(
  props: Props,
  width: Size,
  height: Size,
): Props {
  return { ...props, width, height };
}
