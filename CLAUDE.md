# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

This repository (`Retador-Plataform-`, "Plataforma Retador") is currently a
greenfield project. As of this writing it contains only `README.md` and no
source code, build tooling, dependency manifests, tests, or CI configuration.

There is therefore no build/lint/test command to document yet, and no
established architecture to describe. Do not invent or assume any — the only
factual content is the project name and its Spanish-language description in
`README.md`.

## When the codebase grows

The first substantive contribution will establish the project's stack and
conventions. When that happens, update this file to capture:

- **Commands**: how to install dependencies, build, run, lint, and test —
  including how to run a single test — once a manifest (e.g. `package.json`,
  `pyproject.toml`, `go.mod`, `composer.json`) exists.
- **Architecture**: the big-picture structure that spans multiple files and
  isn't obvious from a directory listing (entry points, module boundaries,
  data flow, external services).
- **Conventions**: project-specific patterns a contributor must follow that
  aren't enforced automatically by tooling.

Keep this file accurate to what is actually present in the repo. Remove this
"Current state" / "When the codebase grows" scaffolding once real
documentation replaces it.

## Working notes

- The project's README is written in Spanish; match the existing language of a
  file when editing it.
