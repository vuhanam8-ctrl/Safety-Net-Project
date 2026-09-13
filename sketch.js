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
    this.requiredAntiBallCount = 18;
    this.reproductionRate = 2;
    this.fullSince = null;
    this.reproductionDelay = 10000;
    this.antiFullSince = null;
    this.antiCollapseDelay = 4000;

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

    if (this.isReadyForAntiCollapse()) {
      this.consumeByAntiColony();
    }
  }

  isReadyToReproduce() {
    if (!this.isFull() || this.fullSince === null) return false;

    return millis() - this.fullSince >= this.reproductionDelay;
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

let permanentTrailLayer;
let antiTrailLayer;
let barrierLayer;
let sensorLayer;
let antiSensorLayer;
let foodRespawnTimer = 0;
let foodSequenceCount = 0;
let heartbeatSound;
let monitorBeepSound;
let phoneToneSound;
let heartbeatAmplitude;
let heartbeatAudioEnabled = false;
let nextHeartbeatTime = 0;
let canvasSoundEnabled = false;
let ignoreNextDeltaTime = false;

const STARTING_BALL_COUNT = 90;
const STARTING_ANTI_BALL_COUNT = 60;
const MINIMUM_FOOD_RESPAWN_DELAY = 180;
const MAXIMUM_FOOD_RESPAWN_DELAY = 480;
const PHONE_TONE_START_DELAY = 5000;
const PHONE_TONE_GAP = 2500;




function preload() {
  heartbeatSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A2w10-HeartBeat-EditedSound.wav"
  );

  monitorBeepSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A2w10-HeartMonitor-EditedSound.wav"
  );

  phoneToneSound = loadSound(
    "assets/audio/COMM2754-2026-S2-A2w10-PhoneTone-EditedSound.wav"
  );
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
}

function draw() {
  drawBackground();
  updateSensorLayer();
  updateFoodRespawn();
  updateFood();
  syncHeartbeatSound();
  updatePhoneTone();
  updateBalls();
  drawFood();
  ignoreNextDeltaTime = false;
}

function windowResized() {
  const oldTrails = {
    white: permanentTrailLayer,
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
    depositBallTrail(ball);
    drawBall(ball);
  }
}

function drawBall(ball) {
  const ballColor = getBallColor(ball);
  const ballSize = getBallSize(ball);

  noStroke();
  fill(...ballColor);
  circle(ball.x, ball.y, ballSize);
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
  depositPermanentTrail(ball);
  depositChemicalTrail(ball);
  depositWhiteBarrier(ball);
}

function depositPermanentTrail(ball) {
  const trailColor = getTrailColor(ball);
  const trailSize = getBallSize(ball);

  const layer = ball.team === "anti" ? antiTrailLayer : permanentTrailLayer;
  layer.noStroke();
  layer.fill(...trailColor);

  layer.circle(
    ball.x,
    ball.y,
    trailSize
  );
}

function getTrailColor(ball) {
  if (ball.team === "anti") {
    return ball.hasReachedFood
      ? [210, 35, 155, 90]
      : [105, 20, 100, 75];
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
  barrierLayer.fill(154, 76, 220, 150);
  barrierLayer.circle(ball.x, ball.y, 2.4);
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
}

function recreateDrawingLayers(oldTrails) {
  permanentTrailLayer =
    createPermanentTrailLayer();

  permanentTrailLayer.image(
    oldTrails.white,
    0,
    0
  );

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
  const diameter = foodObject.getEraserRadius() * 2;

  eraseLayerCircle(permanentTrailLayer, foodObject, diameter);
  eraseSensorCircle(sensorLayer, foodObject, diameter);

  if (foodObject.isBlackHole) {
    eraseLayerCircle(barrierLayer, foodObject, diameter);
  } else {
    eraseLayerCircle(antiTrailLayer, foodObject, diameter);
    eraseSensorCircle(antiSensorLayer, foodObject, diameter);
  }
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
  phoneToneSound.setVolume(0.3);
  syncHeartbeatSound();
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

  if (heartbeatSound.isPlaying() || millis() < nextHeartbeatTime) return;

  heartbeatSound.play(0, 1, 0.6);
  monitorBeepSound.play(0, 1, 0.18);
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
}

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
