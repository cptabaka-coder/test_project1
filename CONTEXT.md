# Bunny Survivor

A top-down arena horde-survivor: a lone cybernetic bunny holds an enclosed arena
against escalating waves of undead rabbits, growing stronger between fights by
spending what the horde drops.

## The Run

**Run**:
One attempt from wave 1 to either the bunny's death or the defeat of the final Boss.
Carries all progress — Carrots, Level, Weapons, Items — and resets to nothing on the next Run.
_Avoid_: game, match, session, playthrough

**Wave**:
A single timed assault. Enemies spawn against a fixed budget for its duration; when the
timer expires the survivors are cleared and the Shop opens. A Boss Wave has no timer and
ends only when the Boss dies.
_Avoid_: round, level, stage

**Vertical Slice**:
The first shippable cut of the game: Waves 1–5, one playable bunny, four Weapons,
ending in the wave-5 Boss.
_Avoid_: demo, prototype, MVP

## The Arena

**Arena**:
The single fixed screen the whole Run is fought in. Walls on all sides; no scrolling.
Enemies enter from just outside its edges.
_Avoid_: map, level, field, stage

**Band**:
The range of Waves an enemy type appears in, together with the stat multiplier it carries.
Replaces any notion of per-enemy experience or ranks.
_Avoid_: tier (reserved for Weapon Level), rank, difficulty

**Telegraph**:
The visible wind-up — a flash and scale-up — that precedes every Boss attack, giving the
bunny a fixed window to react.
_Avoid_: tell, warning, cast

**Contact Damage**:
Damage dealt to the bunny by an enemy overlapping it, as opposed to a projectile.
_Avoid_: touch damage, melee damage (that is a bunny Stat), collision damage

## The Build

**Carrot**:
The Run's only resource. Drops from kills, is also awarded at each Wave's end, and counts
toward the next Level as it is collected — yet the full amount stays available to spend in
the Shop.
_Avoid_: coin, gold, money, currency, XP, scrap, biomass

**Level / Level-Up**:
A threshold in total Carrots collected. Reaching it briefly pauses the Wave and offers a
choice of one from three — a small Stat gain or a free Item.
_Avoid_: rank, experience tier

**Stat**:
A named modifier on the bunny (e.g. Max HP, Attack Speed, Explosive Damage) that Items and
Level-Ups adjust and that Weapons read to compute their output.
_Avoid_: attribute, trait, perk

**Weapon Family**:
One of three kinds a Weapon belongs to — Melee, Laser, or Plasma — each keyed to different Stats.
_Avoid_: class, category, weapon type

**Weapon Slot**:
One of the bunny's six carrying positions. Each holds one Weapon, which fires automatically
at the nearest enemy without player aim.
_Avoid_: hardpoint, inventory slot

**Weapon Level**:
A Weapon's power step, I through III, bought in the Shop. Distinct from a Band.
_Avoid_: tier, rank, weapon upgrade

**Item**:
A passive, stackable object bought in the Shop that adjusts one or more Stats. Never fires
and is never placed in a Slot.
_Avoid_: perk, upgrade, augment, relic

**Shop**:
The between-Wave screen. Four offers of Weapons and Items; the bunny may Reroll the offers,
Lock individual ones, and sell owned Weapons and Items back.
_Avoid_: store, market, vendor

**Reroll**:
Replacing the current Shop offers with a fresh set for a Carrot cost that rises with each
use and resets each Wave.
_Avoid_: refresh, shuffle

**Lock**:
Marking a single Shop offer so it survives the next Reroll.
_Avoid_: pin, hold, reserve

## The Enemies

**Zombie**:
The undead-rabbit archetype that is slow, high-HP, and melee: it presses in numbers and
takes extra damage from Plasma. Dominant in the early Bands.
_Avoid_: ghoul, walker, undead (that covers both archetypes)

**Vampire**:
The undead-rabbit archetype that is fast and fragile, moves erratically, heals itself by
striking the bunny, and at higher Bands flies and throws blood-bolts. Takes extra damage
from a Wooden Stake. Dominant in the late Bands.
_Avoid_: bat, nosferatu, leech

**Lifesteal**:
Health an enemy gains by damaging the bunny. Also the name of the bunny Stat that does the reverse.
_Avoid_: drain, siphon, vampirism

**Elite**:
A single reinforced enemy worth extra Carrots — a step below a Boss.
_Avoid_: champion, brute, mini-boss (reserved for the wave-10 Boss)

**Boss**:
The oversized enemy that ends a Boss Wave. Has two Phases split at half HP and Telegraphed
attacks. The Vertical Slice's Boss is **The Bloatlord**, a Zombie.
_Avoid_: raid boss

**Phase**:
One of a Boss's two behaviour states, the second beginning at 50% HP with faster and
additional attacks.
_Avoid_: stage, form
