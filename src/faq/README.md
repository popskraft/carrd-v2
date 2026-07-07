# Faq

Turns a marked Carrd container into an accordion-style FAQ.

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

No global JavaScript configuration is required.

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
