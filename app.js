// ฟังก์ชันเมื่อมีการเลือกไฟล์ภาพหรือถ่ายภาพ
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // แสดงภาพตัวอย่าง
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        }
        reader.readAsDataURL(file);

        // ส่งภาพไปวิเคราะห์ด้วย AI
        identifyPlant(file);
    }
});

// ฟังก์ชันส่งภาพไปวิเคราะห์ด้วย AI (Pl@ntNet Open API)
async function identifyPlant(imageFile) {
    const resultText = document.getElementById('result');
    const loadingText = document.getElementById('loading');
    
    if (loadingText) loadingText.style.display = 'block';
    if (resultText) resultText.innerHTML = "⏳ กำลังประมวลผลและวิเคราะห์รูปภาพ...";

    const formData = new FormData();
    formData.append('images', imageFile);

    try {
        // ดึงข้อมูลผ่าน Public API
        const response = await fetch("https://my-api.plantnet.org/v2/identify/all?api-key=2b10CczstW4rLbTuLwcYZuPwe", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดพลาด: Status ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const bestMatch = data.results[0];
            const species = bestMatch.species;
            const score = (bestMatch.score * 100).toFixed(1);
            const commonName = species.commonNames && species.commonNames.length > 0 ? species.commonNames[0] : "ไม่ระบุชื่อทั่วไป";

            resultText.innerHTML = `
                <div style="text-align: left; background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin-top: 10px;">
                    <h3 style="color: #166534; margin-top:0;">🌱 ผลการวิเคราะห์</h3>
                    <p><strong>ชื่อวิทยาศาสตร์:</strong> <i>${species.scientificNameWithoutAuthor}</i></p>
                    <p><strong>ชื่อทั่วไป:</strong> ${commonName}</p>
                    <p><strong>วงศ์ (Family):</strong> ${species.family.scientificNameWithoutAuthor}</p>
                    <p><strong>ความแม่นยำ:</strong> <span style="color: green; font-weight: bold;">${score}%</span></p>
                </div>
            `;
        } else {
            resultText.innerHTML = "<span style="color: orange;">⚠️ ไม่พบข้อมูลพืชในรูปภาพนี้ กรุณาถ่ายภาพใบหรือดอกให้ชัดเจนยิ่งขึ้น</span>";
        }

    } catch (error) {
        resultText.innerHTML = `<span style="color: red;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}</span>`;
    } finally {
        if (loadingText) loadingText.style.display = 'none';
    }
}
