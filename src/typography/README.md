# Typography

Converts Markdown-like plain text inside `.txt` blocks into styled typography.

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
