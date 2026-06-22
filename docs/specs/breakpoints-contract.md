# Screen Breakpoints Contract

## Purpose

Canonical shared breakpoint ladder for Carrd CSS in this workspace.

## Contract

| Breakpoint | Max-Width |
|---|---|
| Desktop XL | 1920px |
| Desktop L | 1680px |
| Desktop M | 1280px |
| Desktop | 1024px |
| Tablet L | 980px |
| Tablet/Mobile | 736px |
| Mobile S | 480px |
| Mobile XS | 360px |

Use these values in media queries when a project needs the shared Carrd breakpoint set.

```css
@media (max-width: 1920px) { }
@media (max-width: 1680px) { }
@media (max-width: 1280px) { }
@media (max-width: 1024px) { }
@media (max-width: 980px) { }
@media (max-width: 736px) { }
@media (max-width: 480px) { }
@media (max-width: 360px) { }
```

## Notes

- Exact spacing, type scale, and layout changes still belong to each project design system.
- Reference the project CSS implementation for final responsive behavior.
