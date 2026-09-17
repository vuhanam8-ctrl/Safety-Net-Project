/*
 * Slime Mold Food Simulation
 * Copyright (C) 2026 Vu Hai Nam
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See LICENSE.txt for the complete license text.
 */

// Ball class

class Ball {
  constructor(x, y, direction, team = "white") {
    this.x = x ?? random(
      width / 2 - 20,
      width / 2 + 20
    );

    this.y = y ?? random(
      height / 2 - 20,
      height / 2 + 20
    );

    this.direction =
      direction ?? random(360);
    this.team = team;
    this.antiVariant = team === "anti"
      ? floor(random(ANTI_TOKEN_STYLES.length))
      : null;

    this.radius = 0.5;
    this.speed = 1;
    this.turnAngle = 35;

    this.leftSensor = createVector();
    this.frontSensor = createVector();
    this.rightSensor = createVector();

    this.sensorAngle = 45;
    this.sensorDistance = 12;
    this.isSearchingForFood = false;
    this.hasReachedFood = false;
    this.wasPulledByWave = false;

    this.colonyTurnTimer = random(10, 50);

    this.isDispersing = false;
    this.dispersalTimer = 0;
    this.antiTrailPoints = [];
  }

  update() {
    this.detectFood();
    this.updateSensorPositions();
    this.respondToSensorSignals();
    this.updateFoodMovement();
    this.updateDispersal();

    this.direction =
      (this.direction + 360) % 360;
  }

  detectFood() {
    if (!food?.isAvailable || food.isErasing) return;

    const distance = this.distanceFromFood();

    if (!food.isTeamActive(this.team) && distance < food.discoveryRadius) {
      food.activate(this.team);
    }

    this.respondToActiveFood(distance);
  }

  respondToActiveFood(distance) {
    if (!food.canTeamClaim(this.team)) {
      this.isSearchingForFood = false;
      this.wasPulledByWave = false;
      return;
    }

    if (!food.isTeamActive(this.team) || this.isDispersing) return;
    if (this.hasReachedFood) return;

    if (distance < food.attractionRadius) {
      this.isSearchingForFood = true;
    }
  }

  updateSensorPositions() {
    this.setSensorPosition(
      this.leftSensor,
      this.direction - this.sensorAngle
    );

    this.setSensorPosition(
      this.frontSensor,
      this.direction
    );

    this.setSensorPosition(
      this.rightSensor,
      this.direction + this.sensorAngle
    );
  }

  respondToSensorSignals() {
    if (this.isDispersing || this.hasReachedFood) return;

    if (this.team === "anti" && this.avoidWhiteBarrier()) return;

    const left = this.readSensor(this.leftSensor);
    const front = this.readSensor(this.frontSensor);
    const right = this.readSensor(this.rightSensor);

    this.followChemicalTrail(left, front, right);
  }

  avoidWhiteBarrier() {
    const left = this.readBarrier(this.leftSensor);
    const front = this.readBarrier(this.frontSensor);
    const right = this.readBarrier(this.rightSensor);

    if (max(left, front, right) < 18) return false;

    if (front >= left && front >= right) {
      this.direction += left < right ? -110 : 110;
    } else if (left > right) {
      this.direction += 70;
    } else {
      this.direction -= 70;
    }

    return true;
  }

  followChemicalTrail(left, front, right) {
    this.direction += random(-1.5, 1.5);

    if (max(left, front, right) < 5) {
      this.direction += random(-8, 8);
      return;
    }

    this.turnTowardStrongestSignal(left, front, right);
    this.randomlyExplore();
  }

  turnTowardStrongestSignal(left, front, right) {
    if (front > left && front > right) return;

    if (front < left && front < right) {
      this.turnRandomly();
    } else if (left > right) {
      this.direction -= this.turnAngle;
    } else if (right > left) {
      this.direction += this.turnAngle;
    }
  }

  turnRandomly() {
    const turnDirection = random(1) < 0.5 ? -1 : 1;
    this.direction += this.turnAngle * turnDirection;
  }

  randomlyExplore() {
    if (random(1) < 0.008) {
      this.direction += random(-100, 100);
    }
  }

  updateFoodMovement() {
    if (this.shouldMoveTowardFood()) {
      this.moveTowardFood();
    }

    if (this.shouldMoveInsideColony()) {
      this.moveInsideColony();
    } else {
      this.moveForward();
    }
  }

  shouldMoveTowardFood() {
    return (
      this.isSearchingForFood &&
      !this.hasReachedFood &&
      food?.isAvailable
    );
  }

  shouldMoveInsideColony() {
    return (
      this.hasReachedFood &&
      food?.isAvailable
    );
  }

  moveTowardFood() {
    const targetDirection = this.directionToFood();
    const difference = angleDifference(
      this.direction,
      targetDirection
    );

    this.direction +=
      difference * this.getFoodSteeringStrength();

    this.checkFoodArrival();
  }

  getFoodSteeringStrength() {
    return this.wasPulledByWave
      ? food.scoutSteeringStrength
      : food.steeringStrength;
  }

  checkFoodArrival() {
    if (this.distanceFromFood() >= food.reachRadius) return;
    if (!food.canTeamClaim(this.team)) {
      this.isSearchingForFood = false;
      this.wasPulledByWave = false;
      this.direction = this.directionToFood() + 180 + random(-55, 55);
      return;
    }
    if (food.isFull(this.team)) {
      this.isSearchingForFood = false;
      this.wasPulledByWave = false;
      return;
    }

    if (!food.isTeamActive(this.team)) food.activate(this.team);

    if (!food.recordBallArrival(this)) return;

    this.hasReachedFood = true;
    this.isSearchingForFood = false;
    this.wasPulledByWave = false;

    this.direction += random(-90, 90);
  }

  moveInsideColony() {
    this.updateColonyDirection();
    this.steerAwayFromColonyEdge();
    this.moveWithinColonyBoundary();
  }

  updateColonyDirection() {
    this.colonyTurnTimer--;
    this.direction += random(-3, 3);

    if (this.colonyTurnTimer > 0) return;

    this.direction += random(-70, 70);
    this.colonyTurnTimer = random(10, 50);
  }

  steerAwayFromColonyEdge() {
    const distance = this.distanceFromFood();
    const edgeStart = food.colonyRadius * 0.75;

    if (distance <= edgeStart) return;

    const strength = map(
      distance,
      edgeStart,
      food.colonyRadius,
      0.05,
      0.65,
      true
    );

    this.turnTowardFood(strength);
  }

  turnTowardFood(strength) {
    const difference = angleDifference(
      this.direction,
      this.directionToFood()
    );

    this.direction += difference * strength;
  }

  moveWithinColonyBoundary() {
    let nextX = this.x + cos(this.direction);
    let nextY = this.y + sin(this.direction);

    if (this.isOutsideColony(nextX, nextY)) {
      this.direction =
        this.directionToFood() + random(-35, 35);

      nextX = this.x + cos(this.direction);
      nextY = this.y + sin(this.direction);
    }

    this.x = nextX;
    this.y = nextY;
    this.enforceColonyBoundary();
  }

  enforceColonyBoundary() {
    if (!this.isOutsideColony(this.x, this.y)) return;

    const edgeDirection = atan2(
      this.y - food.y,
      this.x - food.x
    );

    this.placeOnColonyEdge(edgeDirection);
    this.direction =
      edgeDirection + 180 + random(-35, 35);
  }

  placeOnColonyEdge(edgeDirection) {
    const edgeDistance = food.colonyRadius - 1;

    this.x =
      food.x + cos(edgeDirection) * edgeDistance;

    this.y =
      food.y + sin(edgeDirection) * edgeDistance;
  }

  isOutsideColony(x, y) {
    return (
      dist(x, y, food.x, food.y) >
      food.colonyRadius
    );
  }

  moveForward() {
    const horizontalSpeed =
      cos(this.direction) * this.speed;

    const verticalSpeed =
      sin(this.direction) * this.speed;

    this.x =
      (this.x + horizontalSpeed + width) % width;

    this.y =
      (this.y + verticalSpeed + height) % height;
  }

  beginDispersal(centerX, centerY) {
    let outwardDirection = atan2(
      this.y - centerY,
      this.x - centerX
    );

    if (dist(this.x, this.y, centerX, centerY) < 1) {
      outwardDirection = random(360);
    }

    this.resetFoodState();
    this.direction =
      outwardDirection + random(-35, 35);

    this.isDispersing = true;
    this.dispersalTimer = random(50, 100);
    this.speed = random(1.5, 2.5);
  }

  resetFoodState() {
    this.hasReachedFood = false;
    this.isSearchingForFood = false;
    this.wasPulledByWave = false;
  }

  updateDispersal() {
    if (!this.isDispersing) return;

    this.dispersalTimer--;
    this.direction += random(-2, 2);

    if (this.dispersalTimer <= 0) {
      this.isDispersing = false;
      this.speed = 1;
    }
  }

  setSensorPosition(sensor, direction) {
    sensor.x =
      (this.x +
        this.sensorDistance * cos(direction) +
        width) %
      width;

    sensor.y =
      (this.y +
        this.sensorDistance * sin(direction) +
        height) %
      height;
  }

  readSensor(sensor) {
    const layer = this.team === "anti" ? antiSensorLayer : sensorLayer;
    return this.readLayerPixel(layer, sensor, false);
  }

  readBarrier(sensor) {
    return this.readLayerPixel(barrierLayer, sensor, true);
  }

  readLayerPixel(layer, sensor, useAlpha) {
    const x = constrain(floor(sensor.x), 0, width - 1);
    const y = constrain(floor(sensor.y), 0, height - 1);
    const pixelIndex = 4 * (y * width + x);

    return layer.pixels[pixelIndex + (useAlpha ? 3 : 0)] || 0;
  }

  distanceFromFood() {
    return dist(this.x, this.y, food.x, food.y);
  }

  directionToFood() {
    return atan2(
      food.y - this.y,
      food.x - this.x
    );
  }
}



// Food class

class Food {
  constructor(x, y, sequenceNumber) {
    this.x = x;
    this.y = y;
    this.sequenceNumber = sequenceNumber;
    this.outcomeReported = false;
    this.orbitSandGrains = [];

    this.radius = 8;
    this.discoveryRadius = 12;
    this.attractionRadius = 220;
    this.reachRadius = 13;
    this.colonyRadius = 100;

    this.steeringStrength = 0.12;
    this.scoutSteeringStrength = 0.18;

    this.isActive = false;
    this.activeTeams = { white: false, anti: false };
    this.controllingTeam = null;
    this.isAvailable = true;
    this.reachedBallCount = 0;
    this.antiReachedBallCount = 0;
    this.untouchedAge = 0;
    this.untouchedLifetime = 30000;
    this.spawnTime = millis();
    this.nextPhoneToneTime =
      this.spawnTime + PHONE_TONE_START_DELAY;

    this.isErasing = false;
    this.isBlackHole = false;
    this.eraserAge = 0;
    this.eraserDuration = 5000;
    this.maximumEraserRadius = random(
      min(width, height) * 0.12,
      min(width, height) * 0.22
    );

    this.requiredBallCount = 25;
    this.requiredAntiBallCount = 2;
    this.reproductionRate = 2;
    this.fullSince = null;
    this.reproductionDelay = 10000;
    this.partialOrbitSince = null;
    this.partialOrbitDisperseDelay = 13000;
    this.antiFullSince = null;
    this.antiCollapseDelay = 10000;

    this.waveRadius = this.radius;
    this.waveSpeed = 1.2;
    this.waveWidth = 8;
    this.waveMaximumRadius = 190;

    this.isWaveWaiting = true;
    this.waveWaitTimer = floor(random(60, 180));

    this.chosenScoutCount = { white: 0, anti: 0 };
    this.maximumScoutsPerWave = 8;
    this.scoutSelectionChance = 0.12;
  }

  activate(team = "white") {
    this.isActive = true;
    this.activeTeams[team] = true;
    this.isWaveWaiting = true;

    for (const ball of balls) {
      ball.wasPulledByWave = false;
    }

    this.recruitOpposingTeam(team);
  }

  recruitOpposingTeam(activeTeam) {
    const opposingTeam = activeTeam === "white" ? "anti" : "white";
    const candidates = balls
      .filter(ball => ball.team === opposingTeam && !ball.hasReachedFood)
      .sort((first, second) =>
        dist(first.x, first.y, this.x, this.y) -
        dist(second.x, second.y, this.x, this.y)
      )
      .slice(0, 6);

    for (const ball of candidates) {
      ball.isSearchingForFood = true;
      ball.wasPulledByWave = true;
    }
  }

  isTeamActive(team) {
    return this.activeTeams[team];
  }

  canTeamClaim(team) {
    return this.controllingTeam === null || this.controllingTeam === team;
  }

  recordBallArrival(ball) {
    if (!this.canTeamClaim(ball.team) || this.isFull(ball.team)) return false;

    if (this.controllingTeam === null) {
      this.controllingTeam = ball.team;
      this.cancelOpposingSearches(ball.team);
    }

    if (ball.team === "anti") {
      this.antiReachedBallCount = min(
        this.antiReachedBallCount + 1,
        this.requiredAntiBallCount
      );
    } else {
      this.reachedBallCount = min(
        this.reachedBallCount + 1,
        this.requiredBallCount
      );
      if (this.partialOrbitSince === null) {
        this.partialOrbitSince = millis();
      }
    }

    if (phoneToneSound?.isPlaying()) phoneToneSound.stop();

    if (this.isFull(ball.team)) {
      if (ball.team === "anti") this.antiFullSince = millis();
      else this.fullSince = millis();
      this.cancelRemainingSearches();
    }

    return true;
  }

  cancelOpposingSearches(controllingTeam) {
    for (const ball of balls) {
      if (ball.team === controllingTeam || ball.hasReachedFood) continue;
      ball.isSearchingForFood = false;
      ball.wasPulledByWave = false;
      ball.direction = atan2(ball.y - this.y, ball.x - this.x) + random(-50, 50);
    }
  }

  isFull(team = "white") {
    return team === "anti"
      ? this.antiReachedBallCount >= this.requiredAntiBallCount
      : this.reachedBallCount >= this.requiredBallCount;
  }

  update() {
    if (!this.isAvailable) return;

    if (this.isErasing) {
      this.updateEraser();
      return;
    }

    if (!this.isActive) {
      this.updateUntouchedLifetime();
      if (!this.isAvailable || this.isErasing) return;
      this.updateWave();
    }

    if (this.isReadyToReproduce()) {
      this.consume();
      return;
    }

    if (this.isReadyForPartialDisperse()) {
      this.consume();
      return;
    }

    if (this.isReadyForAntiCollapse()) {
      this.consumeByAntiColony();
    }
  }

  isReadyToReproduce() {
    if (!this.isFull() || this.fullSince === null) return false;

    return millis() - this.fullSince >= this.reproductionDelay;
  }

  isReadyForPartialDisperse() {
    if (this.controllingTeam !== "white") return false;
    if (this.reachedBallCount <= 0 || this.isFull()) return false;
    if (this.partialOrbitSince === null) return false;

    return millis() - this.partialOrbitSince >= this.partialOrbitDisperseDelay;
  }

  isReadyForAntiCollapse() {
    if (!this.isFull("anti") || this.antiFullSince === null) return false;
    return millis() - this.antiFullSince >= this.antiCollapseDelay;
  }

  updateUntouchedLifetime() {
    this.untouchedAge += getSimulationDeltaTime();

    if (this.untouchedAge >= this.untouchedLifetime) {
      this.expireUntouched();
    }
  }

  expireUntouched() {
    this.isErasing = true;
    this.eraserAge = 0;
    this.cancelRemainingSearches();
    this.reportOutcome(false);
  }

  reportOutcome(dispersedSuccessfully) {
    if (this.outcomeReported) return;
    this.outcomeReported = true;

    const shouldAdvanceCounter =
      !dispersedSuccessfully || this.sequenceNumber > 1;

    if (!shouldAdvanceCounter) return;

    window.dispatchEvent(new CustomEvent("amigos-heart-counted", {
      detail: {
        sequenceNumber: this.sequenceNumber,
        dispersedSuccessfully,
        x: this.x,
        y: this.y
      }
    }));
  }

  updateEraser() {
    this.eraserAge += getSimulationDeltaTime();
    eraseTrailsAroundFood(this);

    if (this.eraserAge >= this.eraserDuration) {
      this.finishErasing();
    }
  }

  getEraserRadius() {
    return map(
      this.eraserAge,
      0,
      this.eraserDuration,
      this.radius,
      this.maximumEraserRadius,
      true
    );
  }

  finishErasing() {
    this.isErasing = false;
    this.isBlackHole = false;
    this.isAvailable = false;
    scheduleNextFood();
  }

  getUntouchedOpacity() {
    if (this.isActive) return 255;

    return map(
      this.untouchedAge,
      0,
      this.untouchedLifetime,
      255,
      0,
      true
    );
  }

  updateWave() {
    if (this.isWaveWaiting) {
      this.updateWaveTimer();
      return;
    }

    this.waveRadius += this.waveSpeed;
    this.recruitScouts();

    if (this.waveRadius > this.waveMaximumRadius) {
      this.resetWave();
    }
  }

  updateWaveTimer() {
    this.waveWaitTimer--;

    if (this.waveWaitTimer <= 0) {
      this.isWaveWaiting = false;
      this.waveRadius = this.radius;
      this.chosenScoutCount = { white: 0, anti: 0 };
    }
  }

  resetWave() {
    this.isWaveWaiting = true;
    this.waveWaitTimer = floor(random(90, 240));
  }

  recruitScouts() {
    if (this.hasEnoughScouts()) return;

    const candidates = shuffle(balls, false);

    for (const ball of candidates) {
      if (this.hasEnoughScouts()) break;
      if (!this.canRecruit(ball)) continue;

      this.recruitBall(ball);
    }
  }

  hasEnoughScouts(team) {
    if (team) {
      return this.chosenScoutCount[team] >= this.maximumScoutsPerWave;
    }

    return this.hasEnoughScouts("white") && this.hasEnoughScouts("anti");
  }

  canRecruit(ball) {
    if (
      this.hasEnoughScouts(ball.team) ||
      ball.hasReachedFood ||
      ball.isSearchingForFood ||
      ball.isDispersing
    ) {
      return false;
    }

    return (
      this.waveTouches(ball) &&
      random(1) < this.scoutSelectionChance
    );
  }

  waveTouches(ball) {
    const distance = dist(
      ball.x,
      ball.y,
      this.x,
      this.y
    );

    const innerEdge =
      this.waveRadius - this.waveWidth / 2;

    const outerEdge =
      this.waveRadius + this.waveWidth / 2;

    return distance >= innerEdge && distance <= outerEdge;
  }

  recruitBall(ball) {
    ball.isSearchingForFood = true;
    ball.wasPulledByWave = true;
    this.chosenScoutCount[ball.team]++;
  }

  consume() {
    const attachedBalls = balls.filter(
      ball => ball.hasReachedFood && ball.team === "white"
    );
    const antiAttachedBalls = balls.filter(
      ball => ball.hasReachedFood && ball.team === "anti"
    );

    this.reportOutcome(true);

    this.isAvailable = false;
    this.isActive = false;

    createPortraitSandFormation(this);
    this.releaseAttachedBalls(attachedBalls);
    this.releaseLosingAntiBalls(antiAttachedBalls);
    this.createNewBalls(attachedBalls.length);
    this.cancelRemainingSearches();

    scheduleNextFood();
  }

  releaseLosingAntiBalls(antiAttachedBalls) {
    for (const ball of antiAttachedBalls) {
      ball.resetFoodState();
      ball.direction = atan2(ball.y - this.y, ball.x - this.x) + random(-65, 65);
      ball.speed = 1.35;
    }
  }

  consumeByAntiColony() {
    this.reportOutcome(false);
    this.isActive = false;
    this.isBlackHole = true;
    this.isErasing = true;
    this.eraserAge = 0;
    this.maximumEraserRadius *= ANTI_BLACK_HOLE_SCALE;
    this.cancelRemainingSearches();

    for (const ball of balls) {
      if (!ball.hasReachedFood) continue;
      ball.resetFoodState();
      ball.direction = atan2(ball.y - this.y, ball.x - this.x) + random(-55, 55);
    }
  }

  releaseAttachedBalls(attachedBalls) {
    for (const ball of attachedBalls) {
      ball.beginDispersal(this.x, this.y);
    }
  }

  createNewBalls(attachedBallCount) {
    const newBallCount = floor(
      attachedBallCount * this.reproductionRate
    );

    for (let i = 0; i < newBallCount; i++) {
      balls.push(this.createBall());
    }
  }

  createBall() {
    const direction = random(360);
    const distance = random(
      this.radius,
      this.colonyRadius * 0.5
    );

    const ball = new Ball(
      this.x + cos(direction) * distance,
      this.y + sin(direction) * distance,
      direction + random(-30, 30),
      "white"
    );

    ball.beginDispersal(this.x, this.y);
    return ball;
  }

  cancelRemainingSearches() {
    for (const ball of balls) {
      if (!ball.isDispersing) {
        ball.isSearchingForFood = false;
        ball.wasPulledByWave = false;
      }
    }
  }
}




let balls = [];
let food;
let portraitSandFormations = [];

let permanentTrailLayer;
let orbitTrailLayer;
let antiTrailLayer;
let barrierLayer;
let sensorLayer;
let antiSensorLayer;
let foodRespawnTimer = 0;
let foodSequenceCount = 0;
let heartbeatSound;
let monitorBeepSound;
let phoneToneSound;
let flatlineSound;
let flatlinePlayedForCurrentBlackHole = false;
let heartbeatAmplitude;
let heartbeatAudioEnabled = false;
let nextHeartbeatTime = 0;
let canvasSoundEnabled = true;
let ignoreNextDeltaTime = false;
let antiTokenSprites = [];
let sandPortraitImage;
let portraitTargetPixels = [];
let portraitLightPixels = [];
let portraitMidtonePixels = [];
let portraitDarkPixels = [];
let portraitDetailPixels = [];
let portraitAspectRatio = 0.74;

const ANTI_TOKEN_STYLES = [
  { name: "red", trail: [225, 18, 24] },
  { name: "green", trail: [76, 143, 67] },
  { name: "pink", trail: [215, 90, 190] }
];

const STARTING_BALL_COUNT = 90;
const STARTING_ANTI_BALL_COUNT = 9;
const ANTI_TRAIL_LENGTH = 110;
const ANTI_BLACK_HOLE_SCALE = 2;
const MAXIMUM_ORBIT_SAND_GRAINS = 2200;
const SAND_BRUSH_HEART_SCALE = 6;
const SAND_BRUSH_ERASER_RADIUS = 16;
const SAND_BRUSH_GRAINS_PER_STROKE = 25;
const SAND_BRUSH_COOLDOWN = 90;
const MINIMUM_FOOD_RESPAWN_DELAY = 180;
const MAXIMUM_FOOD_RESPAWN_DELAY = 480;
const PHONE_TONE_START_DELAY = 5000;
const PHONE_TONE_GAP = 2500;




function preload() {
  antiTokenSprites = ANTI_TOKEN_STYLES.map(style => loadImage(
    `assets/images/COMM2754-2026-S2-A3w12-AntiToken${style.name[0].toUpperCase()}${style.name.slice(1)}-FinishedSet.png`,
    imageAsset => removeNearWhiteBackground(imageAsset)
  ));

  sandPortraitImage = loadImage(
    "assets/images/COMM2754-2026-S2-A3w12-SandPortraitSource-FinishedSet.png",
    imageAsset => preparePortraitTargetPixels(imageAsset)
  );

  heartbeatSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A2w08-HeartBeat-EditedSound.wav"
  );

  monitorBeepSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A2w08-HeartMonitor-EditedSound.wav"
  );

  phoneToneSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A2w08-PhoneTone-EditedSound.wav"
  );

  flatlineSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A3w12-HeartFlatline-EditedSound.wav"
  );
}

function removeNearWhiteBackground(imageAsset) {
  imageAsset.loadPixels();

  for (let i = 0; i < imageAsset.pixels.length; i += 4) {
    const isNearWhite =
      imageAsset.pixels[i] > 245 &&
      imageAsset.pixels[i + 1] > 245 &&
      imageAsset.pixels[i + 2] > 245;

    if (isNearWhite) imageAsset.pixels[i + 3] = 0;
  }

  imageAsset.updatePixels();
}

function preparePortraitTargetPixels(imageAsset) {
  imageAsset.loadPixels();

  let minimumX = imageAsset.width;
  let minimumY = imageAsset.height;
  let maximumX = 0;
  let maximumY = 0;

  for (let y = 0; y < imageAsset.height; y++) {
    for (let x = 0; x < imageAsset.width; x++) {
      const pixelIndex = 4 * (y * imageAsset.width + x);
      if (imageAsset.pixels[pixelIndex + 3] <= 20) continue;
      minimumX = min(minimumX, x);
      minimumY = min(minimumY, y);
      maximumX = max(maximumX, x);
      maximumY = max(maximumY, y);
    }
  }

  const portraitWidth = max(1, maximumX - minimumX);
  const portraitHeight = max(1, maximumY - minimumY);
  portraitAspectRatio = portraitWidth / portraitHeight;
  portraitTargetPixels = [];
  portraitLightPixels = [];
  portraitMidtonePixels = [];
  portraitDarkPixels = [];
  portraitDetailPixels = [];

  for (let y = minimumY; y <= maximumY; y += 2) {
    for (let x = minimumX; x <= maximumX; x += 2) {
      const pixelIndex = 4 * (y * imageAsset.width + x);
      const alpha = imageAsset.pixels[pixelIndex + 3];
      if (alpha <= 20) continue;

      const red = imageAsset.pixels[pixelIndex];
      const green = imageAsset.pixels[pixelIndex + 1];
      const blue = imageAsset.pixels[pixelIndex + 2];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const isDetail = isPortraitDetailPixel(imageAsset, x, y, luminance);

      const targetPixel = {
        x: (x - minimumX) / portraitWidth - 0.5,
        y: (y - minimumY) / portraitHeight - 0.5,
        tone: map(luminance, 0, 255, 70, 235),
        isDetail
      };

      portraitTargetPixels.push(targetPixel);

      if (luminance >= 200) portraitLightPixels.push(targetPixel);
      else if (luminance <= 70) portraitDarkPixels.push(targetPixel);
      else portraitMidtonePixels.push(targetPixel);

      if (isDetail) portraitDetailPixels.push(targetPixel);
    }
  }
}

function isPortraitDetailPixel(imageAsset, x, y, centerLuminance) {
  const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];

  for (const [offsetX, offsetY] of offsets) {
    const sampleX = constrain(x + offsetX, 0, imageAsset.width - 1);
    const sampleY = constrain(y + offsetY, 0, imageAsset.height - 1);
    const pixelIndex = 4 * (sampleY * imageAsset.width + sampleX);
    const alpha = imageAsset.pixels[pixelIndex + 3];

    if (alpha <= 20) return true;

    const luminance =
      imageAsset.pixels[pixelIndex] * 0.2126 +
      imageAsset.pixels[pixelIndex + 1] * 0.7152 +
      imageAsset.pixels[pixelIndex + 2] * 0.0722;

    if (abs(luminance - centerLuminance) >= 90) return true;
  }

  return false;
}

function setup() {
  const canvasPocket = document.getElementById("canvas-pocket");
  const pocketWidth = canvasPocket.clientWidth || 960;
  const pocketHeight = canvasPocket.clientHeight || 540;
  const mainCanvas = createCanvas(pocketWidth, pocketHeight);
  mainCanvas.parent(canvasPocket);
  angleMode(DEGREES);

  createDrawingLayers();
  createStartingBalls();
  spawnRandomFood();
  setupHeartbeatAudio();
  document.getElementById("canvas-sound-button").addEventListener(
    "click",
    toggleCanvasSound
  );
  document.addEventListener("pointerdown", unlockDefaultCanvasSound, { passive: true });
  document.addEventListener("keydown", unlockDefaultCanvasSound);
}

function draw() {
  drawBackground();
  updateSensorLayer();
  updateFoodRespawn();
  updateFood();
  updateAndDrawPurpleSand();
  syncFlatlineSound();
  syncHeartbeatSound();
  updatePhoneTone();
  updateBalls();
  drawFood();
  drawSandBrushCursor();
  ignoreNextDeltaTime = false;
}

function windowResized() {
  const oldTrails = {
    white: permanentTrailLayer,
    orbit: orbitTrailLayer,
    anti: antiTrailLayer,
    barrier: barrierLayer
  };

  if (!resizeCanvasToDisplayMode()) return;
  recreateDrawingLayers(oldTrails);
  keepFoodInsideCanvas();
}

// Ball functions

function createStartingBalls() {
  for (let i = 0; i < STARTING_BALL_COUNT; i++) {
    balls.push(new Ball(
      random(width * 0.2, width * 0.3),
      random(height * 0.43, height * 0.57),
      random(360),
      "white"
    ));
  }

  for (let i = 0; i < STARTING_ANTI_BALL_COUNT; i++) {
    balls.push(new Ball(
      random(width * 0.7, width * 0.8),
      random(height * 0.43, height * 0.57),
      random(360),
      "anti"
    ));
  }
}

function updateBalls() {
  for (const ball of balls) {
    ball.update();
    updateAntiTokenTrail(ball);
    depositBallTrail(ball);
  }

  drawAntiTokenTrails();

  for (const ball of balls) {
    drawBall(ball);
  }
}

function updateAntiTokenTrail(ball) {
  if (ball.team !== "anti") return;

  ball.antiTrailPoints.push({ x: ball.x, y: ball.y });

  if (ball.antiTrailPoints.length > ANTI_TRAIL_LENGTH) {
    ball.antiTrailPoints.shift();
  }
}

function drawAntiTokenTrails() {
  for (const ball of balls) {
    if (ball.team !== "anti") continue;
    drawAntiTokenTrail(ball);
  }
}

function drawAntiTokenTrail(ball) {
  const points = ball.antiTrailPoints;
  const style = ANTI_TOKEN_STYLES[ball.antiVariant];

  noFill();

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];

    // Do not draw a line across the canvas when a token wraps at an edge.
    if (dist(previous.x, previous.y, current.x, current.y) > 8) continue;

    const progress = i / (points.length - 1);
    stroke(...style.trail, 35 + progress * 180);
    strokeWeight(1.1 + progress * 1.65);
    line(previous.x, previous.y, current.x, current.y);
  }
}

// Purple orbit sand and brushed portrait formations

function depositOrbitSand(ball) {
  if (
    !food?.isAvailable ||
    food.orbitSandGrains.length >= MAXIMUM_ORBIT_SAND_GRAINS ||
    random(1) >= 0.2
  ) {
    return;
  }

  food.orbitSandGrains.push({
    x: ball.x + random(-0.8, 0.8),
    y: ball.y + random(-0.8, 0.8),
    size: random(1.1, 2.1),
    shade: random(1)
  });
}

function updateAndDrawPurpleSand() {
  for (const formation of portraitSandFormations) {
    if (!formation.activated) continue;
    updatePortraitSandFormation(formation);
    drawPurpleSandGrains(formation.grains);
  }
}

function drawPurpleSandGrains(grains) {
  noStroke();

  // Yellow facial planes go down first; darker values of the same yellow sit
  // above them so the portrait keeps its tonal detail.
  drawPortraitGrainPass(grains, "light");
  drawPortraitGrainPass(grains, "shadow");
  drawPortraitGrainPass(grains, "detail");
}

function drawPortraitGrainPass(grains, pass) {
  for (const grain of grains) {
    if (!grain.activated) continue;
    const isDarkDetail = (grain.targetTone ?? 90) < 130;
    const grainPass = grain.isPortraitDetail
      ? "detail"
      : isDarkDetail
        ? "shadow"
        : "light";
    if (grainPass !== pass) continue;

    const highlight = grain.shade * 30;
    const purpleRed = 76 + highlight;
    const purpleGreen = 24 + highlight * 0.45;
    const purpleBlue = 126 + highlight;
    const tone = grain.targetTone ?? 90;
    const colorProgress = grain.colorProgress ?? 0;
    const targetLightness = map(tone, 70, 235, 0, 1, true);
    const yellowShade = lerp(0.38, 1, targetLightness);
    const targetRed = 247 * yellowShade;
    const targetGreen = 205 * yellowShade;
    const targetBlue = 38 * yellowShade;

    fill(
      lerp(purpleRed, targetRed, colorProgress),
      lerp(purpleGreen, targetGreen, colorProgress),
      lerp(purpleBlue, targetBlue, colorProgress),
      225
    );
    circle(
      grain.x,
      grain.y,
      grain.size * lerp(
        1,
        grain.isPortraitDetail ? 2.05 : isDarkDetail ? 1.8 : 1.6,
        colorProgress
      )
    );
  }
}

function createPortraitSandFormation(foodObject) {
  const grains = foodObject.orbitSandGrains;
  if (grains.length === 0) return;

  const targets = createPortraitTargets(grains.length, foodObject);

  for (const grain of grains) {
    grain.activated = false;
  }

  portraitSandFormations.push({
    grains,
    targets,
    nextTargetIndex: 0,
    lastBrushAt: -Infinity,
    activated: false,
    centerX: foodObject.x,
    centerY: foodObject.y,
    interactionRadius: foodObject.colonyRadius * 1.2
  });
  foodObject.orbitSandGrains = [];
}

function createPortraitTargets(count, foodObject) {
  const targets = [];
  const portraitHeight = constrain(min(width, height) * 0.72, 115, 155);
  const portraitWidth = portraitHeight * portraitAspectRatio;
  const detailCount = floor(count * 0.44);
  const lightCount = floor(count * 0.32);
  const darkCount = floor(count * 0.19);

  for (let i = 0; i < count; i++) {
    const source = i < detailCount
      ? random(portraitDetailPixels)
      : i < detailCount + lightCount
        ? random(portraitLightPixels)
        : i < detailCount + lightCount + darkCount
          ? random(portraitDarkPixels)
          : random(portraitMidtonePixels);
    if (!source) break;

    targets.push({
      x: foodObject.x + source.x * portraitWidth + random(-0.25, 0.25),
      y: foodObject.y + source.y * portraitHeight + random(-0.25, 0.25),
      tone: source.tone,
      isDetail: source.isDetail
    });
  }

  return targets.sort((first, second) =>
    first.y - second.y || first.x - second.x
  );
}

function updatePortraitSandFormation(formation) {
  if (!formation.activated) return;

  for (const grain of formation.grains) {
    if (!grain.activated) continue;

    const elapsed = millis() - grain.startedAt;
    if (elapsed < 0) continue;

    const progress = constrain(
      elapsed / grain.duration,
      0,
      1
    );
    const eased = 1 - pow(1 - progress, 3);
    const inverse = 1 - eased;
    grain.colorProgress = eased;

    grain.x =
      inverse * inverse * grain.startX +
      2 * inverse * eased * grain.controlX +
      eased * eased * grain.targetX;
    grain.y =
      inverse * inverse * grain.startY +
      2 * inverse * eased * grain.controlY +
      eased * eased * grain.targetY;

    if (progress < 1) {
      const nudge = sin(elapsed * 0.22 + grain.targetX) * (1 - progress) * 0.7;
      grain.x += nudge;
      grain.y -= nudge * 0.45;
    }
  }
}

function mouseMoved() {
  activatePortraitSandUnderCursor();
}

function mouseDragged() {
  activatePortraitSandUnderCursor();
}

function activatePortraitSandUnderCursor() {
  if (
    mouseX < 0 || mouseX >= width ||
    mouseY < 0 || mouseY >= height
  ) {
    return;
  }

  const trailPoint = findOrbitTrailPointUnderBrush(mouseX, mouseY);
  if (!trailPoint) return;

  const candidates = portraitSandFormations
    .filter(formation =>
      formation.nextTargetIndex < formation.targets.length &&
      dist(trailPoint.x, trailPoint.y, formation.centerX, formation.centerY) <=
        formation.interactionRadius
    )
    .sort((first, second) =>
      dist(trailPoint.x, trailPoint.y, first.centerX, first.centerY) -
      dist(trailPoint.x, trailPoint.y, second.centerX, second.centerY)
    );

  if (candidates.length === 0) return;
  brushPortraitSandFormation(candidates[0], trailPoint.x, trailPoint.y);
}

function findOrbitTrailPointUnderBrush(x, y) {
  const sampleRadius = ceil(getSandBrushRadius());
  let closestPoint = null;
  let closestDistanceSquared = Infinity;
  orbitTrailLayer.loadPixels();

  for (let offsetY = -sampleRadius; offsetY <= sampleRadius; offsetY += 2) {
    for (let offsetX = -sampleRadius; offsetX <= sampleRadius; offsetX += 2) {
      const distanceSquared = offsetX * offsetX + offsetY * offsetY;
      if (
        distanceSquared > sampleRadius * sampleRadius ||
        distanceSquared >= closestDistanceSquared
      ) {
        continue;
      }

      const sampleX = constrain(floor(x + offsetX), 0, width - 1);
      const sampleY = constrain(floor(y + offsetY), 0, height - 1);
      const pixelIndex = 4 * (sampleY * orbitTrailLayer.width + sampleX);

      if (orbitTrailLayer.pixels[pixelIndex + 3] <= 8) continue;

      closestDistanceSquared = distanceSquared;
      closestPoint = { x: sampleX, y: sampleY };
    }
  }

  return closestPoint;
}

function brushPortraitSandFormation(formation, brushX, brushY) {
  const brushTime = millis();
  if (brushTime - formation.lastBrushAt < SAND_BRUSH_COOLDOWN) return;

  const nearbyGrains = formation.grains
    .filter(grain =>
      !grain.activated &&
      dist(grain.x, grain.y, brushX, brushY) <= getSandBrushRadius()
    )
    .sort((first, second) =>
      dist(first.x, first.y, brushX, brushY) -
      dist(second.x, second.y, brushX, brushY)
    )
    .slice(0, SAND_BRUSH_GRAINS_PER_STROKE);

  if (nearbyGrains.length === 0) return;

  formation.activated = true;
  formation.lastBrushAt = brushTime;

  for (let i = 0; i < nearbyGrains.length; i++) {
    const grain = nearbyGrains[i];
    const target = formation.targets[formation.nextTargetIndex++];
    if (!target) break;

    grain.activated = true;
    grain.startX = grain.x;
    grain.startY = grain.y;
    grain.targetX = target.x;
    grain.targetY = target.y;
    grain.targetTone = target.tone;
    grain.isPortraitDetail = target.isDetail;
    grain.colorProgress = 0;
    grain.controlX = (grain.x + target.x) / 2 + random(-24, 24);
    grain.controlY = (grain.y + target.y) / 2 + random(-24, 24);
    grain.startedAt = brushTime + i * 18;
    grain.duration = random(2700, 4400);
  }

  eraseLayerArea(
    orbitTrailLayer,
    brushX,
    brushY,
    SAND_BRUSH_ERASER_RADIUS * 2
  );
}

function getSandBrushRadius() {
  const heartVisualDiameter = (food?.radius ?? 8) * 2.35;
  return heartVisualDiameter * SAND_BRUSH_HEART_SCALE / 2;
}

function drawSandBrushCursor() {
  const hasBrushableFormation = portraitSandFormations.some(formation =>
    formation.nextTargetIndex < formation.targets.length &&
    dist(mouseX, mouseY, formation.centerX, formation.centerY) <=
      formation.interactionRadius
  );

  if (
    !hasBrushableFormation ||
    mouseX < 0 || mouseX >= width ||
    mouseY < 0 || mouseY >= height
  ) {
    return;
  }

  noFill();
  stroke(92, 37, 142, 105);
  strokeWeight(1);
  circle(mouseX, mouseY, getSandBrushRadius() * 2);
}

function eraseLayerArea(layer, x, y, diameter) {
  layer.erase();
  layer.noStroke();
  layer.fill(255);
  layer.circle(x, y, diameter);
  layer.noErase();
}

function drawBall(ball) {
  if (ball.team === "anti") {
    drawAntiToken(ball);
    return;
  }

  const ballColor = getBallColor(ball);
  const ballSize = getBallSize(ball);

  noStroke();
  fill(...ballColor);
  circle(ball.x, ball.y, ballSize);
}

function drawAntiToken(ball) {
  const tokenSprite = antiTokenSprites[ball.antiVariant];
  if (!tokenSprite) return;

  const targetVisualSize = food?.radius
    ? food.radius * 2.35
    : 19;
  const imageScale = targetVisualSize / max(
    tokenSprite.width,
    tokenSprite.height
  );
  const drawWidth = tokenSprite.width * imageScale;
  const drawHeight = tokenSprite.height * imageScale;

  push();
  translate(ball.x, ball.y);
  rotate(ball.direction + 90);
  imageMode(CENTER);
  image(
    tokenSprite,
    0,
    0,
    drawWidth,
    drawHeight
  );
  pop();
}

function getBallColor(ball) {
  if (ball.team === "anti") {
    if (ball.hasReachedFood) return [250, 35, 150];
    if (ball.wasPulledByWave) return [210, 70, 205];
    return [150, 35, 130];
  }

  if (ball.hasReachedFood) {
    return [166, 105, 214];
  }

  if (ball.isDispersing) {
    return [105, 55, 174];
  }

  if (ball.wasPulledByWave) {
    return [180, 220, 255];
  }

  return [255, 255, 255];
}

function getBallSize(ball) {
  if (ball.hasReachedFood) return 2;
  if (ball.isDispersing) return 1.5;

  return ball.radius * 2;
}



// Trail functions

function createDrawingLayers() {
  permanentTrailLayer = createPermanentTrailLayer();
  orbitTrailLayer = createPermanentTrailLayer();
  antiTrailLayer = createPermanentTrailLayer();
  barrierLayer = createPermanentTrailLayer();
  sensorLayer = createSensorLayer();
  antiSensorLayer = createSensorLayer();
}

function createPermanentTrailLayer() {
  const layer = createGraphics(width, height);

  layer.pixelDensity(1);
  layer.clear();

  return layer;
}

function createSensorLayer() {
  const layer = createGraphics(width, height);

  layer.pixelDensity(1);
  layer.background(0);

  return layer;
}

function drawBackground() {
  background(0);
  image(permanentTrailLayer, 0, 0);
  image(orbitTrailLayer, 0, 0);
  image(antiTrailLayer, 0, 0);
  image(barrierLayer, 0, 0);
}

function updateSensorLayer() {
  fadeSensorLayer(sensorLayer);
  fadeSensorLayer(antiSensorLayer);
  sensorLayer.loadPixels();
  antiSensorLayer.loadPixels();
  barrierLayer.loadPixels();
}

function fadeSensorLayer(layer) {
  layer.noStroke();
  layer.fill(0, 7);

  layer.rect(
    0,
    0,
    layer.width,
    layer.height
  );
}

function depositBallTrail(ball) {
  if (ball.team === "white" && ball.hasReachedFood) {
    depositOrbitSand(ball);
  }
  depositPermanentTrail(ball);
  depositChemicalTrail(ball);
  depositWhiteBarrier(ball);
}

function depositPermanentTrail(ball) {
  if (ball.team === "anti") return;

  const trailColor = getTrailColor(ball);
  const trailSize = getTrailSize(ball);

  const layer = ball.hasReachedFood
    ? orbitTrailLayer
    : permanentTrailLayer;
  layer.noStroke();
  layer.fill(...trailColor);

  layer.circle(
    ball.x,
    ball.y,
    trailSize
  );
}

function getTrailSize(ball) {
  if (ball.team === "anti") {
    return ball.hasReachedFood ? 3 : 2.25;
  }

  return getBallSize(ball);
}

function getTrailColor(ball) {
  if (ball.team === "anti") {
    const style = ANTI_TOKEN_STYLES[ball.antiVariant];
    const opacity = ball.hasReachedFood ? 115 : 85;
    return [...style.trail, opacity];
  }

  if (ball.hasReachedFood) {
    return [166, 105, 214, 100];
  }

  if (ball.isDispersing) {
    return [105, 55, 174, 100];
  }

  return [255, 255, 255, 100];
}

function depositChemicalTrail(ball) {
  const layer = ball.team === "anti" ? antiSensorLayer : sensorLayer;
  layer.noStroke();

  drawChemicalCircle(layer, ball, 22, 8);
  drawChemicalCircle(layer, ball, 14, 15);
  drawChemicalCircle(layer, ball, 7, 28);
}

function drawChemicalCircle(layer, ball, size, opacity) {
  layer.fill(255, opacity);
  layer.circle(ball.x, ball.y, size);
}

function depositWhiteBarrier(ball) {
  if (ball.team !== "white" || !ball.isDispersing) return;

  barrierLayer.noStroke();
  barrierLayer.fill(154, 76, 220, 115);
  barrierLayer.circle(ball.x, ball.y, 1.1);
  eraseAntiTrailUnderBarrier(ball);
}

function eraseAntiTrailUnderBarrier(ball) {
  antiTrailLayer.erase();
  antiTrailLayer.noStroke();
  antiTrailLayer.circle(ball.x, ball.y, 9);
  antiTrailLayer.noErase();

  antiSensorLayer.noStroke();
  antiSensorLayer.fill(0);
  antiSensorLayer.circle(ball.x, ball.y, 9);

  eraseAntiTokenTrailPoints(ball.x, ball.y, 4.5);
}

function eraseAntiTokenTrailPoints(x, y, radius) {
  for (const token of balls) {
    if (token.team !== "anti") continue;

    token.antiTrailPoints = token.antiTrailPoints.filter(point =>
      dist(point.x, point.y, x, y) > radius
    );
  }
}

function erasePurpleSandGrains(x, y, radius) {
  if (food?.orbitSandGrains) {
    food.orbitSandGrains = food.orbitSandGrains.filter(grain =>
      dist(grain.x, grain.y, x, y) > radius
    );
  }

  for (const formation of portraitSandFormations) {
    formation.grains = formation.grains.filter(grain =>
      dist(grain.x, grain.y, x, y) > radius
    );
  }
}

function recreateDrawingLayers(oldTrails) {
  permanentTrailLayer =
    createPermanentTrailLayer();

  permanentTrailLayer.image(
    oldTrails.white,
    0,
    0
  );

  orbitTrailLayer = createPermanentTrailLayer();
  orbitTrailLayer.image(oldTrails.orbit, 0, 0);

  antiTrailLayer = createPermanentTrailLayer();
  antiTrailLayer.image(oldTrails.anti, 0, 0);

  barrierLayer = createPermanentTrailLayer();
  barrierLayer.image(oldTrails.barrier, 0, 0);

  sensorLayer = createSensorLayer();
  antiSensorLayer = createSensorLayer();
}



// Food functions

function updateFood() {
  if (food?.isAvailable) {
    food.update();
  }
}

function drawFood() {
  if (!food?.isAvailable) return;

  if (food.isErasing) {
    drawFoodEraser();
    return;
  }

  drawFoodWeb();
  drawFoodBall();
  drawFoodWave();
}

function drawFoodBall() {
  const foodColor = getFoodColor();
  const foodOpacity = food.getUntouchedOpacity();
  const pulseScale = 1 + getFoodHeartbeat() * 0.18;
  const heartSize = food.radius * 2.35 * pulseScale;

  noStroke();
  fill(...foodColor, foodOpacity);

  push();
  translate(food.x, food.y);
  scale(heartSize / 20);

  // A simple, familiar emoji-style heart silhouette.
  beginShape();
  vertex(0, 8);
  bezierVertex(-2, 6, -10, 1, -10, -5);
  bezierVertex(-10, -11, -2, -13, 0, -7);
  bezierVertex(2, -13, 10, -11, 10, -5);
  bezierVertex(10, 1, 2, 6, 0, 8);
  endShape(CLOSE);
  pop();
}

function getFoodColor() {
  return [220, 35, 45];
}

function drawFoodWave() {
  if (food.isActive || food.isWaveWaiting) return;

  const heartbeat = getFoodHeartbeat();
  const pulseRadius = food.waveRadius + heartbeat * 5;
  const fade = food.getUntouchedOpacity() / 255;

  noFill();
  stroke(
    130,
    190,
    255,
    (50 + heartbeat * 75) * fade
  );
  strokeWeight(1 + heartbeat * 1.4);

  circle(
    food.x,
    food.y,
    pulseRadius * 2
  );
}

function eraseTrailsAroundFood(foodObject) {
  const eraserRadius = foodObject.getEraserRadius();
  const diameter = eraserRadius * 2;

  eraseLayerCircle(permanentTrailLayer, foodObject, diameter);
  eraseLayerCircle(orbitTrailLayer, foodObject, diameter);
  eraseLayerCircle(antiTrailLayer, foodObject, diameter);
  eraseLayerCircle(barrierLayer, foodObject, diameter);
  eraseSensorCircle(sensorLayer, foodObject, diameter);
  eraseSensorCircle(antiSensorLayer, foodObject, diameter);
  eraseAntiTokenTrailPoints(foodObject.x, foodObject.y, eraserRadius);
  erasePurpleSandGrains(foodObject.x, foodObject.y, eraserRadius);
}

function eraseLayerCircle(layer, foodObject, diameter) {
  layer.erase();
  layer.noStroke();
  layer.circle(foodObject.x, foodObject.y, diameter);
  layer.noErase();
}

function eraseSensorCircle(layer, foodObject, diameter) {
  layer.noStroke();
  layer.fill(0);
  layer.circle(foodObject.x, foodObject.y, diameter);
}

function drawFoodEraser() {
  const radius = food.getEraserRadius();
  const pulse = 2 + getFoodHeartbeat() * 4;

  if (food.isBlackHole) {
    noStroke();
    fill(0, 235);
    circle(food.x, food.y, (radius + pulse) * 2);
    noFill();
    stroke(220, 30, 150, 210);
    strokeWeight(2.5);
    circle(food.x, food.y, (radius + pulse + 5) * 2);
    stroke(110, 30, 160, 145);
    strokeWeight(1);
    circle(food.x, food.y, (radius + pulse + 12) * 2);
    return;
  }

  fill(0);
  stroke(120, 20, 35, 180);
  strokeWeight(1.5);
  circle(food.x, food.y, (radius + pulse) * 2);
}

function getFoodHeartbeat() {
  if (heartbeatSound?.isPlaying()) {
    const level = heartbeatAmplitude.getLevel();
    return map(level, 0.015, 0.5, 0, 1, true);
  }

  if (heartbeatAudioEnabled && canvasSoundEnabled) return 0;

  const phase = (frameCount % 72) / 72;
  const firstBeat = heartbeatPeak(phase, 0.12, 0.045);
  const secondBeat = heartbeatPeak(phase, 0.28, 0.055);

  return constrain(firstBeat + secondBeat * 0.72, 0, 1);
}

function setupHeartbeatAudio() {
  heartbeatAmplitude = new p5.Amplitude(0.65);
  heartbeatAmplitude.setInput(heartbeatSound);
}

function startHeartbeatAudio() {
  if (heartbeatAudioEnabled) return;

  heartbeatAudioEnabled = true;
  userStartAudio();
  heartbeatSound.setVolume(0.6);
  monitorBeepSound.setVolume(0.18);
  heartbeatSound.playMode("restart");
  monitorBeepSound.playMode("restart");
  phoneToneSound.setVolume(0.3);
  flatlineSound.setVolume(0.4);
  syncHeartbeatSound();
}

function unlockDefaultCanvasSound() {
  if (!canvasSoundEnabled || heartbeatAudioEnabled) return;
  startHeartbeatAudio();
}

function syncFlatlineSound() {
  if (!flatlineSound?.isLoaded()) return;

  const blackHoleIsActive =
    food?.isAvailable &&
    food.isBlackHole &&
    food.isErasing;

  if (!blackHoleIsActive) {
    flatlinePlayedForCurrentBlackHole = false;
    if (flatlineSound.isPlaying()) flatlineSound.stop();
    return;
  }

  if (!canvasSoundEnabled || !heartbeatAudioEnabled) {
    if (flatlineSound.isPlaying()) flatlineSound.stop();
    return;
  }

  if (!flatlinePlayedForCurrentBlackHole) {
    flatlinePlayedForCurrentBlackHole = true;
    flatlineSound.play(0, 1, 0.4);
  }
}

function syncHeartbeatSound() {
  if (!canvasSoundEnabled) return;
  if (!heartbeatAudioEnabled) return;
  if (!heartbeatSound.isLoaded() || !monitorBeepSound.isLoaded()) return;

  const shouldPlay = food?.isAvailable && !food.isErasing;

  if (!shouldPlay) {
    if (heartbeatSound.isPlaying()) heartbeatSound.stop();
    if (monitorBeepSound.isPlaying()) monitorBeepSound.stop();
    nextHeartbeatTime = 0;
    return;
  }

  if (
    heartbeatSound.isPlaying() ||
    monitorBeepSound.isPlaying() ||
    millis() < nextHeartbeatTime
  ) return;

  const synchronizedStartDelay = 0.05;
  heartbeatSound.play(synchronizedStartDelay, 1, 0.6);
  monitorBeepSound.play(synchronizedStartDelay, 1, 0.18);
  nextHeartbeatTime = millis() + getHeartbeatSpacing();
}

function getHeartbeatSpacing() {
  if (food.isActive) return 900;

  const fadeProgress = constrain(
    food.untouchedAge / food.untouchedLifetime,
    0,
    1
  );

  return lerp(900, 3000, fadeProgress);
}

function updatePhoneTone() {
  if (!canvasSoundEnabled) return;
  if (!heartbeatAudioEnabled || !phoneToneSound.isLoaded()) return;

  const canRing =
    food?.isAvailable &&
    !food.isErasing &&
    food.reachedBallCount === 0 &&
    food.antiReachedBallCount === 0;

  if (!canRing) {
    if (phoneToneSound.isPlaying()) phoneToneSound.stop();
    return;
  }

  if (millis() < food.nextPhoneToneTime) return;
  if (phoneToneSound.isPlaying()) return;

  phoneToneSound.play(0, 1, 0.3);
  food.nextPhoneToneTime =
    millis() + phoneToneSound.duration() * 1000 + PHONE_TONE_GAP;
}

function toggleCanvasSound() {
  canvasSoundEnabled = !canvasSoundEnabled;
  const soundButton = document.getElementById("canvas-sound-button");

  soundButton.textContent = canvasSoundEnabled ? "Sound: On" : "Sound: Off";

  if (canvasSoundEnabled) startHeartbeatAudio();
  else stopCanvasSounds();
}

function resizeCanvasToDisplayMode() {
  const canvasPocket = document.getElementById("canvas-pocket");
  const displayWidth = canvasPocket.clientWidth;
  const displayHeight = canvasPocket.clientHeight;

  if (displayWidth <= 0 || displayHeight <= 0) return false;

  resizeCanvas(displayWidth, displayHeight);
  return true;
}

function stopCanvasSounds() {
  if (heartbeatSound?.isPlaying()) heartbeatSound.stop();
  if (monitorBeepSound?.isPlaying()) monitorBeepSound.stop();
  if (phoneToneSound?.isPlaying()) phoneToneSound.stop();
  if (flatlineSound?.isPlaying()) flatlineSound.stop();
}

window.addEventListener("amigos-stop-non-glitch-audio", function () {
  canvasSoundEnabled = false;
  heartbeatAudioEnabled = false;
  stopCanvasSounds();
  const soundButton = document.getElementById("canvas-sound-button");
  if (soundButton) soundButton.textContent = "Sound: Off";
});

function getSimulationDeltaTime() {
  return ignoreNextDeltaTime ? 0 : deltaTime;
}

function heartbeatPeak(phase, center, width) {
  const distance = min(
    abs(phase - center),
    1 - abs(phase - center)
  );

  return exp(-sq(distance / width));
}

function drawFoodWeb() {
  const whiteColonyBalls = balls.filter(
    ball => ball.hasReachedFood && ball.team === "white"
  );
  const antiColonyBalls = balls.filter(
    ball => ball.hasReachedFood && ball.team === "anti"
  );

  drawTeamFoodWeb(whiteColonyBalls, false);
  drawTeamFoodWeb(antiColonyBalls, true);
}

function drawTeamFoodWeb(colonyBalls, isAntiTeam) {
  if (colonyBalls.length < 5) return;

  for (let i = 0; i < colonyBalls.length; i++) {
    connectBallToNeighbors(
      colonyBalls,
      i,
      isAntiTeam
    );
  }
}

function connectBallToNeighbors(colonyBalls, index, isAntiTeam) {
  const ball = colonyBalls[index];
  let connectionCount = 0;

  for (let i = index + 1; i < colonyBalls.length; i++) {
    if (connectionCount >= 3) break;

    if (drawConnection(ball, colonyBalls[i], isAntiTeam)) {
      connectionCount++;
    }
  }
}

function drawConnection(firstBall, secondBall, isAntiTeam) {
  const distance = dist(
    firstBall.x,
    firstBall.y,
    secondBall.x,
    secondBall.y
  );

  if (distance <= 5 || distance >= 28) {
    return false;
  }

  drawWebLine(firstBall, secondBall, distance, isAntiTeam);
  return true;
}

function drawWebLine(firstBall, secondBall, distance, isAntiTeam) {
  const opacity = map(distance, 5, 28, 90, 10);

  stroke(...(isAntiTeam
    ? [235, 38, 150, opacity]
    : [148, 88, 202, opacity]));
  strokeWeight(0.6);

  line(
    firstBall.x,
    firstBall.y,
    secondBall.x,
    secondBall.y
  );
}

function spawnRandomFood() {
  const margin = 70;
  foodSequenceCount++;

  food = new Food(
    randomCanvasPosition(width, margin),
    randomCanvasPosition(height, margin),
    foodSequenceCount
  );

  foodRespawnTimer = 0;
  resetBallFoodStates();
}

function randomCanvasPosition(canvasSize, margin) {
  const minimum = min(margin, canvasSize / 2);
  const maximum = max(
    canvasSize - margin,
    canvasSize / 2
  );

  return random(minimum, maximum);
}

function resetBallFoodStates() {
  for (const ball of balls) {
    ball.resetFoodState();
  }
}

function scheduleNextFood() {
  foodRespawnTimer = floor(
    random(
      MINIMUM_FOOD_RESPAWN_DELAY,
      MAXIMUM_FOOD_RESPAWN_DELAY
    )
  );
}

function updateFoodRespawn() {
  if (!food || food.isAvailable) return;

  foodRespawnTimer--;

  if (foodRespawnTimer <= 0) {
    spawnRandomFood();
  }
}

function keepFoodInsideCanvas() {
  if (!food) return;

  food.x = constrain(food.x, 20, width - 20);
  food.y = constrain(food.y, 20, height - 20);
}




function angleDifference(current, target) {
  return ((target - current + 540) % 360) - 180;
}
