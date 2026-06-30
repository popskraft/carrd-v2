# Typography

Turns a `.txt` container into cleaner text with Markdown-like parsing. Use headings, lists, and rules in plain text — no HTML needed.

---

## What You Do in Carrd

1. Add a **Text** element or **Container** to your page.
2. Open its class panel and add the class `txt`.
3. Write your content using the syntax below.

### Syntax

| What you type | What appears |
|---------------|-------------|
| `# Heading` | H1 |
| `## Heading` | H2 |
| `### Heading` | H3 |
| `#### Heading` | H4 |
| `---` | Horizontal rule |
| `- Item` | Unordered list item |
| `1. Item` | Ordered list item |

An HTML `<table>` inside `.txt` gets typography table styles automatically.

---

## How It Works in Carrd

- The plugin scans each `.txt` container and replaces plain-text syntax with styled headings, lists, and rules.
- The original Carrd text flow stays intact; only the rendered structure is enhanced.
- Tables inside `.txt` receive shared typography table styles automatically.

---

## How To Check That It Works

1. Publish or refresh the page.
2. Confirm headings and lists render with the intended styles.
3. Confirm any table inside `.txt` has styled borders and spacing.

If nothing changes, check that the class is exactly `txt`.

---

## Configuration

No configuration is needed for normal use.

Add a **Code** embed and paste this block **above** the plugin embed if you want to change the selectors:

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

If you use multiple plugins, create one shared `window.CarrdPluginOptions` block and place it once above all plugin embeds.

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `containerSelector` | `.txt` | Selector for text containers |
| `paragraphSelector` | `span.p` | Selector for paragraph spans |
| `headingClasses` | `{ h1: 'theme-typography-h1', ... }` | CSS classes applied to headings |
| `listClasses` | `{ ul: 'theme-typography-ul', ... }` | CSS classes applied to lists |
| `hrClass` | `theme-typography-hr` | CSS class applied to horizontal rules |

---

## Design

Add a **Code** embed with a `<style>` tag and override any of these variables:

```html
<style>
:root {
    --theme-color-headlines: #19355A;
    --theme-color-border: #efefef;
}
</style>
```

| Variable | Default | What it changes |
|----------|---------|-----------------|
| `--theme-color-headlines` | `#19355A` | Heading color |
| `--theme-color-border` | `#efefef` | Horizontal rule and table border color |

---

## API

Use only if you need to re-initialize text blocks from a custom embed:

```javascript
CarrdTypography.init();
CarrdTypography.process(element);
```
