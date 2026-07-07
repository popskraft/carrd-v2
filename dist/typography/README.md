# Typography

Converts Markdown-like plain text inside `.txt` blocks into styled typography.

Version: `2.0.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-core` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `typography-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `typography-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Add a **Text** element or **Container**.
2. Add class `txt`.
3. Write content with this syntax:

| Input | Output |
|---|---|
| `# Heading` | H1 |
| `## Heading` | H2 |
| `### Heading` | H3 |
| `#### Heading` | H4 |
| `---` | Horizontal rule |
| `- Item` | Unordered list item |
| `1. Item` | Ordered list item |

HTML tables inside `.txt` receive the shared table styles automatically.

## Configuration

No configuration is required. To use different selectors, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  typography: {
    containerSelector: '.txt',
    paragraphSelector: 'span.p'
  }
};
</script>
```

## Verify

1. Publish or refresh the page.
2. Confirm headings, lists, rules, and tables render with the theme styles.

If nothing changes, confirm the class is exactly `txt`.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-color-headlines: #19355a;
  --theme-color-border: #efefef;
}
</style>
```

## API

```javascript
CarrdTypography.init();
CarrdTypography.process(element);
```
