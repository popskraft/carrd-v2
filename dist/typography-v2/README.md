# Typography V2

## Version

- Version: `2.0.0`
- Build date (UTC): `2026-06-23`

## Installation

### CDN Bundle (recommended)

If your site already has the CDN embeds installed (`theme-core-v2.min.css` in Head and `theme-core-v2.min.js` in Body End), this plugin is already active — no extra steps needed.

To install CDN embeds: see the root `README.md` → **CDN Bundle** section.

### CDN Individual (single plugin)

Use this when you want jsDelivr links for selected plugins instead of the full bundle.

**Step 1 — Install shared theme header (once per site)**

In Carrd add `Embed → Code → Hidden → Head` and paste:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-design-tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/popskraft/carrd-v2@main/dist/theme-ui.css">
```

**Step 2 — Install this plugin through CDN**

1. Open `typography-v2-cdn.html` from this folder.
2. Paste the `<!-- Head -->` part into `Hidden → Head`.
3. Paste the `<!-- Body End -->` part into `Hidden → Body End` when present.
4. Publish the page and refresh.

### Inline Embed (single plugin)

Use this when installing only selected plugins without the CDN bundle.

**Step 1 — Install theme header (once per site)**

1. Open `theme-design-system.html` from the `dist/` folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Head` and paste.

**Step 2 — Install this plugin**

1. Open `typography-v2-embed.html` from this folder.
2. Copy the full contents.
3. In Carrd add `Embed → Code → Hidden → Body End` and paste.
4. Publish the page and refresh.

## How To Change Styles

If this README contains a `:root { ... }` block later, do not paste it into the plugin code block itself.

Create a separate hidden `Head` style block below `theme-design-system.html` and place the overrides there.

Example of a separate settings block:

```html
<style>
:root {
  /* Put your overrides here */
}
</style>
```

Place that style block below `theme-design-system.html`.

---

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
window.CarrdPluginOptionsV2 = {
    typography: {
        containerSelector: '.txt',
        paragraphSelector: 'span.p'
    }
};
</script>
```

If you use multiple plugins, create one shared `window.CarrdPluginOptionsV2` block and place it once above all plugin embeds.

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
CarrdTypographyV2.init();
CarrdTypographyV2.process(element);
```
