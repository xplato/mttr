# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MTTR is a lightweight GUI control program for Dynamixel servos (initially targeting the XL430-W250-T model) built with Tauri v2 (Rust backend) + React 19/TypeScript (frontend) + Vite. The project is in early development (v0.1.0) with foundational infrastructure in place.

## Commands

```bash
# Development (full app with Rust backend + React frontend)
bun run tauri dev

# Frontend dev server only (no Rust backend)
bun run dev

# Build
bun run build            # Frontend only (tsc + vite)
bun run tauri build      # Full production build

# Preview frontend build
bun run preview
```

No linting or test infrastructure is configured yet. The package manager is **bun** (configured in `tauri.conf.json` as `beforeDevCommand`/`beforeBuildCommand`).
