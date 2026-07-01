---
name: AIDA Vision
description: Traffic monitoring and AI-assisted violation detection dashboard design system.
colors:
  primary: "#b4c5ff"
  secondary: "#4cd7f6"
  tertiary: "#ffb596"
  error: "#ffb4ab"
  neutral-bg: "#051424"
  neutral-surface: "#010f1f"
  outline: "#434655"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#002a78"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: AIDA Vision

## 1. Overview

**Creative North Star: "The Sentinel Control Deck"**

AIDA Vision is a tactical traffic operations and automated enforcement control desk. Designed specifically for long monitoring shifts in control rooms, the system prioritizes legibility, cognitive comfort, and rapid decision-making. The aesthetic is clean, precise, and dark-optimized to prevent eye strain under low ambient light.

We explicitly reject cluttered interfaces, over-saturated layouts, decorative blurs (glassmorphism), and generic SaaS aesthetics. Colors are rare and functional; every element is positioned to represent system status or critical events.

**Key Characteristics:**
- **Dark-optimized backdrop** to minimize ocular fatigue during 8-12 hour shifts.
- **Ultra-high contrast labels** keeping status and text perfectly legible.
- **Structured and Tactile layers** ensuring clear boundary definitions for video feeds and charts.

## 2. Colors

Colors in AIDA Vision serve strictly as functional indicators rather than decorative overlays. 

### Primary
- **Soft Neon Blue** (#b4c5ff): The primary action and brand identifier color. Used for main buttons, primary links, and key highlights.

### Secondary
- **Neon Cyan** (#4cd7f6): Represents active, live, or verified statuses (e.g., live camera, verified violation).

### Tertiary
- **Muted Coral** (#ffb596): Indicates pending actions, calibration states, or items awaiting review.

### Neutral
- **Deep Cyber-Navy** (#051424): The canvas background color. Solid and deep, absorbing excess display light.
- **Midnight Container** (#010f1f): The container surface card color. Slightly brighter than the canvas to draw container boundaries.
- **Slate Muted Border** (#434655): Standard border color for cards, inputs, and list dividers.

### Named Rules
**The Rarity Rule.** Saturated indicator colors (Cyan, Coral, Error) must be limited to ≤10% of any view surface area. Their primary strength is their rarity; when everything stands out, nothing stands out.

## 3. Typography

**Display Font:** Outfit (sans-serif)
**Body Font:** Outfit (sans-serif)
**Label/Mono Font:** JetBrains Mono (monospace)

The typography layout is clean, legible, and built using geometric shapes. Monospace typography is strictly reserved for technical data identifiers, license plate values, and timestamps to ensure character alignment and fast scanning.

### Hierarchy
- **Display** (Bold (700), clamp(2rem, 5vw, 3rem), 1.2): Main view headers (e.g., "Tổng quan Hệ thống").
- **Headline** (Semi-Bold (6600), 1.125rem (18px), 1.4): Card titles and section headers.
- **Body** (Regular (400), 0.875rem (14px), 1.5): Standard data fields and prose descriptions. Max line length is restricted to 70ch.
- **Label** (Medium (500), 0.75rem (12px), 0.05em spacing): Used for status tags, metadata, license plates, and timestamps.

### Named Rules
**The Mono-Plate Rule.** Every vehicle license plate number must be rendered in `JetBrains Mono` and uppercase to mimic physical plates and guarantee maximum readability.

## 4. Elevation

The system is structured and tactile. Depth is conveyed using a hybrid approach of gradual tonal background values combined with clean, sharp borders and low-opacity drop shadows.

### Shadow Vocabulary
- **Tactile Border Shadow** (`box-shadow: 0 1px 3px rgba(0,0,0,0.2)`): Used on container cards to separate elements from the deeper canvas.
- **Elevated Button Shadow** (`box-shadow: 0 1px 3px rgba(0,0,0,0.3)`): Applied to action buttons to make them look clickable.

### Named Rules
**The Rested Surface Rule.** Cards and table rows are flat and restful at rest. Elevated shadows and borders shift only upon direct hover or focus, signaling interactive affordance.

## 5. Components

### Buttons
- **Shape:** Soft rounded corners (8px radius)
- **Primary:** Soft Neon Blue (#b4c5ff) background with dark blue text (#002a78). Internal padding is 8px vertical, 16px horizontal.
- **Hover / Focus:** Shifts to brighter blue (#dbe1ff) with slightly stronger drop shadow.

### Cards / Containers
- **Corner Style:** Tactile rounded corners (12px radius)
- **Background:** Midnight Container (#010f1f)
- **Shadow Strategy:** 1px border (#434655) with 20% opacity and low-opacity shadow (`0 1px 3px rgba(0,0,0,0.2)`).
- **Internal Padding:** 20px on all sides.

### Status Badges / Chips
- **Style:** Small rounded pills (9999px radius) with 10% background opacity of the state color, carrying a small solid colored circle indicator.
- **State Colors:** 
  - VERIFIED (Xác nhận): Neon Cyan (#4cd7f6)
  - PENDING (Chờ duyệt): Muted Coral (#ffb596)
  - REJECTED (Từ chối): Soft Red (#ffb4ab)

## 6. Do's and Don'ts

### Do:
- **Do** write vehicle license plates in JetBrains Mono uppercase.
- **Do** verify color contrast matches WCAG AA (≥4.5:1) for all labels, especially on dark slate-gray text.
- **Do** define absolute card boundaries using `#434655` borders with low opacity.

### Don't:
- **Don't** use colored left-border stripes as status accents on cards or rows. Use status badges/chips instead.
- **Don't** use decorative blurs (glassmorphism) behind dashboard grids or headers. 
- **Don't** use gradient text under any circumstances. Keep all typography solid.
- **Don't** animate video feeds or camera cards on hover; only transform borders or background state.
