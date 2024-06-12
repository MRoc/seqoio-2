const millisUntilSplit = 200;
const maxLines = 1024;
const thetaInitial = 0.5;
const thetaFade = 0.8;
const lineWeightInitial = 5;
const lineWeightFade = 0.9;
const colorInitial = 0x29d4ffff;
const colorFade = 0.7;
const initialVelocity = 0.4;

const canvas = document.getElementsByClassName("tree-animation")[0];
const w = document.body.clientWidth;
const h = document.body.clientHeight;
canvas.width = w;
canvas.height = h;

const initialTime = new Date();
let lastSplitTime = initialTime;
let lastFrameTime = initialTime;
let theta = thetaInitial;
let lines = [];
let animated = initialLines(w, h);

function animate() {
  const now = new Date();

  const ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = "destination-over";
  ctx.clearRect(0, 0, w, h);

  const millis = now.getTime() - lastSplitTime.getTime();
  if (millis > millisUntilSplit) {
    lines = [...lines, ...animated];
    if (lines.length < maxLines) {
      animated = split(animated, theta);
      theta *= thetaFade;
    } else {
      animated = [];
    }
    lastSplitTime = new Date();
  }

  const delta = now.getTime() - lastFrameTime.getTime();
  const totalTime = now.getTime() - initialTime.getTime();
  grow(animated, delta, totalTime);
  draw(ctx, [...lines, ...animated]);

  lastFrameTime = now;

  if (animated.length > 0) {
    window.requestAnimationFrame(animate);
  }
}

function initialLines(w, h) {
  return [
    {
      p0: point(w / 2, h),
      p1: point(w / 2, h),
      v: point(0.0, -initialVelocity),
      c: colorInitial,
      l: lineWeightInitial,
    },
  ];
}

function rotate(vec, theta) {
  theta += (Math.random() - 0.5) * 0.2;

  const cs = Math.cos(theta);
  const sn = Math.sin(theta);
  const x = vec.x * cs - vec.y * sn;
  const y = vec.x * sn + vec.y * cs;
  return { x, y };
}

function point(x, y) {
  return { x, y };
}

function easing(time) {
  return 2 - Math.cos((time / 10000) * Math.PI);
}

function grow(lines, delta, time) {
  const ease = easing(time);
  for (const line of lines) {
    line.p1.x += line.v.x * (delta * ease);
    line.p1.y += line.v.y * (delta * ease);
  }
}

function split(lines, theta) {
  const animated = [];
  for (const old of lines) {
    const color = fadeColor(old.c, colorFade);
    const line = old.l * lineWeightFade;
    const v0 = rotate(old.v, -theta);
    const v1 = rotate(old.v, theta);
    animated.push({
      p0: { ...old.p1 },
      p1: { ...old.p1 },
      v: v0,
      c: color,
      l: line,
    });
    animated.push({
      p0: { ...old.p1 },
      p1: { ...old.p1 },
      v: v1,
      c: color,
      l: line,
    });
  }
  return animated;
}

function fadeColor(color, fade) {
  return (color & 0xffffff00) | ((color & 0x000000ff) * fade);
}

function draw(ctx, lines) {
  for (const line of lines) {
    ctx.beginPath();
    ctx.lineWidth = line.l;
    ctx.strokeStyle = "#" + line.c.toString(16);
    ctx.moveTo(line.p0.x, line.p0.y);
    ctx.lineTo(line.p1.x, line.p1.y);
    ctx.stroke();
  }
}

window.requestAnimationFrame(animate);
