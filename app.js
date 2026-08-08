const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const startBtn = document.getElementById('startBtn');
const scanBtn = document.getElementById('scanBtn');
const fileInput = document.getElementById('fileInput');
const resultText = document.getElementById('resultText');

let stream = null;
let imageReady = false;

startBtn.onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    video.hidden = false;
    preview.hidden = true;
    scanBtn.disabled = false;
    resultText.textContent = "พร้อมสแกนแล้ว — จัดต้นไม้ให้อยู่ในภาพแล้วกด “สแกนต้นไม้”";
  } catch (e) {
    resultText.textContent = "เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องใน Safari แล้วลองใหม่";
  }
};

scanBtn.onclick = () => {
  if (!stream) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const data = canvas.toDataURL('image/jpeg', 0.9);
  preview.src = data;
  preview.hidden = false;
  video.hidden = true;
  imageReady = true;
  analyzeImage(canvas);
};

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.hidden = false;
  video.hidden = true;
  imageReady = true;
  preview.onload = () => {
    canvas.width = preview.naturalWidth;
    canvas.height = preview.naturalHeight;
    canvas.getContext('2d').drawImage(preview, 0, 0);
    analyzeImage(canvas);
  };
};

function analyzeImage(source) {
  const ctx = source.getContext('2d');
  const {data} = ctx.getImageData(0, 0, source.width, source.height);
  let green = 0, yellow = 0, dark = 0, total = 0;

  // Simple visual prototype: estimates leaf color from the uploaded image.
  for (let i = 0; i < data.length; i += 16) {
    const r=data[i], g=data[i+1], b=data[i+2];
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    if (max < 70) dark++;
    if (g > r*1.12 && g > b*1.05) green++;
    if (r > 90 && g > 75 && b < g*0.75) yellow++;
    total++;
  }

  const greenPct = green/total;
  const yellowPct = yellow/total;

  if (greenPct > 0.20 && yellowPct < 0.18) {
    resultText.innerHTML = "🟢 <b>เบื้องต้น: ใบมีสีเขียวค่อนข้างดี</b><br>ยังไม่พบสัญญาณสีเหลืองเด่นชัดจากภาพนี้";
  } else if (yellowPct > 0.18) {
    resultText.innerHTML = "🟡 <b>ควรตรวจเพิ่มเติม</b><br>ภาพมีบริเวณสีเหลืองค่อนข้างมาก อาจเกี่ยวข้องกับการขาดธาตุอาหาร น้ำมาก/น้อยเกินไป หรือโรคบางชนิด";
  } else {
    resultText.innerHTML = "⚪ <b>ตรวจไม่ชัดเจน</b><br>ลองถ่ายให้เห็นใบชัดขึ้น แสงเพียงพอ และให้ใบกินพื้นที่ในภาพมากขึ้น";
  }
}
