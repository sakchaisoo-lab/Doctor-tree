const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const startBtn = document.getElementById('startBtn');
const scanBtn = document.getElementById('scanBtn');
const fileInput = document.getElementById('fileInput');
const resultText = document.getElementById('resultText');
const loadingText = document.getElementById('loadingText');

const API_KEY = "2b10MOd7s1S43LGK2v3iJRyTcO"; 
let stream = null;

// --- 1. ระบบเปิดกล้อง ---
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
    resultText.textContent = "เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องแล้วลองใหม่";
  }
};

// --- 2. ระบบสแกนภาพจากกล้อง ---
scanBtn.onclick = () => {
  if (!stream) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  const data = canvas.toDataURL('image/jpeg', 0.9);
  preview.src = data;
  preview.hidden = false;
  video.hidden = true;

  // แปลงภาพจาก Canvas เพื่อส่งไปให้ AI
  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], "tree_scan.jpg", { type: "image/jpeg" });
      analyzeTreeImage(file);
    }
  }, 'image/jpeg');
};

// --- 3. ระบบเลือกรูปภาพจากเครื่อง ---
fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.hidden = false;
  video.hidden = true;

  // ส่งไฟล์รูปภาพไปวิเคราะห์ที่ AI
  analyzeTreeImage(file);
};

// --- 4. ฟังก์ชันส่งรูปไปวิเคราะห์ที่ Pl@ntNet API ---
async function analyzeTreeImage(imageFile) {
  if (loadingText) loadingText.style.display = 'block';
  resultText.innerHTML = "⏳ กำลังวิเคราะห์ข้อมูลพืชด้วย AI...";

  const formData = new FormData();
  formData.append("images", imageFile);

  const endpoint = `https://my-api.plantnet.org/v2/identify/all?api-key=${API_KEY}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    displayResults(data);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    resultText.innerHTML = `<span style="color:red;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง</span>`;
  } finally {
    if (loadingText) loadingText.style.display = 'none';
  }
}

// --- 5. ฟังก์ชันแสดงผลลัพธ์บนหน้าเว็บ ---
function displayResults(data) {
  if (data.results && data.results.length > 0) {
    const topMatch = data.results[0];
    const speciesName = topMatch.species.scientificNameWithoutAuthor;
    const commonName = topMatch.species.commonNames[0] || "ไม่ทราบชื่อทั่วไป";
    const score = (topMatch.score * 100).toFixed(1);

    resultText.innerHTML = `
      <div style="text-align: left; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
        <h3 style="color: #166534; margin-top:0;">🌱 ผลการวิเคราะห์</h3>
        <p><strong>ชื่อวิทยาศาสตร์:</strong> <i>${speciesName}</i></p>
        <p><strong>ชื่อทั่วไป:</strong> ${commonName}</p>
        <p><strong>ความแม่นยำ:</strong> ${score}%</p>
      </div>
    `;
  } else {
    resultText.innerHTML = "❌ ไม่พบข้อมูลพืชในรูปภาพนี้ กรุณาถ่ายภาพใบหรือดอกให้ชัดเจนยิ่งขึ้น";
  }
}
