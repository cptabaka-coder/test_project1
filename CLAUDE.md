# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

This repository is in early setup. It currently contains only a `README.md` stub and a `.gitignore`. There is no build system, dependency manifest, source code, or test suite yet.

When real code is added, update this file with:
- Build, lint, test, and run commands (including how to run a single test)
- High-level architecture that spans multiple files

## Conventions

- Environment configuration goes in `.env` / `.env.*` files, which are gitignored. Commit a `.env.example` documenting required variables (this pattern is already whitelisted in `.gitignore`).
