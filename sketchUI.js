const scrollingAdSketch = (p) => {
  const message = "You saw the addiction. Did you see the person?";
  let x = 0;
  let messageWidth = 0;
  let flowers = [];
  let wasHovering = false;

  p.setup = () => {
    const container = document.querySelector(".banner");
    p.pixelDensity(1);
    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent(container);
    p.textFont("Georgia");
    p.textStyle(p.BOLD);
    p.textSize(24);
    p.textAlign(p.LEFT, p.CENTER);
    messageWidth = p.textWidth(message);
    x = p.width;
  };

  p.draw = () => {
    p.clear();
    const hovering = p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
    if (hovering && !wasHovering) {
      flowers.push(...Array.from({ length: 25 }, () => new BannerFlower(p, p.mouseX, p.mouseY)));
    }
    wasHovering = hovering;

    flowers = flowers.filter(flower => {
      flower.update();
      flower.draw();
      return flower.life > 0;
    });

    p.noStroke();
    p.fill(255);
    const repeatWidth = messageWidth + 400;
    for (let currentX = x; currentX < p.width; currentX += repeatWidth) {
      p.text(message, currentX, p.height / 2);
    }
    x -= 1.5;
    if (x <= -messageWidth) x += repeatWidth;
  };

  p.windowResized = () => {
    const container = document.querySelector(".banner");
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  };
};

const scrollingAdInstance = new p5(scrollingAdSketch);

const backgroundSketch = (p) => {
  const colors = [
    [105, 0, 125],
    [25, 0, 85],
    [50, 0, 105],
    [135, 0, 170]
  ];
  const lowResolutionWidth = 400;
  const orbs = [
    { x: 0.2, y: 0.25, radius: 110, phase: 0, speed: 0.15 },
    { x: 0.8, y: 0.2, radius: 120, phase: 1.5, speed: 0.12 },
    { x: 0.5, y: 0.5, radius: 100, phase: 3, speed: 0.18 },
    { x: 0.15, y: 0.75, radius: 115, phase: 4.2, speed: 0.14 },
    { x: 0.85, y: 0.8, radius: 125, phase: 2.1, speed: 0.16 },
    { x: 0.5, y: 0.85, radius: 95, phase: 5.5, speed: 0.11 }
  ];
  let elapsed = 0;
  let palette = [];
  let stars = [];
  let waveSeeds = [];

  p.setup = () => {
    const container = document.getElementById("bg-canvas-container");
    const canvasHeight = Math.floor(lowResolutionWidth * window.innerHeight / window.innerWidth);
    p.pixelDensity(1);
    p.frameRate(30);
    const canvas = p.createCanvas(lowResolutionWidth, canvasHeight);
    canvas.parent(container);
    palette = colors.map(color => p.color(...color));
    stars = Array.from({ length: 6 }, () => ({
      x: p.random(p.width),
      y: p.random(p.height),
      vx: p.random(-0.3, 0.3),
      vy: p.random(-0.2, 0.2)
    }));
    waveSeeds = [p.random(100), p.random(100)];
  };

  p.draw = () => {
    elapsed += Math.min(p.deltaTime * 0.001, 0.05);
    const position = (elapsed * 0.4) % palette.length;
    const firstIndex = Math.floor(position);
    const secondIndex = (firstIndex + 1) % palette.length;
    p.background(p.lerpColor(palette[firstIndex], palette[secondIndex], position - firstIndex));

    p.noStroke();
    orbs.forEach(orb => {
      const activePosition = (elapsed * orb.speed + orb.phase) % palette.length;
      const activeIndex = Math.floor(activePosition);
      const activeColor = p.lerpColor(
        palette[activeIndex],
        palette[(activeIndex + 1) % palette.length],
        activePosition - activeIndex
      );
      const radius = orb.radius + Math.sin(elapsed * 1.2 + orb.phase) * 14;
      for (let layer = 4; layer > 0; layer--) {
        const diameter = p.map(layer, 1, 4, radius, radius * 0.15);
        const alpha = p.map(layer, 1, 4, 35, 140);
        p.fill(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha);
        p.circle(p.width * orb.x, p.height * orb.y, diameter);
      }
    });

    p.fill(255, 100);
    for (let x = 0; x < p.width; x += 6) {
      for (let y = 0; y < p.height; y += 6) {
        const nearTopLeft = p.dist(x, y, 0, 0) < p.width * 0.35;
        const nearBottomRight = p.dist(x, y, p.width, p.height) < p.width * 0.35;
        if (nearTopLeft || nearBottomRight) p.rect(x, y, 1, 1);
      }
    }

    p.noFill();
    p.stroke(255, 160);
    p.strokeWeight(1);
    waveSeeds.forEach((seed, index) => {
      p.beginShape();
      const verticalOffset = index === 0 ? p.height * 0.22 : p.height * 0.78;
      for (let x = 0; x <= p.width; x += 3) {
        const y = verticalOffset + Math.sin(x * 0.03 + elapsed * 0.9 + seed) * 4
          + Math.cos(x * 0.02 - elapsed * 0.6) * 2;
        p.vertex(x, y);
      }
      p.endShape();
    });

    stars.forEach(star => {
      star.x = (star.x + star.vx + p.width) % p.width;
      star.y = (star.y + star.vy + p.height) % p.height;
      p.noStroke();
      p.fill(255);
      p.rect(star.x - 1, star.y, 3, 1);
      p.rect(star.x, star.y - 1, 1, 3);
    });
  };

  p.windowResized = () => {
    p.resizeCanvas(
      lowResolutionWidth,
      Math.floor(lowResolutionWidth * window.innerHeight / window.innerWidth)
    );
  };
};

class BannerFlower {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-3.5, 3.5);
    this.vy = p.random(-4.5, 0.5);
    this.rotation = p.random(p.TWO_PI);
    this.rotationSpeed = p.random(-0.04, 0.04);
    this.size = p.random(12, 20);
    this.life = 180;
    this.color = p.color(p.random(150, 255), p.random(50, 150), p.random(150, 255));
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.rotation += this.rotationSpeed;
    this.life--;
  }

  draw() {
    const p = this.p;
    const alpha = p.map(this.life, 0, 180, 0, 255);
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    const flowerColor = p.color(this.color);
    flowerColor.setAlpha(alpha);
    p.fill(flowerColor);
    p.noStroke();
    for (let petal = 0; petal < 6; petal++) {
      p.push();
      p.rotate((p.TWO_PI / 6) * petal);
      p.ellipse(this.size * 0.3, 0, this.size * 0.7, this.size * 0.4);
      p.pop();
    }
    p.fill(255, 220, 100, alpha);
    p.circle(0, 0, this.size * 0.3);
    p.pop();
  }
}

const backgroundInstance = new p5(backgroundSketch);

let ambientPermanentlyFrozen = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    scrollingAdInstance.noLoop();
    backgroundInstance.noLoop();
    return;
  }

  if (ambientPermanentlyFrozen) return;
  scrollingAdInstance.loop();
  backgroundInstance.loop();
});

window.freezeAmigosAmbient = function () {
  ambientPermanentlyFrozen = true;
  scrollingAdInstance.noLoop();
  backgroundInstance.noLoop();
};
