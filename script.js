const beforeCanvas = document.querySelector("#beforeCanvas");
const afterCanvas = document.querySelector("#afterCanvas");
const beforeCtx = beforeCanvas.getContext("2d", { willReadFrequently: true });
const afterCtx = afterCanvas.getContext("2d", { willReadFrequently: true });

const imageInput = document.querySelector("#imageInput");
const processButton = document.querySelector("#processButton");
const downloadButton = document.querySelector("#downloadButton");
const compareSlider = document.querySelector("#compareSlider");
const splitLine = document.querySelector("#splitLine");
const strength = document.querySelector("#strength");
const strengthValue = document.querySelector("#strengthValue");
const statusPill = document.querySelector("#statusPill");
const modeTitle = document.querySelector("#modeTitle");
const modeSubtitle = document.querySelector("#modeSubtitle");
const faceLight = document.querySelector("#faceLight");
const detailBoost = document.querySelector("#detailBoost");
const segments = [...document.querySelectorAll(".segment")];

let sourceImage = null;
let currentMode = "restore";

const modeCopy = {
  restore: ["圖片修復", "去霧、提亮、銳化、降低老照片灰感"],
  retouch: ["AI P圖", "調整光線、膚色、色彩與整體質感"],
  color: ["黑白上色", "為低飽和或老照片補上自然色彩"],
};

function fitCanvasToFrame() {
  const frame = beforeCanvas.parentElement.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  [beforeCanvas, afterCanvas].forEach((canvas) => {
    canvas.width = Math.max(1, Math.floor(frame.width * ratio));
    canvas.height = Math.max(1, Math.floor(frame.height * ratio));
  });
  drawSource();
}

function createDemoImage() {
  const demo = document.createElement("canvas");
  demo.width = 1200;
  demo.height = 760;
  const ctx = demo.getContext("2d");

  ctx.fillStyle = "#d9c7a1";
  ctx.fillRect(0, 0, demo.width, demo.height);
  ctx.fillStyle = "#315b69";
  ctx.fillRect(0, 450, demo.width, 310);
  ctx.fillStyle = "#c06b47";
  ctx.fillRect(700, 150, 260, 420);
  ctx.fillStyle = "#f0d7b0";
  ctx.beginPath();
  ctx.arc(830, 155, 112, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#253038";
  ctx.beginPath();
  ctx.arc(792, 136, 12, 0, Math.PI * 2);
  ctx.arc(868, 136, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#9b4f4e";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(830, 178, 44, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.fillStyle = "#2e3e42";
  ctx.fillRect(190, 210, 360, 360);
  ctx.fillStyle = "#849a87";
  ctx.fillRect(230, 250, 280, 280);
  ctx.fillStyle = "#d99025";
  ctx.beginPath();
  ctx.moveTo(370, 300);
  ctx.lineTo(505, 530);
  ctx.lineTo(245, 530);
  ctx.closePath();
  ctx.fill();

  const imageData = ctx.getImageData(0, 0, demo.width, demo.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 54;
    data[i] = data[i] * 0.82 + 22 + noise;
    data[i + 1] = data[i + 1] * 0.82 + 18 + noise;
    data[i + 2] = data[i + 2] * 0.78 + 12 + noise;
  }
  ctx.putImageData(imageData, 0, 0);

  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    fitCanvasToFrame();
    processImage();
  };
  img.src = demo.toDataURL("image/png");
}

function drawImageContained(ctx, image) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#1b2428";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!image) return;

  const scale = Math.min(ctx.canvas.width / image.width, ctx.canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (ctx.canvas.width - width) / 2;
  const y = (ctx.canvas.height - height) / 2;
  ctx.drawImage(image, x, y, width, height);
}

function drawSource() {
  drawImageContained(beforeCtx, sourceImage);
  drawImageContained(afterCtx, sourceImage);
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function processPixels(imageData) {
  const data = imageData.data;
  const amount = Number(strength.value) / 100;
  const light = faceLight.checked ? 16 * amount : 0;
  const detail = detailBoost.checked ? 1 + amount * 0.2 : 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const avg = (r + g + b) / 3;

    if (currentMode === "restore") {
      r = avg + (r - avg) * detail + 22 * amount + light;
      g = avg + (g - avg) * detail + 20 * amount + light;
      b = avg + (b - avg) * detail + 16 * amount + light;
    }

    if (currentMode === "retouch") {
      r = r + 18 * amount + light;
      g = g + 10 * amount + light * 0.6;
      b = b + 4 * amount;
      const warmth = (r - b) * 0.05 * amount;
      r += warmth;
      b -= warmth;
    }

    if (currentMode === "color") {
      r = avg + (r - avg) * 0.45 + 38 * amount;
      g = avg + (g - avg) * 0.6 + 22 * amount;
      b = avg + (b - avg) * 0.5 + 8 * amount;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  return imageData;
}

function processImage() {
  if (!sourceImage) return;

  statusPill.textContent = "處理中";
  processButton.disabled = true;
  drawSource();

  window.setTimeout(() => {
    const imageData = afterCtx.getImageData(0, 0, afterCanvas.width, afterCanvas.height);
    afterCtx.putImageData(processPixels(imageData), 0, 0);
    statusPill.textContent = "完成";
    processButton.disabled = false;
    downloadButton.disabled = false;
  }, 280);
}

function updateCompare(value) {
  splitLine.style.left = `${value}%`;
  afterCanvas.style.clipPath = `inset(0 0 0 ${value}%)`;
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    fitCanvasToFrame();
    processImage();
  };
  img.src = URL.createObjectURL(file);
});

segments.forEach((segment) => {
  segment.addEventListener("click", () => {
    segments.forEach((item) => item.classList.remove("is-active"));
    segment.classList.add("is-active");
    currentMode = segment.dataset.mode;
    modeTitle.textContent = modeCopy[currentMode][0];
    modeSubtitle.textContent = modeCopy[currentMode][1];
    processImage();
  });
});

strength.addEventListener("input", () => {
  strengthValue.textContent = strength.value;
});

strength.addEventListener("change", processImage);
faceLight.addEventListener("change", processImage);
detailBoost.addEventListener("change", processImage);
processButton.addEventListener("click", processImage);

downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "ai-image-result.png";
  link.href = afterCanvas.toDataURL("image/png");
  link.click();
});

compareSlider.addEventListener("input", () => updateCompare(compareSlider.value));
window.addEventListener("resize", fitCanvasToFrame);

createDemoImage();
updateCompare(compareSlider.value);
