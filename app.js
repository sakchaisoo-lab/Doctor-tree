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
// ฟังก์ชันส่งภาพไปวิเคราะห์ด้วย AI
async function analyzeTreeImage(base64Image) {
    const loadingText = document.getElementById('loadingText');
    const resultDiv = document.getElementById('analysisResult');

    if (loadingText) loadingText.style.display = 'block';
    if (resultDiv) resultDiv.innerHTML = '';

    const apiKey = "ใส่_API_KEY_ของคุณที่นี่"; 
    
    try {
        const response = await fetch('https://plant.id/api/v3/health_assessment', {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: [base64Image],
                latitude: 16.4322,
                longitude: 102.8236
            })
        });

        const data = await response.json();
        if (loadingText) loadingText.style.display = 'none';

        if (data.result && data.result.disease && data.result.disease.suggestions.length > 0) {
            const diseaseName = data.result.disease.suggestions[0].name;
            const probability = (data.result.disease.suggestions[0].probability * 100).toFixed(1);
            
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div style="background-color: #eef2ff; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <h3 style="color: #1e3a8a; margin-bottom: 5px;">ผลการวิเคราะห์</h3>
                        <p><strong>ข้อสันนิษฐาน:</strong> ${diseaseName}</p>
                        <p><strong>ความเชื่อมั่น:</strong> ${probability}%</p>
                    </div>
                `;
            }
        } else {
            if (resultDiv) resultDiv.innerHTML = '<p>ไม่พบข้อมูลโรคพืชจากภาพนี้</p>';
        }
    } catch (error) {
        if (loadingText) loadingText.style.display = 'none';
        if (resultDiv) resultDiv.innerHTML = '<p style="color: red;">เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI</p>';
        console.error('Error:', error);
    }
}
// ฟังก์ชันสำหรับส่งรูปภาพไปวิเคราะห์ที่ Pl@ntNet API
async function analyzeTreeImage(imageFile) {
    // ระบบจะเก็บรหัสผ่านของคุณไว้ในตัวแปร apiKey ตรงนี้ครับ
    const apiKey = "2b10MOd7s1S43LGK2v3iJRyTcO"; 
    const project = "all"; 
    
    const formData = new FormData();
    formData.append("images", imageFile);

    const endpoint = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("ผลการวิเคราะห์:", data);
        
        displayResults(data);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }
}

// ฟังก์ชันสำหรับนำผลลัพธ์มาแสดงบนหน้า HTML
function displayResults(data) {
    const resultContainer = document.getElementById("result"); 
    if (!resultContainer) return;

    if (data.results && data.results.length > 0) {
        const topMatch = data.results[0];
        const speciesName = topMatch.species.scientificNameWithoutAuthor;
        const commonName = topMatch.species.commonNames[0] || "ไม่ทราบชื่อทั่วไป";
        const score = (topMatch.score * 100).toFixed(2);

        resultContainer.innerHTML = `
            <h3>ผลการสแกนต้นไม้</h3>
            <p><strong>ชื่อวิทยาศาสตร์:</strong> ${speciesName}</p>
            <p><strong>ชื่อทั่วไป:</strong> ${commonName}</p>
            <p><strong>ความแม่นยำ:</strong> ${score}%</p>
        `;
    } else {
        resultContainer.innerHTML = "<p>ไม่พบข้อมูลพืชในรูปภาพนี้</p>";
    }
}
