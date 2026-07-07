# Faq

Turns a marked Carrd container into an accordion-style FAQ.

Version: `2.1.0`

## Install

Choose one method.

### CDN Bundle (recommended)

`theme-runtime` already includes this plugin. Install the bundle from the [root guide](../README.md), then continue with **Carrd Setup** below.

### CDN Individual

1. Install the shared theme files once using **CDN Individual** in the [root guide](../README.md).
2. Open `faq-cdn.html`.
3. Paste the `Head` and `Body End` blocks into the matching Carrd locations.
4. Publish and refresh.

### Inline Embed

1. Install `theme-design-system.html` once in `Hidden → Head` using the [root guide](../README.md).
2. Open `faq-embed.html`.
3. Paste the full file into `Code → Hidden → Body End`.
4. Publish and refresh.

## Carrd Setup

1. Add a **Container** and set `data-faq=main`.
2. Inside it, build each item as **Divider → Heading → answer content**.
3. Add a **Divider** before the first question.
4. Repeat the same structure for every question.

## Configuration

Add either attribute to the FAQ container when needed:

| Attribute | Result |
|---|---|
| `data-faq-allow-multiple=true` | Keeps multiple answers open |
| `data-faq-default-open=true` | Opens the first answer on load |

To change global defaults or the divider/heading detection, add this in `Body End` above the bundle or plugin script:

```html
<script>
window.CarrdPluginOptions = {
  faq: {
    allowMultipleOpen: false,
    defaultOpen: false
  }
};
</script>
```

| Option | Default | Result |
|---|---|---|
| `allowMultipleOpen` | `false` | Global default for `data-faq-allow-multiple` |
| `defaultOpen` | `false` | Global default for `data-faq-default-open` |
| `dividerSelector` | `'hr.divider-component'` | Selector used to detect the divider that starts each question |
| `headerTags` | `['H1', 'H2', 'H3']` | Tag names recognized as a question heading |

## Verify

1. Publish or refresh the page.
2. Confirm questions are visible and answers are closed.
3. Click a question twice and confirm its answer opens, then closes.

If nothing opens, confirm `data-faq` exists and a divider comes before the first question.

## Design

Add a separate `Head` style embed after the theme files:

```html
<style>
:root {
  --theme-faq-spacing: 0.75rem;
  --theme-faq-icon-size: 1.75rem;
  --theme-faq-icon-color: var(--theme-color-primary);
}
</style>
```

## Advanced: State Classes

Open questions receive `.is-open`; closed questions receive `.is-closed`.
