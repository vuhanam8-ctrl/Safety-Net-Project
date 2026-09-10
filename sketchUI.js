const scrollingAdSketch = (p) => {
  const message = "You saw the addiction. Did you see the person?";
  let x = 0;
  let messageWidth = 0;

  p.setup = () => {
    const container = document.querySelector(".banner");
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

new p5(scrollingAdSketch);

const backgroundSketch = (p) => {
  const colors = [[55, 0, 192], [157, 0, 255], [255, 0, 255], [255, 0, 128]];
  let elapsed = 0;

  p.setup = () => {
    const container = document.getElementById("bg-canvas-container");
    p.pixelDensity(1);
    p.frameRate(30);
    const canvas = p.createCanvas(400, Math.max(220, Math.floor(400 * innerHeight / innerWidth)));
    canvas.parent(container);
  };

  p.draw = () => {
    elapsed += Math.min(p.deltaTime * 0.001, 0.05);
    const position = (elapsed * 0.4) % colors.length;
    const first = colors[Math.floor(position)];
    const second = colors[(Math.floor(position) + 1) % colors.length];
    const amount = position - Math.floor(position);
    p.background(p.lerpColor(p.color(...first), p.color(...second), amount));
    p.noStroke();
    for (let i = 0; i < 6; i++) {
      const radius = 80 + 18 * Math.sin(elapsed + i);
      const color = colors[(i + 1) % colors.length];
      p.fill(color[0], color[1], color[2], 70);
      p.circle(p.width * ((i % 3) + 1) / 4, p.height * (i < 3 ? .28 : .72), radius);
    }
  };

  p.windowResized = () => p.resizeCanvas(400, Math.max(220, Math.floor(400 * innerHeight / innerWidth)));
};

new p5(backgroundSketch);
