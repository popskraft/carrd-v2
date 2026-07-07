# Plugin README Template

## Purpose

Create short, consistent end-user guides and generate `dist/<plugin>/README.md` without manual edits.

## Source Format

Write `src/<plugin>/README.md` in English:

```markdown
# Plugin Title

One sentence explaining the user-visible result.

## Carrd Setup

Numbered Carrd steps and required names, classes, IDs, or attributes.

## Configuration

State whether defaults work. Show only useful user-facing options.

## Verify

Short success check and the most likely setup error.
```

Optional sections after `Verify`: `Design`, `Advanced: ...`, `API`, `Troubleshooting`.

Do not add `Install`, version, build metadata, repository commands, or jsDelivr URLs to a source README.

## Generated Format

`scripts/minify_plugins.py` combines the source README with `scripts/templates/plugin_readme.md` in this order:

1. Title and one-sentence summary.
2. Version.
3. Generated install methods.
4. Plugin-specific source sections.

Install content is derived automatically:

- Bundle membership comes from `bundle.config.json`.
- Shared-theme requirements come from the plugin's CSS files.
- Script placement uses the same helper as generated CDN snippets.
- Split inline files come from `SPLIT_EMBED_PLUGINS`.

The generated README must not contain a build date. Identical source, version, and configuration must produce identical plugin README content.

## Writing Rules

- Describe Carrd actions, not plugin internals.
- Keep one setup path and one verification path.
- Say when defaults require no configuration.
- Put `window.CarrdPluginOptions` above the bundle or plugin script.
- Put design overrides in a separate `Head` style embed after theme files.
- Keep advanced sections only when they change a real user workflow.
- Never edit `dist/<plugin>/README.md` directly.

## Done

1. Run `npm run build:docs`.
2. Run `python3 -m unittest tests.test_minify_plugins`.
3. Confirm bundled and add-on wording matches `bundle.config.json`.
4. Confirm `no-loadwaiting` uses `Head` and split plugins list both inline parts.
