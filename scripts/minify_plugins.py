import argparse
import json
import shutil
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple, Dict

try:
    # Package import path for tests (`from scripts import minify_plugins`)
    from .minifier import minify_css, minify_js
except ImportError:
    # Direct script execution path (`python3 scripts/minify_plugins.py`)
    from minifier import minify_css, minify_js

# Files to exclude from minification (just copy)
MINIFY_EXCLUDES = {
    "styles.html", "scripts.html", # Special theme files
}

# Plugins/directories that should not be published into dist/
DIST_BUILD_EXCLUDES = {
    "columns",
}

# Top-level dist sections that are intentionally disabled
DIST_SECTION_EXCLUDES = set()

# Directories (relative to src/) to EXCLUDE from theme bundling
THEME_BUNDLE_EXCLUDES = {
    # "shopping-cart",
    "columns",
    "no-loadwaiting",
}

DIST_FILE_EXCLUDES = {
    "theme-config.js",
}

PluginMetadata = Tuple[Path, str]  # (Path to plugin dir, Plugin Name)
SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = SCRIPT_DIR / "templates"
ROOT_README_TEMPLATE = "root_readme.md"
PLUGIN_README_TEMPLATE = "plugin_readme.md"
INCLUDED_PLUGINS_TEMPLATE = "included_plugins_table.md"
VERSION_FILE = "VERSION"
SPLIT_EMBED_PLUGINS = {
    "shopping-cart",
    "slider",
}
BUNDLE_CONFIG_FILE = "bundle.config.json"
HEADER_NAV_CRITICAL_CSS = (
    "@media (max-width: 736px) { "
    "#header:not(.is-nav-open) .header-mobile-el-collapsing { display: none !important; } "
    "}"
)
REQUIRED_PLUGIN_README_SECTIONS = (
    "Carrd Setup",
    "Configuration",
    "Verify",
)
ALLOWED_PLUGIN_README_TAIL_SECTIONS = (
    "Design",
    "Advanced:",
    "API",
    "Troubleshooting",
)


def build_html_banner(title: str, version: str) -> str:
    return f"<!-- Plugin: {title} | Version: {version} -->"


def plugin_script_placement(plugin_slug: str, has_js: bool = True) -> str:
    if plugin_slug == "no-loadwaiting" or not has_js:
        return "Head"
    return "Body End"


def markdown_steps(steps: List[str]) -> str:
    return "\n".join(f"{index}. {step}" for index, step in enumerate(steps, start=1))


def build_cdn_paste_step(plugin_slug: str, has_css: bool, has_js: bool) -> str:
    placements: List[str] = []
    if has_css:
        placements.append("Head")
    if has_js:
        placements.append(plugin_script_placement(plugin_slug))
    placements = list(dict.fromkeys(placements))

    if placements == ["Head"]:
        return "Paste the marked block into `Hidden → Head`."
    if placements == ["Body End"]:
        return "Paste the marked block into `Hidden → Body End`."
    return "Paste the `Head` and `Body End` blocks into the matching Carrd locations."


def build_inline_install_steps(
    plugin_slug: str,
    needs_shared_theme: bool,
    has_js: bool,
) -> str:
    steps: List[str] = []
    if needs_shared_theme:
        steps.append(
            "Install `theme-design-system.html` once in `Hidden → Head` "
            "using the [root guide](../README.md)."
        )

    if plugin_slug in SPLIT_EMBED_PLUGINS:
        steps.extend([
            f"Open `{plugin_slug}-embed-part1.html` and `{plugin_slug}-embed-part2.html`.",
            "Add two `Code → Hidden → Body End` embeds.",
            "Paste part 1 into the first embed and part 2 into the second.",
            "Keep that order, publish, and refresh.",
        ])
        return markdown_steps(steps)

    placement = plugin_script_placement(plugin_slug, has_js)
    steps.extend([
        f"Open `{plugin_slug}-embed.html`.",
        f"Paste the full file into `Code → Hidden → {placement}`.",
        "Publish and refresh.",
    ])
    return markdown_steps(steps)


def build_plugin_installation(
    repo_root: Path,
    plugin_dir: Path,
    has_css: bool,
    has_js: bool,
) -> str:
    plugin_slug = plugin_dir.name
    bundle_config = load_bundle_config(repo_root).get("cdn_bundle", {})
    bundle_name = bundle_config.get("name", "theme-runtime")
    bundled_plugins = set(bundle_config.get("plugins", []))
    bundle_enabled = bundle_config.get("enabled", False)
    is_bundled = bundle_enabled and plugin_slug in bundled_plugins

    sections = ["## Install", "", "Choose one method.", ""]
    if bundle_enabled:
        if is_bundled:
            sections.extend([
                "### CDN Bundle (recommended)",
                "",
                f"`{bundle_name}` already includes this plugin. Install the bundle from the "
                "[root guide](../README.md), then continue with **Carrd Setup** below.",
                "",
            ])
        else:
            sections.extend([
                "### Bundle Add-on (recommended when the bundle is installed)",
                "",
                f"`{bundle_name}` does not include this plugin.",
                "",
                markdown_steps([
                    f"Install `{bundle_name}` from the [root guide](../README.md).",
                    f"Open `{plugin_slug}-cdn.html`.",
                    build_cdn_paste_step(plugin_slug, has_css, has_js),
                    "Publish and refresh.",
                ]),
                "",
            ])

    cdn_steps: List[str] = []
    if has_css:
        cdn_steps.append(
            "Install the shared theme files once using **CDN Individual** in the "
            "[root guide](../README.md)."
        )
    cdn_steps.extend([
        f"Open `{plugin_slug}-cdn.html`.",
        build_cdn_paste_step(plugin_slug, has_css, has_js),
        "Publish and refresh.",
    ])
    sections.extend([
        "### CDN Individual",
        "",
        markdown_steps(cdn_steps),
        "",
        "### Inline Embed",
        "",
        build_inline_install_steps(plugin_slug, has_css, has_js),
    ])

    return "\n".join(sections)


def build_split_embed_parts(
    plugin_slug: str,
    plugin_title: str,
    version: str,
    css_text: str,
    js_text: str,
) -> Tuple[str, str, str]:
    split_at = min(max(len(js_text) // 2, 6000), 8000)
    chunk_one = js_text[:split_at]
    chunk_two = js_text[split_at:]
    state_key = f"__themeSplitEmbed{plugin_slug.replace('-', ' ').title().replace(' ', '')}"

    bootstrap_template = (
        "(function(w,k,i,c){var s=w[k]||(w[k]={p:[],d:0});"
        "s.p[i]=c;"
        "if(s.d||!s.p[0]||!s.p[1])return;"
        "s.d=1;(0,eval)(s.p[0]+s.p[1]);"
        "})(window,__STATE_KEY__,__INDEX__,__CHUNK__);"
    )

    part_one = "\n".join([
        f"<!-- Plugin: {plugin_title} | Version: {version} | Part: 1/2 -->",
        "<style>",
        css_text,
        "</style>",
        "<script>",
        bootstrap_template
        .replace("__STATE_KEY__", json.dumps(state_key))
        .replace("__INDEX__", "0")
        .replace("__CHUNK__", json.dumps(chunk_one)),
        "</script>",
        "",
    ])

    part_two = "\n".join([
        f"<!-- Plugin: {plugin_title} | Version: {version} | Part: 2/2 -->",
        "<script>",
        bootstrap_template
        .replace("__STATE_KEY__", json.dumps(state_key))
        .replace("__INDEX__", "1")
        .replace("__CHUNK__", json.dumps(chunk_two)),
        "</script>",
        "",
    ])

    manifest = "\n".join([
        build_html_banner(plugin_title, version),
        "<!-- Split install required in Carrd due to embed length limits. -->",
        f"<!-- Use {plugin_slug}-embed-part1.html first, then {plugin_slug}-embed-part2.html. -->",
        "",
    ])

    return manifest, part_one, part_two

def copy_shared_theme_assets(
    dist_dir: Path,
    source_dir: Path,
) -> None:
    theme_css = source_dir / "theme-design-tokens.css"
    theme_compat_css = source_dir / "theme-compat.css"
    theme_ui_css = source_dir / "theme-ui.css"

    if theme_css.exists():
        shutil.copy(theme_css, dist_dir / "theme-design-tokens.css")
        print(f"Copied: {dist_dir / 'theme-design-tokens.css'}")
        create_theme_design_tokens_embed(dist_dir, source_dir, read_version(source_dir.parent))
    if theme_ui_css.exists():
        shutil.copy(theme_ui_css, dist_dir / "theme-ui-runtime.css")
        print(f"Copied: {dist_dir / 'theme-ui-runtime.css'}")

        compat_parts: List[str] = [
            "/* Compatibility-only artifact for legacy @main installs. Do not use for new sites. */"
        ]
        if theme_compat_css.exists():
            compat_parts.append(theme_compat_css.read_text(encoding="utf-8").strip())
        compat_parts.append(theme_ui_css.read_text(encoding="utf-8").strip())
        (dist_dir / "theme-ui.css").write_text("\n\n".join(compat_parts) + "\n", encoding="utf-8")
        print(f"Created Compat CSS: {dist_dir / 'theme-ui.css'}")


def create_theme_design_tokens_embed(
    dist_dir: Path,
    source_dir: Path,
    version: str,
) -> None:
    theme_css = source_dir / "theme-design-tokens.css"
    if not theme_css.exists():
        return

    output_path = dist_dir / "theme-design-tokens-embed.html"
    output_path.write_text(
        "\n".join([
            build_html_banner("Theme Design Tokens", version),
            "<style>",
            theme_css.read_text(encoding="utf-8").strip(),
            "</style>",
            "",
        ]),
        encoding="utf-8",
    )
    print(f"Created Embed: {output_path}")


def create_theme_design_system_embed(
    dist_dir: Path,
    source_dir: Path,
    version: str,
) -> None:
    theme_css = source_dir / "theme-design-tokens.css"
    theme_ui_css = source_dir / "theme-ui.css"
    if not theme_css.exists():
        return

    parts: List[str] = [
        build_html_banner("Theme Design System", version),
        "<style>",
        theme_css.read_text(encoding="utf-8").strip(),
    ]

    if theme_ui_css.exists():
        parts.extend([
            "",
            theme_ui_css.read_text(encoding="utf-8").strip(),
        ])

    parts.extend([
        "</style>",
        "",
    ])

    output_path = dist_dir / "theme-design-system.html"
    output_path.write_text("\n".join(parts), encoding="utf-8")
    print(f"Created Embed: {output_path}")


def load_bundle_config(repo_root: Path) -> dict:
    bundle_config_path = repo_root / BUNDLE_CONFIG_FILE
    if not bundle_config_path.exists():
        return {}

    return json.loads(bundle_config_path.read_text(encoding="utf-8"))


def create_cdn_bundle(
    repo_root: Path,
    source_dir: Path,
    dist_dir: Path,
) -> None:
    bundle_root = load_bundle_config(repo_root)
    primary_bundle = bundle_root.get("cdn_bundle", {})
    compat_bundle = bundle_root.get("compat_bundle", {})

    if primary_bundle.get("enabled", False):
        create_named_cdn_bundle(repo_root, source_dir, dist_dir, primary_bundle)

    if compat_bundle.get("enabled", False):
        merged_compat_bundle = dict(primary_bundle)
        merged_compat_bundle.update(compat_bundle)
        merged_compat_bundle["plugins"] = compat_bundle.get("plugins", primary_bundle.get("plugins", []))
        merged_compat_bundle["prepend_js"] = compat_bundle.get("prepend_js", primary_bundle.get("prepend_js", []))
        create_named_cdn_bundle(repo_root, source_dir, dist_dir, merged_compat_bundle)


def create_named_cdn_bundle(
    repo_root: Path,
    source_dir: Path,
    dist_dir: Path,
    bundle_config: dict,
) -> None:
    bundle_name = bundle_config.get("name", "theme-runtime")
    shared_css_files = bundle_config.get("shared_css", [])
    prepend_js_files = bundle_config.get("prepend_js", [])
    plugin_slugs = bundle_config.get("plugins", [])

    css_chunks: List[str] = []
    for rel_name in shared_css_files:
        css_path = source_dir / rel_name
        if not css_path.exists():
            raise FileNotFoundError(f"CDN bundle shared CSS file not found: {css_path}")
        css_chunks.append(minify_css(css_path.read_text(encoding="utf-8")))

    for plugin_slug in plugin_slugs:
        plugin_dir = source_dir / plugin_slug
        if not plugin_dir.exists():
            raise FileNotFoundError(f"CDN bundle plugin directory not found: {plugin_dir}")
        for css_file in sorted(plugin_dir.glob("*.css")):
            css_chunks.append(minify_css(css_file.read_text(encoding="utf-8")))

    js_chunks: List[str] = []
    for rel_name in prepend_js_files:
        js_path = source_dir / rel_name
        if not js_path.exists():
            raise FileNotFoundError(f"CDN bundle prepend JS file not found: {js_path}")
        js_chunks.append(minify_js(js_path.read_text(encoding="utf-8")))

    for plugin_slug in plugin_slugs:
        plugin_dir = source_dir / plugin_slug
        for js_file in sorted(plugin_dir.glob("*.js")):
            js_chunks.append(minify_js(js_file.read_text(encoding="utf-8")))

    output_css = dist_dir / f"{bundle_name}.min.css"
    output_js = dist_dir / f"{bundle_name}.min.js"
    output_css.write_text("".join(css_chunks), encoding="utf-8")
    output_js.write_text("".join(js_chunks), encoding="utf-8")
    print(f"Created CDN CSS bundle: {output_css}")
    print(f"Created CDN JS bundle: {output_js}")

    if not bundle_config.get("cdn_embed", False):
        return

    github_repo = bundle_config.get("github_repo", "")
    if not github_repo:
        return

    version = read_version(repo_root)
    cdn_ref = bundle_config.get("cdn_ref", version)
    cdn_base = f"https://cdn.jsdelivr.net/gh/{github_repo}@{cdn_ref}/dist"

    combined_html = "\n".join([
        build_html_banner(f"{bundle_name.replace('-', ' ').title()} CDN", version),
        "<!-- Head -->",
        "<style>",
        HEADER_NAV_CRITICAL_CSS,
        "</style>",
        f'<link rel="stylesheet" href="{cdn_base}/{bundle_name}.min.css">',
        "",
        "<!-- Body End -->",
        f'<script src="{cdn_base}/{bundle_name}.min.js"></script>',
        "",
    ])

    for stale_path in [
        dist_dir / f"{bundle_name}-cdn-head.html",
        dist_dir / f"{bundle_name}-cdn-body.html",
    ]:
        if stale_path.exists():
            stale_path.unlink()

    combined_path = dist_dir / f"{bundle_name}-cdn.html"
    combined_path.write_text(combined_html, encoding="utf-8")
    print(f"Created CDN embed: {combined_path}")


def build_cdn_base(repo_root: Path) -> str:
    bundle_config = load_bundle_config(repo_root).get("cdn_bundle", {})
    github_repo = bundle_config.get("github_repo", "popskraft/carrd-v2")
    version = read_version(repo_root)
    cdn_ref = bundle_config.get("cdn_ref", version)
    return f"https://cdn.jsdelivr.net/gh/{github_repo}@{cdn_ref}/dist"


def create_plugin_cdn_embed(
    repo_root: Path,
    plugin_slug: str,
    plugin_title: str,
    target_dir: Path,
    version: str,
    has_css: bool,
    has_js: bool,
) -> None:
    cdn_base = build_cdn_base(repo_root)
    plugin_base = f"{cdn_base}/{plugin_slug}"

    parts: List[str] = [build_html_banner(f"{plugin_title} CDN", version)]

    if has_css:
        parts.extend([
            "<!-- Head -->",
        ])
        if plugin_slug == "header-nav":
            parts.extend([
                "<style>",
                HEADER_NAV_CRITICAL_CSS,
                "</style>",
            ])
        parts.extend([
            f'<link rel="stylesheet" href="{plugin_base}/{plugin_slug}.min.css">',
            ""
        ])

    if has_js:
        placement = plugin_script_placement(plugin_slug)
        parts.extend([
            f"<!-- {placement} -->",
            f'<script src="{plugin_base}/{plugin_slug}.min.js"></script>',
            ""
        ])

    if len(parts) == 1:
        return

    combined_path = target_dir / f"{plugin_slug}-cdn.html"
    combined_path.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"Created Plugin CDN embed: {combined_path}")

def run(source_dir: Path, dist_dir: Path, docs_only: bool) -> None:
    if dist_dir.exists():
        # shutil.rmtree(dist_dir) # Don't nuke mostly for safety/speed unless needed
        pass
    dist_dir.mkdir(parents=True, exist_ok=True)
    cleanup_excluded_dist_outputs(dist_dir)
    cleanup_stale_dist_outputs(source_dir, dist_dir, docs_only)

    plugin_sources: Dict[Path, List[PluginMetadata]] = {}
    repo_root = source_dir.parent
    version = read_version(repo_root)
    build_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print(f"Processing plugins from {source_dir} -> {dist_dir}...")
    
    # Process all top-level logical plugins (directories in src/)
    for item in source_dir.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            if is_dist_build_excluded(item.relative_to(source_dir)):
                print(f"  [exclude] Skipping '{item.name}' for dist build")
                continue
            meta_list = process_plugin(
                item,
                dist_dir,
                source_dir,
                docs_only,
                version,
                build_date,
            )
            if meta_list:
                plugin_sources[item] = meta_list

    # Create Theme Packages (Bundles)
    if not docs_only:
        create_theme_packages(plugin_sources, dist_dir, source_dir, version, build_date)
        copy_shared_theme_assets(dist_dir, source_dir)
        create_theme_design_system_embed(dist_dir, source_dir, version)
        create_cdn_bundle(repo_root, source_dir, dist_dir)

    write_root_readme(dist_dir, repo_root, version, build_date)

    # Copy CHANGELOG.md to dist if it exists
    changelog_src = repo_root / "CHANGELOG.md"
    if changelog_src.exists():
        changelog_dest = dist_dir / "CHANGELOG.md"
        shutil.copy2(changelog_src, changelog_dest)
        print(f"Copied: {changelog_dest}")

    print("\nDone.")


def process_plugin(
    plugin_dir: Path,
    dist_dir: Path,
    source_dir: Path,
    docs_only: bool,
    version: str,
    build_date: str,
) -> List[PluginMetadata]:
    """
    Minifies CSS/JS in plugin_dir and writes to dist_dir, mirroring structure.
    Returns a list of (plugin_root_path, plugin_name) for bundled themes.
    """
    rel_path = plugin_dir.relative_to(source_dir)
    target_dir = dist_dir / rel_path
    target_dir.mkdir(parents=True, exist_ok=True)
    repo_root = source_dir.parent
    if not docs_only:
        for stale_cdn_embed in [
            target_dir / f"{plugin_dir.name}-cdn-head.html",
            target_dir / f"{plugin_dir.name}-cdn-body.html",
            target_dir / f"{plugin_dir.name}-cdn.html",
        ]:
            if stale_cdn_embed.exists():
                stale_cdn_embed.unlink()
    
    meta_list: List[PluginMetadata] = []
    
    plugin_name = plugin_dir.name.replace("-", " ").title()
    plugin_summary = ""
    plugin_body = ""
    readme = plugin_dir / "README.md"
    if readme.exists():
        content = readme.read_text(encoding="utf-8")
        validate_plugin_readme_contract(content, plugin_dir.name)
        plugin_name, plugin_summary, plugin_body = split_plugin_readme(content)
        if not plugin_name:
            plugin_name = plugin_dir.name.replace("-", " ").title()
            plugin_body = content.strip()

    # Process CSS
    css_files = sorted(plugin_dir.glob("*.css"))
    has_css = bool(css_files)
    has_assets = has_css
    
    if css_files and not docs_only:
        has_assets = True
        combined_css = ""
        for css_file in css_files:
            combined_css += minify_css(css_file.read_text(encoding="utf-8"))
            
        output_css = target_dir / f"{plugin_dir.name}.min.css"
        output_css.write_text(combined_css, encoding="utf-8")
        print(f"Minified CSS: {output_css}")

    # Process JS
    js_files = sorted(plugin_dir.glob("*.js"))
    has_js = bool(js_files)
    has_assets = has_assets or has_js
    if js_files and not docs_only:
        has_assets = True
        combined_js = ""
        for js_file in js_files:
            combined_js += minify_js(js_file.read_text(encoding="utf-8"))
            
        output_js = target_dir / f"{plugin_dir.name}.min.js"
        output_js.write_text(combined_js, encoding="utf-8")
        print(f"Minified JS: {output_js}")
        
    # Copy HTML/Metadata (read README/HTML)
    if readme.exists():
        # Generate README from template
        output_readme = target_dir / "README.md"
        rendered_readme = render_template(
            PLUGIN_README_TEMPLATE,
            {
                "PLUGIN_TITLE": plugin_name,
                "PLUGIN_SLUG": plugin_dir.name,
                "PLUGIN_SUMMARY": plugin_summary,
                "INSTALLATION": build_plugin_installation(
                    repo_root,
                    plugin_dir,
                    has_css,
                    has_js,
                ),
                "PLUGIN_BODY": plugin_body,
                "VERSION": version,
            },
        )
        output_readme.write_text(rendered_readme, encoding="utf-8")
        print(f"Generated README: {output_readme} <- {PLUGIN_README_TEMPLATE}")
            
    if has_assets and not docs_only:
        meta_list.append((plugin_dir, plugin_name))

        output_embed = target_dir / f"{plugin_dir.name}-embed.html"
        output_css = target_dir / f"{plugin_dir.name}.min.css"
        output_js = target_dir / f"{plugin_dir.name}.min.js"

        if plugin_dir.name in SPLIT_EMBED_PLUGINS and output_js.exists():
            css_text = output_css.read_text(encoding="utf-8") if output_css.exists() else ""
            js_text = output_js.read_text(encoding="utf-8")
            manifest, part_one, part_two = build_split_embed_parts(
                plugin_dir.name,
                plugin_name,
                version,
                css_text,
                js_text,
            )
            output_embed.write_text(manifest, encoding="utf-8")
            (target_dir / f"{plugin_dir.name}-embed-part1.html").write_text(part_one, encoding="utf-8")
            (target_dir / f"{plugin_dir.name}-embed-part2.html").write_text(part_two, encoding="utf-8")
            print(f"Created Embed: {output_embed}")
            print(f"Created Embed: {target_dir / f'{plugin_dir.name}-embed-part1.html'}")
            print(f"Created Embed: {target_dir / f'{plugin_dir.name}-embed-part2.html'}")
        else:
            # Generate Embed HTML (Style + Script)
            embed_parts: List[str] = [build_html_banner(plugin_name, version)]

            if output_css.exists():
                embed_parts.extend([
                    "<style>",
                    output_css.read_text(encoding="utf-8"),
                    "</style>",
                ])

            if output_js.exists():
                embed_parts.extend([
                    "<script>",
                    output_js.read_text(encoding="utf-8"),
                    "</script>",
                ])

            if len(embed_parts) > 1:
                output_embed.write_text("\n".join(embed_parts) + "\n", encoding="utf-8")
                print(f"Created Embed: {output_embed}")

        create_plugin_cdn_embed(
            repo_root,
            plugin_dir.name,
            plugin_name,
            target_dir,
            version,
            output_css.exists(),
            output_js.exists(),
        )
        
    # Recurse for nested plugins (like themes/mini)
    for sub in plugin_dir.iterdir():
        if sub.is_dir():
            sub_meta = process_plugin(
                sub,
                dist_dir,
                source_dir,
                docs_only,
                version,
                build_date,
            )
            meta_list.extend(sub_meta)
            
    return meta_list

def read_version(repo_root: Path) -> str:
    version_file = repo_root / VERSION_FILE
    if version_file.exists():
        version = version_file.read_text(encoding="utf-8").strip()
        if version:
            if not re.fullmatch(r"\d+\.\d+\.\d+", version):
                raise ValueError(
                    f"Invalid VERSION '{version}'. Expected MAJOR.MINOR.PATCH (e.g. 0.1.10)."
                )
            return version
    return "0.0.0"

def split_readme_title_body(content: str) -> Tuple[str, str]:
    lines = content.splitlines()
    for index, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            body = "\n".join(lines[index + 1:]).lstrip()
            return title, body
    return "", content.strip()


def split_plugin_readme(content: str) -> Tuple[str, str, str]:
    title, content_body = split_readme_title_body(content)
    section_match = re.search(r"^##\s+", content_body, flags=re.MULTILINE)
    if not section_match:
        return title, content_body.strip(), ""

    summary = content_body[:section_match.start()].strip()
    body = content_body[section_match.start():].strip()
    return title, summary, body


def extract_top_level_readme_sections(content: str) -> List[str]:
    return re.findall(r"^##\s+(.+?)\s*$", content, flags=re.MULTILINE)


def validate_plugin_readme_contract(content: str, plugin_slug: str) -> None:
    title, summary, _ = split_plugin_readme(content)
    if not title:
        raise ValueError(f"{plugin_slug}/README.md must start with a '# ' title heading.")

    expected_title = plugin_slug.replace("-", " ").title()
    if title != expected_title:
        raise ValueError(
            f"{plugin_slug}/README.md title must be '{expected_title}'; found '{title}'."
        )

    if not summary or "\n\n" in summary or summary.startswith(("#", "-", "*", "```")):
        raise ValueError(
            f"{plugin_slug}/README.md must contain one short summary paragraph after the title."
        )

    top_level_sections = extract_top_level_readme_sections(content)
    disallowed_sections = [
        section for section in top_level_sections
        if section in {"Install", "Installation"}
    ]
    if disallowed_sections:
        raise ValueError(
            f"{plugin_slug}/README.md must not define install sections; install flow is template-owned."
        )

    for section in REQUIRED_PLUGIN_README_SECTIONS:
        count = top_level_sections.count(section)
        if count != 1:
            raise ValueError(
                f"{plugin_slug}/README.md must contain exactly one '## {section}' section; found {count}."
            )

    required_positions = [top_level_sections.index(section) for section in REQUIRED_PLUGIN_README_SECTIONS]
    if required_positions != sorted(required_positions):
        raise ValueError(
            f"{plugin_slug}/README.md must keep required sections in this order: "
            + " -> ".join(REQUIRED_PLUGIN_README_SECTIONS)
        )

    first_required_block = top_level_sections[: len(REQUIRED_PLUGIN_README_SECTIONS)]
    if tuple(first_required_block) != REQUIRED_PLUGIN_README_SECTIONS:
        raise ValueError(
            f"{plugin_slug}/README.md must start its top-level section flow with: "
            + " -> ".join(REQUIRED_PLUGIN_README_SECTIONS)
        )

    tail_sections = top_level_sections[len(REQUIRED_PLUGIN_README_SECTIONS):]
    invalid_tail_sections = [
        section for section in tail_sections
        if not any(
            section.startswith(allowed) if allowed.endswith(":") else section == allowed
            for allowed in ALLOWED_PLUGIN_README_TAIL_SECTIONS
        )
    ]
    if invalid_tail_sections:
        allowed = ", ".join(ALLOWED_PLUGIN_README_TAIL_SECTIONS)
        invalid = ", ".join(invalid_tail_sections)
        raise ValueError(
            f"{plugin_slug}/README.md has unsupported top-level sections after the required flow: "
            f"{invalid}. Allowed tail sections: {allowed}."
        )


def is_dist_build_excluded(rel_path: Path) -> bool:
    rel_posix = rel_path.as_posix()
    for excluded in DIST_BUILD_EXCLUDES:
        if rel_posix == excluded or rel_posix.startswith(f"{excluded}/"):
            return True
    return False


def cleanup_excluded_dist_outputs(dist_dir: Path) -> None:
    for excluded in sorted(DIST_BUILD_EXCLUDES):
        excluded_path = dist_dir / excluded
        if excluded_path.exists():
            shutil.rmtree(excluded_path)
            print(f"  [cleanup] Removed excluded dist output: {excluded_path}")

    for excluded in sorted(DIST_SECTION_EXCLUDES):
        excluded_path = dist_dir / excluded
        if excluded_path.exists():
            shutil.rmtree(excluded_path)
            print(f"  [cleanup] Removed excluded dist section: {excluded_path}")

    for excluded in sorted(DIST_FILE_EXCLUDES):
        excluded_path = dist_dir / excluded
        if excluded_path.exists():
            excluded_path.unlink()
            print(f"  [cleanup] Removed excluded dist file: {excluded_path}")


def cleanup_stale_dist_outputs(source_dir: Path, dist_dir: Path, docs_only: bool) -> None:
    expected_plugin_dirs = {
        item.name
        for item in source_dir.iterdir()
        if item.is_dir() and not item.name.startswith(".") and not is_dist_build_excluded(item.relative_to(source_dir))
    }
    expected_root_dirs = {"themes"}

    keep_root_files = {"README.md", "CHANGELOG.md"}
    if not docs_only:
        bundle_root = load_bundle_config(source_dir.parent)
        bundle_name = bundle_root.get("cdn_bundle", {}).get("name", "theme-runtime")
        compat_bundle_name = bundle_root.get("compat_bundle", {}).get("name", "theme-core")
        keep_root_files.update({
            "theme-design-system.html",
            "theme-design-tokens.css",
            "theme-design-tokens-embed.html",
            "theme-ui.css",
            "theme-ui-runtime.css",
            f"{bundle_name}.min.css",
            f"{bundle_name}.min.js",
            f"{bundle_name}-cdn.html",
            f"{compat_bundle_name}.min.css",
            f"{compat_bundle_name}.min.js",
            f"{compat_bundle_name}-cdn.html",
        })

    for child in dist_dir.iterdir():
        if child.is_dir():
            if child.name in expected_plugin_dirs or child.name in expected_root_dirs:
                continue
            shutil.rmtree(child)
            print(f"  [cleanup] Removed stale dist directory: {child}")
            continue

        if not child.is_file():
            continue

        if docs_only or child.name in keep_root_files:
            continue

        child.unlink()
        print(f"  [cleanup] Removed stale dist file: {child}")

def strip_section(content: str, heading: str) -> str:
    pattern = re.compile(rf"^##\s+{re.escape(heading)}\s*$", re.MULTILINE)
    match = pattern.search(content)
    if not match:
        return content

    remainder = content[match.end():]
    next_heading = re.search(r"^##\s+", remainder, re.MULTILINE)
    if next_heading:
        end = match.end() + next_heading.start()
    else:
        end = len(content)

    stripped = content[:match.start()] + content[end:]
    return stripped.strip()


def load_template(template_name: str) -> str:
    template_path = TEMPLATE_DIR / template_name
    return template_path.read_text(encoding="utf-8")


def render_template(template_name: str, context: Dict[str, str]) -> str:
    template = load_template(template_name)
    for key, value in context.items():
        template = template.replace(f"[[{key}]]", value)
    return template


def write_root_readme(
    dist_dir: Path,
    repo_root: Path,
    version: str,
    build_date: str,
) -> None:
    main_readme = repo_root / "README.md"
    if not main_readme.exists():
        return

    readme_content = main_readme.read_text(encoding="utf-8")
    readme_content = readme_content.replace("](dist/", "](./")
    included_plugins_table = build_included_plugins_table(repo_root / "src")
    readme_content = replace_included_plugins_section(
        readme_content,
        included_plugins_table,
    )
    rendered_readme = render_template(
        ROOT_README_TEMPLATE,
        {
            "CONTENT": readme_content,
            "VERSION": version,
            "BUILD_DATE": build_date,
        },
    )
    rendered_readme = rendered_readme.rstrip() + "\n"
    output_path = dist_dir / "README.md"
    output_path.write_text(rendered_readme, encoding="utf-8")
    print(f"Generated README: {output_path} <- {ROOT_README_TEMPLATE}")
    print(f"Included Plugins table: {INCLUDED_PLUGINS_TEMPLATE}")

def build_included_plugins_table(source_dir: Path) -> str:
    plugin_dirs: List[Path] = []
    for item in sorted(source_dir.iterdir(), key=lambda entry: entry.name):
        if not item.is_dir():
            continue
        if item.name.startswith(".") or item.name == "themes":
            continue
        if is_dist_build_excluded(Path(item.name)):
            continue
        plugin_dirs.append(item)

    rows: List[str] = []
    for plugin_dir in plugin_dirs:
        readme_path = plugin_dir / "README.md"
        plugin_title = plugin_dir.name.replace("-", " ").title()
        if readme_path.exists():
            title, _ = split_readme_title_body(
                readme_path.read_text(encoding="utf-8")
            )
            if title:
                plugin_title = title

        rows.append(f"| **{plugin_title}** | `dist/{plugin_dir.name}/` |")

    table_template = load_template(INCLUDED_PLUGINS_TEMPLATE)
    return table_template.replace("[[PLUGIN_ROWS]]", "\n".join(rows))


def replace_included_plugins_section(content: str, table: str) -> str:
    pattern = re.compile(r"## Included Plugins\n\n.*?(?=\n## |\Z)", re.DOTALL)
    match = pattern.search(content)
    if not match:
        return f"{content.rstrip()}\n\n## Included Plugins\n\n{table}\n"

    section = match.group(0)
    has_divider = "\n---\n" in section
    suffix = "\n---\n" if has_divider else "\n"
    replacement = f"## Included Plugins\n\n{table}{suffix}"
    return content[:match.start()] + replacement + content[match.end():]

def create_mini_special_assets(
    theme_path: Path, 
    plugin_dirs: List[Path], 
    theme_rel_dir: Path, 
    dist_dir: Path,
    plugin_sources: Dict[Path, List[PluginMetadata]],
    source_dir: Path,
    version: str,
    build_date: str,
) -> None:
    """
    Creates the special styles.html and scripts.html for the Mini theme.
    """
    output_style_path = theme_path / "styles.html"
    
    # 1. Theme Styles
    theme_src_dir = source_dir / theme_rel_dir
    theme_name = theme_rel_dir.name
    theme_src_style = theme_src_dir / f"{theme_name}.css"
    if not theme_src_style.exists():
        theme_src_style = theme_src_dir / "style.css"

    theme_css_content = ""
    if theme_src_style.exists():
        theme_css_content = minify_css(theme_src_style.read_text(encoding="utf-8"))
    else:
        theme_css_files = gather_theme_assets([theme_rel_dir], dist_dir, kind="css")
        for file in theme_css_files:
            theme_css_content += minify_css(file.read_text(encoding="utf-8"))

    # 2. Plugin Styles
    plugin_css_sections = []
    for p_dir in plugin_dirs:
        meta_list = plugin_sources.get(p_dir)
        if not meta_list:
            continue
        css_files = gather_theme_assets([p_dir], dist_dir, kind="css")
        for file in css_files:
            css_content = minify_css(file.read_text(encoding="utf-8"))
            if css_content:
                plugin_css_sections.append(css_content)

    # Combine Styles for styles.html
    full_style_content = build_html_banner(f"{theme_name.replace('-', ' ').title()} Theme Styles", version)
    full_style_content += "\n<style>"
    full_style_content += theme_css_content
    for section in plugin_css_sections:
        full_style_content += section
    full_style_content += "</style>"
    
    output_style_path.write_text(full_style_content, encoding="utf-8")
    print(f"[mini] Created special style file: {output_style_path}")

    # --- SCRIPTS ---
    output_script_path = theme_path / "scripts.html"
    
    # 1. Theme Scripts
    theme_js_files = gather_theme_assets([theme_rel_dir], dist_dir, kind="js")
    theme_js_content = ""
    for file in theme_js_files:
        theme_js_content += minify_js(file.read_text(encoding="utf-8"))

    # 2. Plugin Scripts
    plugin_js_sections = []
    no_load_waiting_section = ""
    
    for p_dir in plugin_dirs:
        meta_list = plugin_sources.get(p_dir)
        if not meta_list:
            continue
        plugin_name = meta_list[0][1]
        js_files = gather_theme_assets([p_dir], dist_dir, kind="js")
        if not js_files:
            continue
        
        # Minify plugin scripts for scripts.html
        js_content = ""
        for file in js_files:
            js_content += minify_js(file.read_text(encoding="utf-8"))
            
        if js_content:
            section = js_content
            if plugin_name == "No Load Waiting":
                no_load_waiting_section = section
            else:
                plugin_js_sections.append(section)

    # Combine Scripts for scripts.html
    full_script_content = build_html_banner(f"{theme_name.replace('-', ' ').title()} Theme Scripts", version)
    full_script_content += "\n<script>"
    if no_load_waiting_section:
        full_script_content += "\n" + no_load_waiting_section
    for section in plugin_js_sections:
        full_script_content += "\n" + section
    if theme_js_content:
        full_script_content += "\n" + theme_js_content
    full_script_content += "</script>"
    
    output_script_path.write_text(full_script_content, encoding="utf-8")
    print(f"[mini] Created special script file: {output_script_path}")


def create_theme_packages(
    plugin_sources: dict[Path, List[PluginMetadata]],
    dist_dir: Path,
    source_dir: Path,
    version: str,
    build_date: str,
) -> None:
    theme_roots: dict[str, Path] = {}
    plugin_dirs: List[Path] = []

    # Flatten all discovered plugins/themes from metadata
    all_paths: List[Path] = []
    for meta_list in plugin_sources.values():
        for (p_path, _) in meta_list:
            all_paths.append(p_path)

    # Filter and sort
    for p_path in all_paths:
        try:
            rel_dir = p_path.relative_to(source_dir)
        except ValueError:
            continue
            
        parts = rel_dir.parts
        
        # Identify Themes
        if parts and parts[0] == "themes" and len(parts) >= 2:
            theme_name = parts[1]
            theme_roots.setdefault(theme_name, dist_dir / "themes" / theme_name)
        else:
            is_excluded = False
            for excluded in THEME_BUNDLE_EXCLUDES:
                if rel_dir.as_posix() == excluded or rel_dir.as_posix().startswith(f"{excluded}/"):
                    is_excluded = True
                    print(f"  [exclude] Skipping '{rel_dir}' for theme bundle")
                    break
            
            if not is_excluded and rel_dir.name != "themes":
                plugin_dirs.append(rel_dir)

    if not theme_roots:
        return

    plugin_dirs = sorted(list(set(plugin_dirs)), key=lambda path: path.as_posix())

    for theme_name, theme_path in sorted(theme_roots.items()):
        if not theme_path.exists():
            continue

        remove_legacy_bundle_dir(theme_path)

        theme_rel_dir = Path("themes") / theme_name
        
        # GATHER ALL ASSETS (Plugin + Theme)
        # We want to combine everything into [theme_name].min.css/js
        
        all_css_files = gather_theme_assets(plugin_dirs, dist_dir, kind="css") +                         gather_theme_assets([theme_rel_dir], dist_dir, kind="css")
        
        all_js_files = gather_theme_assets(plugin_dirs, dist_dir, kind="js") +                        gather_theme_assets([theme_rel_dir], dist_dir, kind="js")

        # Write Unified Bundle
        if theme_name != "mini":
            theme_label = f"{theme_name.replace('-', ' ').title()} Theme"
            write_theme_asset(
                all_css_files,
                theme_path / f"{theme_name}.min.css",
                kind="css",
                bundle_name=theme_label,
                version=version,
                build_date=build_date,
            )
            write_theme_asset(
                all_js_files,
                theme_path / f"{theme_name}.min.js",
                kind="js",
                bundle_name=theme_label,
                version=version,
                build_date=build_date,
            )

        # Special handling for Mini
        if theme_name == "mini":
            create_mini_special_assets(
                theme_path,
                plugin_dirs,
                theme_rel_dir,
                dist_dir,
                plugin_sources,
                source_dir,
                version,
                build_date,
            )
            # Remove artifacts from processing that are not needed
            for artifact in [theme_path / f"{theme_name}.min.css", theme_path / f"{theme_name}.min.js"]:
                if artifact.exists():
                    artifact.unlink()
                    print(f"[mini] Removed intermediate artifact: {artifact}")

        # Cleanup Fragmented Files if they exist (from old builds)
        for fragment in [
            "plugin-style.min.css", "plugin-script.min.js",
            "theme-style.min.css", "theme-script.min.js"
        ]:
            frag_path = theme_path / fragment
            if frag_path.exists():
                frag_path.unlink()
                print(f"[theme] Cleanup: Removed fragmented file {frag_path}")


def remove_legacy_bundle_dir(theme_path: Path) -> None:
    legacy_dir = theme_path / "_bundle"
    if legacy_dir.exists():
        shutil.rmtree(legacy_dir)


def gather_theme_assets(rel_dirs: List[Path], dist_dir: Path, kind: str) -> List[Path]:
    suffix = f".{kind}"
    # Banned names to avoid recursive inclusion
    banned_names = {
        "style.min.css", "style.min.js", 
        "theme-style.min.css", "plugin-style.min.css",
        "theme-script.min.js", "plugin-script.min.js",
        "mini.min.css", "mini.min.js" # Don't include the destination bundle itself
    }
    files: List[Path] = []

    for rel_dir in rel_dirs:
        base = dist_dir / rel_dir
        if not base.exists():
            continue
        
        for candidate in sorted(base.rglob(f"*{suffix}")):
            if candidate.name in banned_names:
                continue
            if not candidate.is_file():
                continue
            files.append(candidate)
    return files


def write_theme_asset(
    files: List[Path],
    output: Path,
    kind: str,
    bundle_name: str,
    version: str,
    build_date: str,
) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    if not files:
        # Standard behavior: create valid empty file
        output.write_text("", encoding="utf-8")
        return

    chunks: List[str] = []
    for file in files:
        text = file.read_text(encoding="utf-8")
        
        source_name = file.name.replace(".min.", ".")
        should_minify = True
        if source_name in MINIFY_EXCLUDES or file.name in MINIFY_EXCLUDES:
            should_minify = False
            
        if should_minify:
            if kind == "css":
                processed = minify_css(text)
            else:
                processed = minify_js(text)
        else:
            processed = text
            
        chunks.append(processed)

    combined = "".join(chunks)
    output.write_text(combined, encoding="utf-8")
    print(f"[theme] Combined {len(files)} {kind.upper()} file(s) -> {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Minify CSS/JS files from src into a mirrored dist directory."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("src"),
        help="Directory that contains original plugin assets (default: src)",
    )
    parser.add_argument(
        "--dist",
        type=Path,
        default=Path("dist"),
        help="Directory to write minified assets into (default: dist)",
    )
    parser.add_argument(
        "--docs-only",
        action="store_true",
        help="Only rebuild README files without minifying assets",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run(args.source.resolve(), args.dist.resolve(), args.docs_only)


if __name__ == "__main__":
    main()
