# UI Domain

Use this domain to produce thermonuclear-quality user interfaces without extra prompts.

## Quick Start
```bash
make run --domain=ui --input="Design dashboard for AI analytics"
```

## What It Generates
- Next.js + Tailwind + ShadCN layouts with Mantine charts
- Responsive, accessibility-first components (WCAG AA)
- Framer Motion micro-interactions and React-Three-Fiber depth cues
- Command palettes, optimistic updates, personalized empty states

## Guidelines Applied
- Trends: AI personalization, subtle 3D immersion, voice-ready patterns, sustainable low-energy design
- 60fps animations, Lighthouse 100/100 targets, Jest/RTL accessibility tests
- Design tokens stored for reuse (colors, typography, motion)

## Required Keys
- `V0_API_KEY`
- `FIGMA_PERSONAL_ACCESS_TOKEN`
- Optional: `SNYK_TOKEN`, `SONARQUBE_TOKEN` for quality gates

## Demo
```bash
./scripts/run_ui_demo.sh
```
