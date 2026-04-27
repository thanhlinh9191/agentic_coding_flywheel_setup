# TODO: Complete Guide Redesign

## 1. Planning & Setup
- [ ] Initialize this TODO list.
- [ ] Define the "Monochrome + One" color palette (Black, White, Zinc, + 1 Accent).

## 2. Refactoring `guide-components.tsx`
- [ ] **Typography & Basic Components:**
  - [ ] Rewrite `GuideSection` to use massive numbers, naked typography, and support the 12-column grid.
  - [ ] Rewrite `P`, `Hl`, `SubSection` to be clean, unboxed text.
  - [ ] Rewrite `Divider` to be stark and minimal.
- [ ] **Marginalia Components (The "Tufte" Grid):**
  - [ ] Create a `Marginalia` wrapper component to push content into the right column on desktop.
  - [ ] Rewrite `PromptBlock` to drop the heavy card background. Make it a stark, terminal-like text block with a single sharp left border.
  - [ ] Rewrite `TipBox` to drop the background color. Use naked typography.
- [ ] **Navigation & HUD:**
  - [ ] Build a new `FloatingHUD` component (bottom center pill) for progress and TOC navigation.

## 3. Refactoring Visualizations (`Cinematic Scrollytelling`)
- [ ] Update `ContextHorizonViz` to fit the monochrome+one style and "naked" feel.
- [ ] Update `FlywheelDiagram` to use the stripped-back palette.
- [ ] Update `AgentMailViz`, `PlanToBeadsViz`, `PlanEvolutionStudio`, `ConvergenceViz`.
- [ ] Implement `StickyScrollytelling` wrapper.

## 4. Refactoring `page.tsx`
- [ ] Change the layout container to a CSS Grid (12-column).
- [ ] Apply the Marginalia wrapper to prompts, tips, and minor visuals.
- [ ] Implement the `FloatingHUD` at the page level and remove the old sidebar.
- [ ] Polish the Hero section to match the new aesthetic.