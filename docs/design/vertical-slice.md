# Bunny Survivor — Vertical Slice Design

Scope: one playable bunny, Waves 1–5, full Shop between Waves, ending in the
wave-5 Boss. Terms in **bold** are defined in [`../../CONTEXT.md`](../../CONTEXT.md).

All numbers below are **starting values, expected to be tuned in playtesting.**

---

## 1. Definition of done

A full **Run** of Waves 1–5 ending in the Bloatlord fight is fun in one sitting on a
ThinkPad T490 at a stable 60 fps.

## 2. Technical frame

| | |
|---|---|
| Stack | TypeScript · PixiJS v8 · Vite · Vitest ([ADR 0001](../adr/0001-web-typescript-pixijs.md)) |
| Resolution | 1280×720 logical, integer-scaled to the window, `pixelated` |
| Camera | none — fixed **Arena**, no scroll |
| Simulation | fixed 60 Hz timestep, accumulator, render interpolation, seeded RNG ([ADR 0002](../adr/0002-deterministic-fixed-timestep-sim.md)) |
| Collision | circle vs circle over a spatial hash grid (~48 px cells) |
| Rendering (slice) | Pixi `Graphics` shapes; textures swap in later with no logic change |
| HUD / Shop / Level-Up | DOM overlays, not Pixi |
| Run state machine | `Menu → Wave → Shop → LevelUp → (GameOver \| Victory)` |
| Entity caps | 400 enemies (overflow queued), 300 projectiles, 200 pickups (vacuum oldest) |
| Degrade path | reduce particle density → then lower the enemy cap |

## 3. The bunny

| Attribute | Value |
|---|---|
| Base Max HP | 12 |
| Base move speed | 100 px/s, 8-way |
| Input | WASD + arrow keys + gamepad left stick |
| Aiming | none — every Weapon auto-fires at the nearest enemy |
| On taking a hit | 0.3 s of i-frames (low-end fairness buffer) + the Dodge Stat |
| Dash | none for the baseline bunny |
| Starting loadout | Knife (Level I); all Stats at base |
| Hitbox | small forgiving circle |

Global formulas: Crit damage ×1.5 fixed · Armor `reduction = armor / (armor + 100)` ·
Dodge capped at 60%.

## 4. Stats

Max HP · HP Regen · Lifesteal% · **Damage%** (global) · **Melee Damage** ·
**Energy Damage** · **Explosive Damage** · Attack Speed% · Crit Chance% · Armor ·
Dodge% · Move Speed% · Pickup Range · Luck (roll quality) · Harvesting (bonus Carrots/Wave).

**Weapon Family → Stat coupling**

| Family | Scales with |
|---|---|
| Melee | Melee Damage + Attack Speed |
| Laser | Energy Damage + Attack Speed (strong) |
| Plasma | Explosive Damage + Crit Chance |

Global Damage% applies on top of all three.

## 5. Weapons

Six **Weapon Slots**, auto-fire at nearest, bought and upgraded (I→III) in the **Shop**.

| Weapon | Family | Level I profile | Identity |
|---|---|---|---|
| Knife | Melee | 6 dmg, 2.0 atk/s, 60 px reach, 60° arc | fast chip damage |
| Wooden Stake | Melee | 14 dmg, 0.9 atk/s, 45 px reach | slow, heavy, **+100% vs Vampires** |
| Laser Pistol | Laser | 3 dmg/hit, 4.0 atk/s, hitscan, pierces 2 | high fire rate, low per-hit |
| Plasma Cannon | Plasma | 22 direct + 12 splash (r 70), 0.6 atk/s, lobbed | AoE, clears swarms |

Per-level scaling (rough): +~40% damage and a small fire-rate / pierce / radius bump per level.

## 6. Enemies

**Band** system: each type has a Wave range and a stat multiplier. Base values are at
Wave 1; HP and Contact Damage scale +12% per Wave ([ADR 0003](../adr/0003-wave-only-difficulty-scaling.md)).

| Enemy | Archetype | Bands | HP | Speed | Attack | Weakness |
|---|---|---|---|---|---|---|
| Shambler | Zombie | 1–5 | 10 | 45 | Contact 3, swarms | Plasma +30% |
| Spitter | Zombie | 3–5 | 14 | 40 | ranged spit, 4 dmg projectile | Plasma +30% |
| Fledgling | Vampire | 2–5 | 7 | 95 | dash + Contact 2, heals self on hit | Stake +100% |
| Stalker | Vampire | 4–5 | 12 | 80, flies (ignores walls/cover) | blood-bolt, 5 dmg | Stake +100% |

### Boss — The Bloatlord (Wave 5)

Zombie. HP ≈ 450 (~45× a Wave-5 Shambler), move speed 30. Light trickle of normal adds
continues through the fight. Every attack **Telegraphed** with a white flash + scale-up
tween 0.6–0.8 s before it lands. On death → **Victory**.

**Phase 1 (100–50% HP)**
- Chase, Contact 8.
- Ground-Pound every 6 s: 0.8 s wind-up → expanding shockwave ring, 12 dmg, avoided by spacing.
- Summon: 4 Shamblers every 10 s.

**Phase 2 (below 50% HP)**
- Move speed +40%.
- Ground-Pound cooldown → 4 s.
- New — Spore Burst: lobs 3 spore clouds that linger 4 s, 3 dmg/s while stood in them.
- Summon → 3 Shamblers + 1 Spitter.

## 7. Waves

| Wave | Length | Contents | Notes |
|---|---|---|---|
| 1 | 20 s | ~18 Shamblers | gentle intro |
| 2 | 24 s | + Fledglings (~28 total) | |
| 3 | 28 s | + Spitters (~36 total) | Shop unlocks Level II offers afterward |
| 4 | 32 s | mixed (~48 total) | first real pressure spike |
| 5 | — | Bloatlord + add trickle | no timer; ends on Boss death. Level III offers in the pre-Wave Shop |

Enemies spawn continuously against a per-Wave budget, entering from just off the Arena edges.

## 8. Economy — Carrots

Single resource; shop money **and** experience at once.

- Every kill drops 1 Carrot (Elites 3). Collecting counts toward the next **Level**;
  the full amount stays spendable.
- Wave-end payout: `5 + wave × 3`, plus the Harvesting Stat.
- **Level-Up**: brief pause, pick 1 of 3 — a small Stat gain or a free Level-I Item.
  Stat pool: `+1 Max HP`, `+5% Damage`, `+8% Attack Speed`, `+3% Crit`, `+5 Armor`,
  `+5% Dodge`, `+6% Move Speed`, `+10 Pickup Range`, `+1 HP Regen`.
- Level curve: Level 2 at 8 Carrots collected, ×1.5 each Level after.

## 9. Shop

- 4 offer slots, mixing Weapons and Items.
- **Reroll**: cost 1, then +1 per use, resets each Wave.
- **Lock**: keeps one offer through the next Reroll.
- Sell-back: 50% of purchase price.
- Level gating: Level II offers from Wave 3, Level III from Wave 5.

## 10. Items (13, stackable Stat modifiers, base 8–15 Carrots)

| Item | Effect |
|---|---|
| Sharpening Stone | +3 Melee Damage |
| Focusing Lens | +3 Energy Damage |
| Blast Compound | +3 Explosive Damage |
| Adrenal Chip | +8% Attack Speed |
| Targeting VI | +4% Crit Chance |
| Nano-Plate | +6 Armor |
| Reflex Booster | +5% Dodge |
| Hydraulic Legs | +6% Move Speed |
| Carrot Magnet | +25 Pickup Range |
| Regen Nodule | +1 HP Regen/s |
| Bloodfang Serum | +4% Lifesteal |
| Lucky Foot | +10% Luck |
| Compost Unit | +2 Harvesting |

Price rises with the number already owned and with the current Wave.

## 11. Explicitly out of the slice

Audio & music · between-Run meta-progression and unlocks · multiple characters ·
settings beyond volume · touch / mobile · mid-Run save · sprite art (shapes only) ·
Waves 6–20 · the wave-10 mini-boss and wave-20 final Boss · localization.

## 12. Full-game shape (post-slice, for context only)

20 Waves, 20–40 s each, +12%/Wave scaling, wave-driven only. Zombie-dominant Waves 1–7 →
mixed 6–14 → Vampire-dominant 12–20. Vampire mini-boss at Wave 10; player-flavored final
Boss at Wave 20.

## 13. Performance (issue #14)

**Entity caps and overflow.** 400 enemies / 300 projectiles / 200 pickups (§2), enforced by
`EntityStore.spawn` refusing once its cap is full. Verified by `test/sim/entityStore.test.ts`.
Overflow policy differs by kind, per §2's parentheticals:
- **Enemies**: queued. `waveDirector.drainDueSpawns` leaves a due-but-refused spawn at the
  front of the schedule to retry next tick, in order — nothing is dropped
  (`test/sim/waveDirector.test.ts`).
- **Pickups**: vacuum oldest. `EntityStore.spawnVacuumingOldest` evicts the single oldest
  active Carrot to make room, so a kill's drop is never silently lost even with 200 already
  on the ground (`test/sim/entityStore.test.ts`, `test/sim/pickupOverflow.test.ts`). Before
  this issue, `killEnemy` used plain `spawn`, which — at the cap — silently dropped the new
  Carrot instead; this was a real gap, not just an unenforced policy.
- **Projectiles**: no policy is specified for this kind in §2's table; a full store simply
  skips that tick's shot. Projectiles are short-lived (`PROJECTILE_TTL_SECONDS`), so a missed
  spawn attempt is low-impact and doesn't need queuing or vacuuming.

**Degrade path.** §2: "reduce particle density first, then lower the enemy cap, when frame
time slips." This slice has no particle-effects system yet (hit-flashes, death bursts, etc.
aren't built), so only the second lever applies today. `src/game/perfDegrade.ts`'s
`nextEnemyCap` is the tested decision function — given whether the current frame is over
budget, it steps `EntityStore.setCapacity`'s target down (floored) or recovers it back up
(capped at the base 400) by a fixed step. It is **not wired to a live frame-time source**:
the step size, the slow-frame threshold, and how many consecutive slow frames should trigger
a step are all tuning constants that need real measurements to set sensibly, and this
environment can't produce those (see below). Wiring it blind would just be a different kind
of guess.

**Rendering: one ParticleContainer per shape.** §2: "single ParticleContainer per shape/sprite
type." The three multi-instance layers (enemies, Carrots, Spore Burst clouds) moved from a
plain `Container` of individually-drawn `Graphics` circles to a `ParticleContainer` per layer,
each sharing one baked circle `Texture` (`createCircleTexture`, via
`renderer.generateTexture`) — see `src/systems/render.ts`. The Boss and bunny stay as plain
`Graphics`: they're singletons, so there's nothing to batch. Functional correctness (particles
appear, move, and are removed on despawn, across all three layers, with no console errors) was
verified by running the game in headless Chromium — see `.claude/skills/visual-check/`.

**What couldn't be measured here.** The acceptance criterion is "sustained 60fps through a
Wave-5 Boss fight on a T490-class machine." This development environment has no GPU — even
the visual-check tooling runs headless Chromium on software rendering
(`--use-gl=swiftshader`) — so no fps number in this document would be a real measurement, and
none is recorded here to avoid manufacturing false confidence. What a human with the actual
T490 (or similar integrated-graphics) hardware should do to close this out:
1. Run a build (`npm run build && npm run preview`, or `npm run dev`) on the target machine.
2. Force a worst-case Wave 4–5 scene (e.g. temporarily lower `WAVE_TOTAL_COUNTS`/durations,
   or spawn near-cap enemies directly via the console) and watch DevTools' Performance panel
   or an on-screen fps counter through the Boss fight.
3. If frame time slips, that's exactly the signal `nextEnemyCap` is designed to consume —
   wire it into `game/loop.ts`'s frame timing and `state.enemies.setCapacity`, then tune
   `stepDown`/`floorCap`/the slow-frame threshold against what was actually observed, not
   guessed numbers.
