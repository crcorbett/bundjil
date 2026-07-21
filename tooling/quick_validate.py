#!/usr/bin/env python3
"""Dependency-free structural validator for repository-local skills."""

from __future__ import annotations

import re
import sys
from pathlib import Path


FRONTMATTER = re.compile(r"^---\n(?P<body>.*?)\n---(?:\n|$)", re.DOTALL)
FIELD = re.compile(r"^(?P<key>[a-z][a-z0-9-]*):\s*(?P<value>.+?)\s*$")
NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_scalar(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def validate(skill_directory: Path) -> tuple[bool, str]:
    skill_file = skill_directory / "SKILL.md"
    if not skill_file.is_file():
        return False, f"SKILL.md not found: {skill_file}"
    match = FRONTMATTER.match(skill_file.read_text(encoding="utf-8"))
    if match is None:
        return False, f"Invalid YAML frontmatter: {skill_file}"
    fields: dict[str, str] = {}
    for line in match.group("body").splitlines():
        field = FIELD.fullmatch(line)
        if field is None:
            return False, f"Unsupported frontmatter line in {skill_file}: {line}"
        fields[field.group("key")] = parse_scalar(field.group("value")).strip()
    if set(fields) != {"description", "name"}:
        return False, f"Frontmatter must contain only name and description: {skill_file}"
    name = fields["name"]
    if not NAME.fullmatch(name) or len(name) > 64:
        return False, f"Invalid skill name {name!r}: {skill_file}"
    if name != skill_directory.name:
        return False, f"Skill name {name!r} does not match directory {skill_directory.name!r}"
    description = fields["description"]
    if not description or len(description) > 1024 or "<" in description or ">" in description:
        return False, f"Invalid skill description: {skill_file}"
    return True, f"skill.valid target={skill_directory.as_posix()} name={name}"


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: quick_validate.py <skill-directory>", file=sys.stderr)
        return 2
    valid, message = validate(Path(sys.argv[1]))
    print(message, file=sys.stdout if valid else sys.stderr)
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
