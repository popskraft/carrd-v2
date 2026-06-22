"""
Minifier module for CSS and JavaScript.

This module provides lightweight, dependency-free minification for web assets.
It handles CSS comments/whitespace and JavaScript with proper handling for:
- Single/multi-line comments
- String literals (', ", `)
- Regex literals (/.../)
- ASI-sensitive keywords (return, throw, etc.)
"""

import re
from typing import List, Tuple


def minify_css(content: str) -> str:
    """
    Minify CSS by removing comments and collapsing whitespace.
    
    Args:
        content: Raw CSS string
        
    Returns:
        Minified CSS string
    """
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)  # Remove comments
    content = re.sub(r"\s+", " ", content)  # Collapse whitespace
    content = re.sub(r"\s*([:;{},)])", r"\1", content)  # Remove space before delimiters
    content = re.sub(r"([:;{},)])\s*", r"\1", content)  # Remove space after delimiters
    content = re.sub(r"\s*\(\s*", "(", content)  # Remove space around (
    content = re.sub(r"(?<!:)(and|or|not)\(", r"\1 (", content)  # Restore space after and/or/not in media queries (but not :not())
    content = re.sub(
        r"((?::not|:is|:has|:where)\((?:[^()]|\([^()]*\))*\))(?=[.#\[:a-zA-Z_])",
        r"\1 ",
        content,
    )  # Preserve descendant combinator after selector pseudo-classes, including one nested () level
    content = content.replace(";}", "}")  # Remove trailing semicolon
    return content.strip()


def minify_js(content: str) -> str:
    """
    Minify JavaScript by removing comments and collapsing whitespace.
    
    Handles:
    - Single/multi-line comments
    - String literals (', ", `)
    - Regex literals (/.../)
    - ASI-sensitive keywords (return, throw, etc.)
    
    Args:
        content: Raw JavaScript string
        
    Returns:
        Minified JavaScript string
    """
    normalized = content.replace("\r\n", "\n").replace("\r", "\n")
    stripped = _strip_js_comments(normalized)
    return _collapse_js_whitespace(stripped)


# --- Private Implementation ---

REGEX_PRECEDERS = {
    "return",
    "throw",
    "yield",
    "await",
    "break",
    "continue",
    "case",
    "else",
    "do",
    "in",
    "of",
    "delete",
    "typeof",
    "void",
    "new",
    "instanceof",
}

REGEX_PUNCTUATORS = set("([{:;,=<>!&|?+-*%^~")


def _should_start_regex(
    prev_token_type: str,
    prev_token_value: str,
    prev_non_space: str,
) -> bool:
    """Determine if a '/' starts a regex literal or is division."""
    if not prev_non_space:
        return True
    if prev_token_type == "word" and prev_token_value in REGEX_PRECEDERS:
        return True
    return prev_non_space in REGEX_PUNCTUATORS


def _read_regex_literal(content: str, start: int) -> Tuple[str, int]:
    """Read a regex literal from content starting at the given position."""
    length = len(content)
    i = start + 1
    in_class = False
    escaped = False

    while i < length:
        ch = content[i]
        if escaped:
            escaped = False
        else:
            if ch == "\\":
                escaped = True
            elif ch == "[":
                in_class = True
            elif ch == "]" and in_class:
                in_class = False
            elif ch == "/" and not in_class:
                i += 1
                while i < length and content[i].isalpha():
                    i += 1
                return content[start:i], i
        i += 1

    return "/", start + 1


def _is_identifier_start(ch: str) -> bool:
    """Check if character can start an identifier."""
    return ch.isalpha() or ch in "_$"


def _is_identifier_char(ch: str) -> bool:
    """Check if character can be part of an identifier."""
    return ch.isalnum() or ch in "_$"


def _needs_space(prev_char: str, next_char: str) -> bool:
    """Determine if a space is required between two characters."""
    if not prev_char or not next_char:
        return False
    if _is_identifier_char(prev_char) and _is_identifier_char(next_char):
        return True
    if prev_char in "+-" and next_char == prev_char:
        return True
    if prev_char == "/" and next_char in "/*":
        return True
    return False


def _strip_js_comments(content: str) -> str:
    """Remove JavaScript comments while preserving strings and regex literals."""
    out: List[str] = []
    i = 0
    length = len(content)
    state = "normal"
    last_token_type = ""
    last_token_value = ""
    last_non_space = ""

    while i < length:
        ch = content[i]

        if state == "normal":
            if ch.isspace():
                out.append(ch)
                i += 1
                continue

            if ch in ("'", '"', "`"):
                out.append(ch)
                state = ch
                i += 1
                continue

            if ch == "/" and i + 1 < length:
                nxt = content[i + 1]
                if nxt == "/":
                    i += 2
                    while i < length and content[i] != "\n":
                        i += 1
                    continue
                if nxt == "*":
                    i += 2
                    while i + 1 < length and not (content[i] == "*" and content[i + 1] == "/"):
                        i += 1
                    i += 2
                    prev_char = out[-1] if out else ""
                    next_char = content[i] if i < length else ""
                    if (
                        prev_char
                        and next_char
                        and not prev_char.isspace()
                        and not next_char.isspace()
                        and _is_identifier_char(prev_char)
                        and _is_identifier_char(next_char)
                    ):
                        out.append(" ")
                    continue
                if _should_start_regex(last_token_type, last_token_value, last_non_space):
                    literal, new_index = _read_regex_literal(content, i)
                    out.append(literal)
                    last_token_type = "regex"
                    last_token_value = ""
                    last_non_space = "/"
                    i = new_index
                    continue

            if _is_identifier_start(ch):
                start = i
                i += 1
                while i < length and _is_identifier_char(content[i]):
                    i += 1
                token = content[start:i]
                out.append(token)
                last_token_type = "word"
                last_token_value = token
                last_non_space = token[-1]
                continue

            if ch.isdigit():
                start = i
                i += 1
                while i < length and (content[i].isdigit() or content[i] == "."):
                    i += 1
                token = content[start:i]
                out.append(token)
                last_token_type = "number"
                last_token_value = token
                last_non_space = token[-1]
                continue

            out.append(ch)
            if not ch.isspace():
                last_non_space = ch
            last_token_type = "symbol"
            last_token_value = ""
            i += 1
            continue

        if state in ("'", '"', "`"):
            out.append(ch)
            if ch == "\\" and i + 1 < length:
                out.append(content[i + 1])
                i += 2
                continue
            if ch == state:
                state = "normal"
                last_token_type = "string"
                last_token_value = ""
                last_non_space = ch
            i += 1
            continue

    return "".join(out)


def _collapse_js_whitespace(content: str) -> str:
    """Collapse JavaScript whitespace while preserving ASI-sensitive newlines."""
    out: List[str] = []
    i = 0
    length = len(content)
    state = "normal"
    last_token_type = ""
    last_token_value = ""
    last_non_space = ""
    asi_keywords = {"return", "throw", "yield", "await", "break", "continue"}

    while i < length:
        ch = content[i]

        if state == "normal":
            if ch.isspace():
                has_newline = False
                j = i
                while j < length and content[j].isspace():
                    if content[j] == "\n":
                        has_newline = True
                    j += 1

                next_char = content[j] if j < length else ""
                if has_newline and last_token_type == "word" and last_token_value in asi_keywords:
                    out.append("\n")
                elif _needs_space(last_non_space, next_char):
                    out.append(" ")

                i = j
                continue

            if ch in ("'", '"', "`"):
                out.append(ch)
                state = ch
                last_token_type = "string"
                last_token_value = ""
                last_non_space = ch
                i += 1
                continue

            if ch == "/" and _should_start_regex(last_token_type, last_token_value, last_non_space):
                literal, new_index = _read_regex_literal(content, i)
                out.append(literal)
                last_token_type = "regex"
                last_token_value = ""
                last_non_space = "/"
                i = new_index
                continue

            if _is_identifier_start(ch):
                start = i
                i += 1
                while i < length and _is_identifier_char(content[i]):
                    i += 1
                token = content[start:i]
                out.append(token)
                last_token_type = "word"
                last_token_value = token
                last_non_space = token[-1]
                continue

            if ch.isdigit():
                start = i
                i += 1
                while i < length and (content[i].isdigit() or content[i] == "."):
                    i += 1
                token = content[start:i]
                out.append(token)
                last_token_type = "number"
                last_token_value = token
                last_non_space = token[-1]
                continue

            out.append(ch)
            if not ch.isspace():
                last_non_space = ch
            last_token_type = "symbol"
            last_token_value = ""
            i += 1
            continue

        if state in ("'", '"', "`"):
            out.append(ch)
            if ch == "\\" and i + 1 < length:
                out.append(content[i + 1])
                i += 2
                continue
            if ch == state:
                state = "normal"
            i += 1
            continue

    return "".join(out).strip()
