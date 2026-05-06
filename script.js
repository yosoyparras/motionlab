const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");

const velocityInput = document.getElementById("velocity");
const angleInput = document.getElementById("angle");
const gravityInput = document.getElementById("gravity");
const planetInput = document.getElementById("planet");

const velocityValue = document.getElementById("velocityValue");
const angleValue = document.getElementById("angleValue");
const gravityValue = document.getElementById("gravityValue");

const rangeResult = document.getElementById("rangeResult");
const heightResult = document.getElementById("heightResult");
const timeResult = document.getElementById("timeResult");

let trajectory = [];
let graphData = [];
let animationId;
let running = false;

let currentVx = 0;
let currentVy = 0;
let currentGravity = 9.8;
let currentFlightTime = 0;
let currentMaxHeight = 0;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  drawScene();
}

window.addEventListener("resize", resizeCanvas);

function updateLabels() {
  velocityValue.textContent = velocityInput.value;
  angleValue.textContent = angleInput.value;
  gravityValue.textContent = Number(gravityInput.value).toFixed(1);
}

velocityInput.addEventListener("input", updateLabels);
angleInput.addEventListener("input", updateLabels);
gravityInput.addEventListener("input", updateLabels);

planetInput.addEventListener("change", () => {
  gravityInput.value = planetInput.value;
  updateLabels();
  resetSimulation();
});

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGround();

  if (trajectory.length > 1) {
    drawGlowTrajectory();
  }

  drawProjectile();
  drawGraph();
}

function drawGround() {
  const groundY = canvas.height - 60;

  ctx.save();

  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(50, groundY);
  ctx.lineTo(canvas.width - 50, groundY);
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px Inter, Segoe UI, sans-serif";
  ctx.fillText("Ground", 55, groundY + 22);

  ctx.restore();
}

function drawGlowTrajectory() {
  ctx.save();

  ctx.beginPath();

  trajectory.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
  ctx.lineWidth = 14;
  ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
  ctx.shadowBlur = 24;
  ctx.stroke();

  ctx.strokeStyle = "rgba(34, 197, 94, 0.32)";
  ctx.lineWidth = 8;
  ctx.shadowColor = "rgba(34, 197, 94, 0.7)";
  ctx.shadowBlur = 16;
  ctx.stroke();

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
  ctx.shadowBlur = 8;
  ctx.stroke();

  ctx.restore();
}

function drawProjectile() {
  const groundY = canvas.height - 60;

  let x = 60;
  let y = groundY;

  if (trajectory.length > 0) {
    const point = trajectory[trajectory.length - 1];
    x = point.x;
    y = point.y;
  }

  ctx.save();

  ctx.fillStyle = "#22c55e";
  ctx.shadowColor = "rgba(34, 197, 94, 0.9)";
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (trajectory.length > 0 && running) {
    drawVectors(x, y);
  }
}

function drawVectors(x, y) {
  const vectorScale = 1.4;

  const last = graphData[graphData.length - 1];
  if (!last) return;

  const vx = currentVx;
  const vyInstant = currentVy - currentGravity * last.time;

  const horizontalLength = vx * vectorScale;
  const verticalLength = -vyInstant * vectorScale;

  ctx.save();

  drawArrow(x, y, x + horizontalLength, y, "#38bdf8", "Vx");
  drawArrow(x, y, x, y + verticalLength, "#f97316", "Vy");

  ctx.restore();
}

function drawArrow(x1, y1, x2, y2, color, label) {
  const headLength = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.font = "12px Inter, Segoe UI, sans-serif";
  ctx.fillText(label, x2 + 8, y2 - 8);
}

function drawGraph() {
  const graphWidth = 260;
  const graphHeight = 170;
  const graphX = canvas.width - graphWidth - 40;
  const graphY = 30;
  const padding = 34;

  ctx.save();

  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.65)";
  ctx.lineWidth = 2;

  roundRect(graphX, graphY, graphWidth, graphHeight, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 14px Inter, Segoe UI, sans-serif";
  ctx.fillText("Height × Time", graphX + 18, graphY + 26);

  const plotX = graphX + padding;
  const plotY = graphY + padding + 12;
  const plotW = graphWidth - padding - 18;
  const plotH = graphHeight - padding - 28;

  ctx.strokeStyle = "rgba(148, 163, 184, 0.32)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px Inter, Segoe UI, sans-serif";
  ctx.fillText("t", plotX + plotW - 5, plotY + plotH + 15);
  ctx.fillText("h", plotX - 16, plotY + 8);

  if (graphData.length > 1 && currentFlightTime > 0 && currentMaxHeight > 0) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(plotX, plotY, plotW, plotH);
    ctx.clip();

    ctx.beginPath();

    graphData.forEach((point, index) => {
      const normalizedTime = point.time / currentFlightTime;
      const normalizedHeight = point.height / currentMaxHeight;

      const x = plotX + normalizedTime * plotW;
      const y = plotY + plotH - normalizedHeight * plotH;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function startSimulation() {
  cancelAnimationFrame(animationId);

  trajectory = [];
  graphData = [];
  running = true;

  const velocity = Number(velocityInput.value);
  const angle = Number(angleInput.value);
  const gravity = Number(gravityInput.value);

  const angleRad = angle * Math.PI / 180;

  currentVx = velocity * Math.cos(angleRad);
  currentVy = velocity * Math.sin(angleRad);
  currentGravity = gravity;

  currentFlightTime = (2 * currentVy) / gravity;
  const range = currentVx * currentFlightTime;
  currentMaxHeight = (currentVy * currentVy) / (2 * gravity);

  rangeResult.textContent = `${range.toFixed(1)} m`;
  heightResult.textContent = `${currentMaxHeight.toFixed(1)} m`;
  timeResult.textContent = `${currentFlightTime.toFixed(2)} s`;

  const groundY = canvas.height - 60;

  const scaleX = (canvas.width - 120) / range;
  const scaleY = (canvas.height - 150) / Math.max(currentMaxHeight, 1);
  const scale = Math.min(scaleX, scaleY);

  let time = 0;

  function animate() {
    if (!running) return;

    time += 0.035;

    const xMeters = currentVx * time;
    const yMeters = currentVy * time - 0.5 * gravity * time * time;

    const safeHeight = Math.max(yMeters, 0);

    const canvasX = 60 + xMeters * scale;
    const canvasY = groundY - safeHeight * scale;

    trajectory.push({
      x: canvasX,
      y: canvasY
    });

    graphData.push({
      time: Math.min(time, currentFlightTime),
      height: safeHeight
    });

    drawScene();

    if (time < currentFlightTime) {
      animationId = requestAnimationFrame(animate);
    } else {
      running = false;
      drawScene();
    }
  }

  animate();
}

function resetSimulation() {
  cancelAnimationFrame(animationId);

  trajectory = [];
  graphData = [];
  running = false;

  rangeResult.textContent = "0 m";
  heightResult.textContent = "0 m";
  timeResult.textContent = "0 s";

  drawScene();
}

updateLabels();
resizeCanvas();