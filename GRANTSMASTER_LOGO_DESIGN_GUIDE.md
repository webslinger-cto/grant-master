# GrantsMaster Logo Design Guide (Aurora Grid)

This guide defines the approved logo system based on **Option 3 (Aurora Grid)** and provides implementation rules for product, marketing, and app icon usage.

## 1) Brand Direction

- **Brand personality:** modern, startup-like, intelligent, confident, precise
- **Primary message:** AI-guided grant strategy and measurable upward progress
- **Visual metaphor:** connected nodes ascending through a structured hexagon (intelligence + system + outcomes)

## 2) Approved Master Marks (Current)

### Light Mode Lockup (Primary)

- Asset: `/Users/abdulsar/.cursor/projects/Users-abdulsar-Desktop-Project-Apps-grant-master/assets/grantsmaster-logo-aurora-v2-light.png`
- Use on white or very light surfaces
- Preferred for app headers, docs, pitch decks, and marketing pages on light UI

### Dark Mode Lockup (Primary Dark)

- Asset: `/Users/abdulsar/.cursor/projects/Users-abdulsar-Desktop-Project-Apps-grant-master/assets/grantsmaster-logo-aurora-v2-dark-matched.png`
- Use on dark surfaces and dark app shells
- Preferred for dashboard top bars, hero sections, and splash/loading screens in dark mode

### Icon-Only Assets (Approved)

- Light icon: `/Users/abdulsar/.cursor/projects/Users-abdulsar-Desktop-Project-Apps-grant-master/assets/grantsmaster-icon-aurora-v2-light.png`
- Dark icon: `/Users/abdulsar/.cursor/projects/Users-abdulsar-Desktop-Project-Apps-grant-master/assets/grantsmaster-icon-aurora-v2-dark-matched.png`
- Icon geometry must match lockup icon exactly across light/dark variants

## 3) Color System

These are the core brand colors for the Aurora Grid identity.

### Core Tokens

- `--gm-navy-900`: `#0B1F5B` (primary brand base, icon field, dark text)
- `--gm-cyan-500`: `#06B6D4` (AI/data signal)
- `--gm-lime-400`: `#A3E635` (growth/progress node)
- `--gm-magenta-500`: `#EC4899` (innovation/highlight node)

### Support Tokens (UI/Background)

- `--gm-bg-light`: `#F8FAFC`
- `--gm-bg-dark`: `#0B1220`
- `--gm-text-light-surface`: `#0F172A`
- `--gm-text-dark-surface`: `#E2E8F0`
- `--gm-stroke-muted`: `#334155`

### Recommended Ratios

- Navy base: **60-70%**
- Cyan: **15-20%**
- Lime: **8-12%**
- Magenta: **8-12%**

Do not let lime or magenta dominate large surfaces; keep them as directional accents.

## 4) Light/Dark Mode Behavior

### Light Mode Rules

- Use navy icon field and navy wordmark
- Keep cyan/lime/magenta at full saturation for icon internals
- Place on white or near-white backgrounds only (`#FFFFFF` to `#F1F5F9`)

### Dark Mode Rules

- Use the matched v2 dark lockup with the same geometry as the light lockup
- Wordmark should be white or near-white (`#F8FAFC`)
- Keep background at `#0B1220` to `#020617` range
- Do not add glow or soft effects in product usage

## 5) Logo Construction and Spacing

- **Icon shape:** hexagonal container with ascending 3-node path
- **Wordmark relationship:** icon left, wordmark right, center-aligned vertically
- **Clear space:** minimum clear space = height of one node circle around all sides
- **Minimum lockup size:** 120 px width (digital)
- **Minimum icon-only size:** 16 px for favicon, 24 px preferred for UI controls

If logo appears below 20 px, use simplified icon-only asset without fine interior lines.

## 6) Favicon and App Icon Specs

- Use icon-only hex mark (no wordmark)
- Maintain strong contrast between icon field and node path
- Export sizes: `16x16`, `32x32`, `48x48`, `64x64`, `128x128`, `256x256`, `512x512`
- For rounded-square app icons, keep 12-16% inner padding
- Ensure node endpoints remain visible at `16x16`

## 7) Accessibility and Contrast

- Wordmark contrast target: **WCAG AA minimum 4.5:1**
- Icon-on-background target: **3:1 minimum** (non-text), **4.5:1 preferred**
- Do not place full-color logo over noisy photography
- If background is complex, use a solid container (pill/card) behind the logo

## 8) Typography Pairing (Recommended)

The generated lockups use modern geometric sans styles. For product consistency:

- Primary options: `Inter`, `Manrope`, `Sora`, or `Plus Jakarta Sans`
- Wordmark styling direction: medium-to-semibold, clean terminals, wide counters

Avoid decorative or serif pairings with this mark.

## 9) Do / Don’t Rules

### Do

- Keep icon geometry crisp and aligned to pixel grid
- Use approved color tokens
- Use light or dark variant based on background mode
- Keep sufficient clear space

### Don’t

- Recolor the mark with arbitrary palette shifts
- Add random gradients, drop shadows, or 3D bevel effects in product UI
- Stretch, skew, rotate, or crop the icon
- Place the dark logo on dark surfaces without contrast compensation

## 10) Export and File Naming Convention

Recommended final package structure:

- `grantsmaster-logo-aurora-v2-light.png`
- `grantsmaster-logo-aurora-v2-dark-matched.png`
- `grantsmaster-icon-aurora-v2-light.png`
- `grantsmaster-icon-aurora-v2-dark-matched.png`
- `grantsmaster-icon-favicon-16.png`
- `grantsmaster-icon-favicon-32.png`
- `grantsmaster-logo.svg`
- `grantsmaster-icon.svg`

Keep one immutable source of truth for each master asset and generate derivatives from that source.

## 11) CSS Variables (Implementation Starter)

```css
:root {
  --gm-navy-900: #0b1f5b;
  --gm-cyan-500: #06b6d4;
  --gm-lime-400: #a3e635;
  --gm-magenta-500: #ec4899;

  --gm-bg-light: #f8fafc;
  --gm-text-light-surface: #0f172a;
}

.dark {
  --gm-bg-dark: #0b1220;
  --gm-text-dark-surface: #e2e8f0;
}
```

## 12) Governance

- Any future color or geometry updates should be versioned (`v1`, `v1.1`, etc.)
- Update this guide and all derivative exports together
- Treat this guide as the canonical standard for logo usage
