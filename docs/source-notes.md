# YW3 Source Notes

## Sources

### Base A / Base B data

- https://togenyanweb.appspot.com/Yokai/yw3/YOKAI_latest.html
- https://togenyanweb.appspot.com/Yokai/yw3/ivChecker.html

The latest source table exposes Base A and Base B for HP, Strength, Spirit, Defense, and Speed.

### Formula and mechanics

- https://yokaiwatch.github.io/characters/stat-guide-ykw3.html

The referenced guide documents the YW3 float32 operation order and reports verification against game code. This repository implements that documented behavior; it does not claim to have independently repeated the reverse engineering.

## Rank-up endpoint adjustment

For each Base A / Base B endpoint:

```text
rankedBase(x, R) = floor(
  f32(
    f32(f32((100 + 6 * R) * x) * 0.009999999776482582)
    + 0.5
  )
)
```

## Stat formula

```text
progress = f32(f32(L - 1) * 0.0102040814235806465)
delta = f32(IV + AdjustedB - AdjustedA)
product = f32(delta * progress)
growth = f32(f32(AdjustedA) + product)
withSportsClub = f32(growth + f32(Fitness))
withEquipment = f32(withSportsClub + f32(Equipment))

Displayed = clamp(trunc(withEquipment), 1, 999)
```

There is no attitude-EV term.

## Reverse-search constraints

```text
HP_IV / 2 + STR_IV + SPR_IV + DEF_IV + SPD_IV = 40
```

HP IV is searched in even steps from 0 to 80. The other IVs are searched from 0 to 40.

## Regression fixture

The public YW3 guide gives a level-50 Jibanyan example with IV `16 / 8 / 8 / 8 / 8`.

- original Rank D: 206 / 97 / 28 / 60 / 126
- four rank-ups to S: 254 / 120 / 33 / 74 / 156
- then five Strength Sports Club sessions: 254 / 145 / 33 / 64 / 156

These values are covered by tests.
