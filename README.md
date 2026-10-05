# Families Attack Cars Redux v1.0

**Creator:** Flaqko  
**Game:** Grand Theft Auto: San Andreas 1.0 (Classic)  
**Runtime:** CLEO Redux  
**Required:** CLEO+ 1.2.0 or newer

## Overview

Families Attack Cars Redux is a remaster of the old `FAMILIES_ATTACK_CAR` CLEO script.

Instead of ordering recruited homies to destroy a vehicle CJ has damaged, this version treats the **driver as the threat**.

## Features

- When CJ shoots an **occupied vehicle**, nearby recruited homies attack the **driver**.
- The same driver remains the target if they exit the vehicle.
- **Empty vehicles are ignored.** Homies do not waste time attacking abandoned cars.
- Multiple nearby on-foot recruited members can respond.
- Homies already inside vehicles are left alone instead of being forcibly pulled out.
- Uses CLEO+ fresh weapon-damage detection rather than a stale vehicle-damaged flag.
- Uses `GET_RANDOM_CAR_IN_SPHERE_NO_SAVE_RECURSIVE` so ambient traffic is inspected without being claimed or retained by the script.
- Driver targeting has a distance leash and timeout to prevent endless cross-map pursuit.
- Attack tasks are refreshed at a low frequency rather than being spammed every frame.
- No filesystem or memory permissions are required.

## Installation

Copy the folder:

`FamiliesAttackCarsRedux`

into:

`Grand Theft Auto San Andreas\CLEO\`

Final path:

`Grand Theft Auto San Andreas\CLEO\FamiliesAttackCarsRedux\index.js`

## Requirements

- GTA San Andreas Classic PC 1.0
- CLEO Redux
- CLEO+ 1.2.0 or newer

## v1.0

- First stable release.
- Reworked the original car-destruction behavior into driver-focused combat.
- Empty vehicles are ignored.
- Drivers remain valid targets after exiting their vehicle.
- Uses ownership-neutral NO_SAVE recursive vehicle discovery.
- Added range, timeout, and low-frequency task refresh safeguards.

## Credits

Original concept/script: `FAMILIES_ATTACK_CAR`  
Redux remaster: **Flaqko**
