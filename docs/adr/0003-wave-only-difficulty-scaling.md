# Difficulty scales with wave number only, never with player power

Enemy count, HP, and damage are a function of the current Wave alone (roughly +12%
per Wave). The game does not measure how strong the bunny's build is and does not
scale enemies to compensate.

## Why

This is a deliberate deviation a future contributor might try to "fix" by adding
rubber-banding. Wave-only scaling keeps every Run legible — the player learns "wave 12
hits this hard" — and makes the numbers testable and tunable in isolation. Scaling to
player power would undermine the core fantasy of out-scaling the horde through good Shop
decisions, and would make balance non-reproducible.

## Consequences

A snowballed build trivialises the late Waves. That is acceptable and is the player's
reward for good decisions.
