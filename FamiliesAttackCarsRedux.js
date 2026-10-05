// Families Attack Cars Redux v1.0
// by Flaqko
// GTA San Andreas 1.0 (Classic) + CLEO Redux + CLEO+
//
// Remaster of the old FAMILIES_ATTACK_CAR script.
// Instead of ordering a homie to destroy a vehicle, recruited group members
// attack the DRIVER of a vehicle that CJ actually damages with a weapon.
// Empty vehicles are ignored.

const MOD_NAME = "Families Attack Cars Redux";
const VERSION = "v1.0";

// Tunables
const DETECTION_RADIUS = 95.0;       // Only inspect cars near CJ when he is firing.
const HOMIE_COMMAND_RADIUS = 70.0;  // Only command recruited members reasonably near CJ.
const TARGET_LEASH_RADIUS = 95.0;   // Stop refreshing the attack once the driver escapes this far.
const TARGET_MEMORY_MS = 24000;     // Maximum time to keep one driver as the target.
const TASK_DURATION_MS = 7000;      // Timed attack task; refreshed only while the target is relevant.
const TASK_REFRESH_MS = 3500;       // Low-frequency refresh so the group does not chase forever.
const SHOT_GRACE_MS = 180;          // Covers the few frames around a weapon shot/impact.
const DEBUG = false;

const player = new Player(0);

let activeTarget = null;
let activeUntil = 0;
let nextTaskRefresh = 0;
let targetWasInCar = false;
let scanUntil = 0;

function debug(message) {
    if (DEBUG) {
        log(`[${MOD_NAME}] ${message}`);
    }
}

function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return (dx * dx) + (dy * dy) + (dz * dz);
}

function isUsableChar(char) {
    return char !== undefined && char !== null && Char.DoesExist(char) && !Char.IsDead(char);
}

function hasRecruitedMembers(group) {
    if (group === undefined || group === null || !Group.DoesExist(group)) {
        return false;
    }

    const size = group.getSize();
    return size !== undefined && size.numMembers > 0;
}

function commandGroupAgainst(target, cj, group) {
    if (!isUsableChar(target) || !isUsableChar(cj) || !Group.DoesExist(group)) {
        return 0;
    }

    const size = group.getSize();
    const cjPos = cj.getCoordinates();
    const maxDistSq = HOMIE_COMMAND_RADIUS * HOMIE_COMMAND_RADIUS;
    let commanded = 0;

    // San Andreas player groups have a small fixed member limit. getSize() lets us
    // touch only the active slots instead of scanning the ambient ped pool.
    for (let slot = 0; slot < size.numMembers; slot++) {
        const member = group.getMember(slot);

        if (!isUsableChar(member)) {
            continue;
        }

        // Extra safety: only affect actual members of CJ's current group.
        if (!member.isGroupMember(group)) {
            continue;
        }

        // Do not force passengers/drivers out of their current vehicle. Vanilla/group
        // combat can handle them while they are riding; this task is for on-foot homies.
        if (member.isInAnyCar()) {
            continue;
        }

        const memberPos = member.getCoordinates();
        if (distanceSquared(memberPos, cjPos) > maxDistSq) {
            continue;
        }

        Task.KillCharOnFootTimed(member, target, TASK_DURATION_MS);
        commanded++;
    }

    return commanded;
}

function acquireDriverFromFreshCarDamage(cj, group) {
    const cjPos = cj.getCoordinates();

    // CLEO+ recursive NO_SAVE search. This walks nearby traffic without claiming
    // vehicles or keeping them in memory for the script.
    let car = World.GetRandomCarInSphereNoSaveRecursive(
        cjPos.x,
        cjPos.y,
        cjPos.z,
        DETECTION_RADIUS,
        false,
        true
    );

    while (car !== undefined && car !== null && Car.DoesExist(car)) {
        // CLEO+ only succeeds here when this car received weapon damage last frame.
        const damage = car.getWeaponDamageLastFrame();

        if (damage !== undefined && damage !== null && damage.intensity > 0.0) {
            const damager = damage.char;

            // React only to damage caused by CJ, identified as the player-group leader.
            if (isUsableChar(damager) && damager.isGroupLeader(group)) {
                const driver = car.getDriver();

                // This is the core remaster rule: no driver = no target.
                if (isUsableChar(driver)) {
                    // Never turn CJ's own recruited member into the target.
                    if (!driver.isGroupMember(group) && !driver.isGroupLeader(group)) {
                        return driver;
                    }
                }
            }
        }

        car = World.GetRandomCarInSphereNoSaveRecursive(
            cjPos.x,
            cjPos.y,
            cjPos.z,
            DETECTION_RADIUS,
            true,
            true
        );
    }

    return null;
}

function clearTarget() {
    activeTarget = null;
    activeUntil = 0;
    nextTaskRefresh = 0;
    targetWasInCar = false;
}

while (true) {
    wait(0);

    const now = Date.now();
    const cj = player.getChar();

    if (!isUsableChar(cj)) {
        clearTarget();
        continue;
    }

    const group = player.getGroup();
    if (!hasRecruitedMembers(group)) {
        clearTarget();
        continue;
    }

    // Only do the vehicle scan around actual gunfire. The short grace window helps
    // catch the frame in which the projectile damage is registered.
    if (cj.isShooting()) {
        scanUntil = now + SHOT_GRACE_MS;
    }

    if (now <= scanUntil) {
        const freshDriver = acquireDriverFromFreshCarDamage(cj, group);

        if (freshDriver !== null) {
            activeTarget = freshDriver;
            activeUntil = now + TARGET_MEMORY_MS;
            nextTaskRefresh = now;
            targetWasInCar = freshDriver.isInAnyCar();
            debug("CJ hit an occupied vehicle; driver acquired as threat.");
        }
    }

    if (activeTarget === null) {
        continue;
    }

    if (!isUsableChar(activeTarget) || now >= activeUntil) {
        clearTarget();
        continue;
    }

    const cjPos = cj.getCoordinates();
    const targetPos = activeTarget.getCoordinates();
    const leashSq = TARGET_LEASH_RADIUS * TARGET_LEASH_RADIUS;

    if (distanceSquared(cjPos, targetPos) > leashSq) {
        clearTarget();
        continue;
    }

    const targetInCar = activeTarget.isInAnyCar();

    // Reissue immediately when the remembered driver gets out. This is the behavior
    // the old TASK_DESTROY_CAR version could not preserve.
    if (targetWasInCar && !targetInCar) {
        const count = commandGroupAgainst(activeTarget, cj, group);
        nextTaskRefresh = now + TASK_REFRESH_MS;
        debug(`Driver exited; refreshed attack for ${count} group member(s).`);
    }

    targetWasInCar = targetInCar;

    if (now >= nextTaskRefresh) {
        const count = commandGroupAgainst(activeTarget, cj, group);
        nextTaskRefresh = now + TASK_REFRESH_MS;
        debug(`Attack refreshed for ${count} group member(s).`);
    }
}
