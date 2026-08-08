// ดักจับการเลือกไฟล์ภาพหรือถ่ายภาพ
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // แสดงภาพตัวอย่างบนหน้าเว็บ
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);

        // เรียกฟังก์ชันสแกนภาพ
        analyzePlant(file);
    }
});

// ฟังก์ชันสแกนพืชผ่าน API
async function analyzePlant(file) {
    const resultText = document.getElementById('result');
    const loadingText = document.getElementById('loading');

    if (loadingText) loadingText.style.display = 'block';
    if (resultText) resultText.innerHTML = "⏳ กำลังส่งภาพประมวลผลด้วย AI...";

    const formData = new FormData();
    formData.append('images', file);
    formData.append('organs', 'auto');

    try {
        // ส่ง Request ไปยัง Pl@ntNet API
        const response = await fetch("https://my-api.plantnet.org/v2/identify/all?api-key=2b10CczstW4rLbTuLwcYZuPwe&lang=th", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`การเชื่อมต่อผิดพลาด (${response.status})`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const topMatch = data.results[0];
            const speciesName = topMatch.species.scientificNameWithoutAuthor;
            const commonName = topMatch.species.commonNames && topMatch.species.commonNames.length > 0 
                               ? topMatch.species.commonNames[0] 
                               : "ไม่มีชื่อสามัญระบุ";
            const score = (topMatch.score * 100).toFixed(1);

            resultText.innerHTML = `
                <div style="text-align: left; background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin-top: 10px;">
                    <h3 style="color: #166534; margin-top:0;">🌿 ผลการวิเคราะห์</h3>
                    <p><strong>ชื่อสามัญ:</strong> ${commonName}</p>
                    <p><strong>ชื่อวิทยาศาสตร์:</strong> <i>${speciesName}</i></p>
                    <p><strong>ความแม่นยำ:</strong> <span style="color: green; font-weight: bold;">${score}%</span></p>
                </div>
            `;
        } else {
            resultText.innerHTML = "<span style='color: orange;'>⚠️ ไม่สามารถระบุชนิดพืชได้ กรุณาถ่ายภาพใบหรือดอกให้ชัดเจนยิ่งขึ้น</span>";
        }
    } catch (error) {
        resultText.innerHTML = `<span style='color: red;'>❌ เกิดข้อผิดพลาด: ${error.message}<small>ข้อแนะนำ: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือลดขนาดรูปภาพ</small></span>`;
    } finally {
        if (loadingText) loadingText.style.display = 'none';
    }
}
