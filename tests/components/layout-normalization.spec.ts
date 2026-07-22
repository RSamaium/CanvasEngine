import { describe, expect, it } from "vitest";
import {
  hasLayoutContainerProps,
  hasLayoutNodeProps,
  isLayoutBorder,
  normalizeLayoutProps,
} from "../../packages/core/src/components/layout";

describe("layout prop normalization", () => {
  it("expands two-value spacing using CSS vertical/horizontal semantics", () => {
    expect(normalizeLayoutProps({ padding: [10, 20], margin: [5, 15] })).toMatchObject({
      paddingTop: 10,
      paddingRight: 20,
      paddingBottom: 10,
      paddingLeft: 20,
      marginTop: 5,
      marginRight: 15,
      marginBottom: 5,
      marginLeft: 15,
    });
  });

  it("expands four-value structural borders to Yoga keys", () => {
    expect(normalizeLayoutProps({ border: [1, 2, 3, 4] })).toMatchObject({
      borderTopWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 3,
      borderLeftWidth: 4,
    });
  });

  it("preserves zero values", () => {
    expect(normalizeLayoutProps({ gap: 0, padding: 0, margin: 0, border: 0 })).toEqual({
      gap: 0,
      margin: 0,
      padding: 0,
      borderWidth: 0,
    });
  });

  it("keeps Pixi stroke objects out of Yoga styles", () => {
    const border = { width: 2, color: "#ffffff" };
    expect(isLayoutBorder(border)).toBe(false);
    expect(normalizeLayoutProps({ border })).toEqual({});
  });

  it("maps positionType and container anchors", () => {
    expect(normalizeLayoutProps(
      { positionType: "absolute", anchor: [0.25, 0.75] },
      { containerAnchor: true },
    )).toMatchObject({
      position: "absolute",
      transformOrigin: "25% 75%",
    });
  });

  it("distinguishes standalone items from layout containers", () => {
    expect(hasLayoutContainerProps({ width: 100, height: 100 })).toBe(false);
    expect(hasLayoutNodeProps({ width: 100, height: 100 })).toBe(false);
    expect(hasLayoutNodeProps({ width: "100%" })).toBe(true);
    expect(hasLayoutContainerProps({ gap: 10 })).toBe(true);
  });
});
