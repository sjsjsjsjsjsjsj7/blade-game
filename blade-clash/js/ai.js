// Smart Combat AI Controller for 1-Player Mode

class AIController {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty; // 'easy', 'normal', 'hard'
    this.actionTimer = 0;
    this.currentAction = 'idle';
    this.reactionDelay = 0;
    this.blockDuration = 0;
    this.retreatTimer = 0;
    this.nextAttackDelay = 0;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  update(aiFighter, playerFighter) {
    const input = {
      left: false,
      right: false,
      jump: false,
      block: false,
      attack: false,
      heavy: false,
      dash: false
    };

    if (aiFighter.state === 'guardBreak' || aiFighter.state === 'hurt' || aiFighter.state === 'ko') {
      return input;
    }

    const dx = playerFighter.x - aiFighter.x;
    const absDx = Math.abs(dx);
    const targetDir = dx > 0 ? 1 : -1;
    const isPlayerAttacking = playerFighter.isAttacking();
    const isPlayerGuarding = playerFighter.state === 'block';
    const isPlayerStunned = playerFighter.state === 'guardBreak' || playerFighter.state === 'hurt';

    // Difficulty-based tuning
    let blockProbability = 0.55;
    let parryChance = 0.25;
    let aggressionRate = 0.6;

    if (this.difficulty === 'easy') {
      blockProbability = 0.3;
      parryChance = 0.05;
      aggressionRate = 0.4;
    } else if (this.difficulty === 'hard') {
      blockProbability = 0.85;
      parryChance = 0.55;
      aggressionRate = 0.85;
    }

    // 1. Defense / Block reaction
    if (this.blockDuration > 0) {
      this.blockDuration--;
      input.block = true;
      return input;
    }

    if (isPlayerAttacking && absDx < 120 && aiFighter.guard > 20) {
      if (Math.random() < blockProbability) {
        input.block = true;
        this.blockDuration = Math.floor(Math.random() * 15 + 10);
        return input;
      }
    }

    // 2. Retreat if guard is dangerously low
    if (aiFighter.guard < 25 && this.retreatTimer <= 0) {
      this.retreatTimer = 35;
    }

    if (this.retreatTimer > 0) {
      this.retreatTimer--;
      // Move away from player
      if (targetDir === 1) input.left = true;
      else input.right = true;

      // Occasional jump retreat
      if (this.retreatTimer === 25 && aiFighter.isGrounded) {
        input.jump = true;
      }
      return input;
    }

    // 3. Stunned player punishment!
    if (isPlayerStunned) {
      if (absDx > 75) {
        // Dash or rush close
        if (targetDir === 1) input.right = true;
        else input.left = true;
        if (absDx > 150 && aiFighter.stamina >= 30 && Math.random() < 0.2) {
          input.dash = true;
        }
      } else {
        // Punish with Heavy Slash or combo
        if (Math.random() < 0.6) {
          input.heavy = true;
        } else {
          input.attack = true;
        }
      }
      return input;
    }

    // 4. Melee combat range (absDx <= 85)
    if (absDx <= 85) {
      // Facing the player
      aiFighter.facing = targetDir;

      // Delay between AI attacks
      if (this.nextAttackDelay > 0) {
        this.nextAttackDelay--;
        // Slight circle strafing / footwork
        if (Math.random() < 0.3) {
          if (targetDir === 1) input.left = true;
          else input.right = true;
        }
        return input;
      }

      if (isPlayerGuarding) {
        // Player is blocking -> use heavy attack to crack guard or jump behind!
        if (Math.random() < 0.55) {
          input.heavy = true;
          this.nextAttackDelay = Math.floor(Math.random() * 20 + 20);
        } else if (Math.random() < 0.3 && aiFighter.isGrounded) {
          input.jump = true;
          if (targetDir === 1) input.right = true;
          else input.left = true;
        } else {
          input.attack = true;
          this.nextAttackDelay = Math.floor(Math.random() * 15 + 15);
        }
      } else {
        // Player is open -> Attack!
        if (Math.random() < aggressionRate) {
          if (Math.random() < 0.3) {
            input.heavy = true;
            this.nextAttackDelay = Math.floor(Math.random() * 25 + 25);
          } else {
            input.attack = true;
            this.nextAttackDelay = Math.floor(Math.random() * 14 + 12);
          }
        }
      }
      return input;
    }

    // 5. Approaching the player (absDx > 85)
    if (targetDir === 1) {
      input.right = true;
    } else {
      input.left = true;
    }

    // Dash closing distance
    if (absDx > 200 && aiFighter.stamina >= 35 && Math.random() < 0.05) {
      input.dash = true;
    }

    // Jump-in approach
    if (absDx > 120 && absDx < 260 && aiFighter.isGrounded && Math.random() < 0.025) {
      input.jump = true;
    }

    return input;
  }
}

window.AIController = AIController;
