import { tokenize, type TagAttrs } from "picotags";

export interface Colorizer {
  wrap: (name: string, input: string | number | null | undefined) => string;
  is: (name: string) => boolean;
}

type ColorNodeObject =  {
  tag: string;
  attrs: TagAttrs;
  rawOpen: string;
  children: ColorNode[];
}

type ColorNodeText = string;

type ColorNode = ColorNodeText | ColorNodeObject;

type FormatColorOptions = {
  colorizer: Colorizer | undefined;
  message: string;
  stripColorTags: boolean;
  styleTagAliases?: boolean;
}

const STYLE_TAG_ALIASES = {
  b: "bold",
  strong: "bold",
  i: "italic",
  em: "italic",
  u: "underline",
  s: "strikethrough",
  del: "strikethrough",
} as const;

function normalizeTag(tag: string, styleTagAliases = false): string {
  if (!styleTagAliases) {
    return tag;
  }
  return STYLE_TAG_ALIASES[tag as keyof typeof STYLE_TAG_ALIASES] ?? tag;
}

function isRenderableTag(
  tag: string,
  colorizer: Colorizer | undefined,
  styleTagAliases = false,
): boolean {
  const normalizedTag = normalizeTag(tag, styleTagAliases);
  return normalizedTag === "span" || !!colorizer?.is(normalizedTag);
}

function parseColorMarkup({
  colorizer,
  message,
  stripColorTags,
  styleTagAliases,
}: FormatColorOptions): ColorNode[] {
  const root: { children: ColorNode[] } = { children: [] };
  const stack: Array<ColorNodeObject> = [
    { tag: "", rawOpen: "", attrs: {}, children: root.children },
  ];

  for (const token of tokenize(message)) {
    switch (token.type) {
      case "text":
        stack[stack.length - 1].children.push(token.text);
        break;
      case "opentag":
        if (isRenderableTag(token.name, colorizer, styleTagAliases)) {
          const node = {
            tag: token.name,
            attrs: token.attrs,
            rawOpen: token.raw,
            children: [],
          };
          stack[stack.length - 1].children.push(node);
          stack.push(node);
        } else if (!stripColorTags) {
          stack[stack.length - 1].children.push(token.raw);
        }
        break;
      case "closetag": {
        const current = stack[stack.length - 1];
        if (
          isRenderableTag(token.name, colorizer, styleTagAliases)
          && current.tag === token.name
          && stack.length > 1
        ) {
          stack.pop();
        } else if (!stripColorTags) {
          stack[stack.length - 1].children.push(token.raw);
        }
        break;
      }
      case "selfclosetag":
        if (!stripColorTags) {
          stack[stack.length - 1].children.push(token.raw);
        }
        break;
    }
  }

  while (stack.length > 1) {
    // If a supported tag is never closed, keep its children and optionally keep the raw tag text.
    const node = stack.pop()!;
    const parent = stack[stack.length - 1];
    const nodeIndex = parent.children.lastIndexOf(node);
    if (nodeIndex !== -1) {
      if (stripColorTags) {
        parent.children.splice(nodeIndex, 1, ...node.children);
      } else {
        parent.children.splice(
          nodeIndex,
          1,
          node.rawOpen,
          ...node.children,
        );
      }
    }
  }

  return root.children;
}

function applyColor(
  colorizer: Colorizer,
  tag: string,
  attrs: TagAttrs,
  message: string,
  styleTagAliases = false,
): string {
  for (const [key, value] of Object.entries(attrs)) {
    switch (key) {
      case "bold":
      case "italic":
      case "inverse":
      case "underline":
      case "strikethrough":
        if (colorizer.is(key)) {
          message = colorizer.wrap(key, message)
        }
        break;
      case "color":
        if (typeof value === "string" && value !== "") {
          for (const token of value.split(/\s+/)) {
            if (colorizer.is(token)) {
              message = colorizer.wrap(token, message)
            }
          }
        }
        break;
    }
  }

  const normalizedTag = normalizeTag(tag, styleTagAliases)

  if (normalizedTag !== "span" && colorizer.is(normalizedTag)) {
    return colorizer.wrap(normalizedTag, message)
  }

  return message
}

function renderNodes(
  colorizer: Colorizer | undefined,
  nodes: ColorNode[],
  styleTagAliases = false,
): string {
  return nodes.map((node) => {
    if (typeof node === "string") return node;
    const content = renderNodes(colorizer, node.children, styleTagAliases);
    if (!colorizer) return content;
    return applyColor(colorizer, node.tag, node.attrs, content, styleTagAliases);
  }).join("");
}

export function formatColorTags(options: FormatColorOptions): string {
  try {
    const nodes = parseColorMarkup(options);
    return renderNodes(options.colorizer, nodes, options.styleTagAliases);
  } catch {
    // Formatting should never break logging; fall back to the original message on malformed markup.
    return options.message;
  }
}

export function stripColorTags(message: string, strip = false): string {
  return formatColorTags({
    colorizer: undefined,
    message,
    stripColorTags: strip,
    styleTagAliases: false,
  });
}
