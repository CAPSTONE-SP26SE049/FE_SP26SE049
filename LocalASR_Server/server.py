import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
import nemo.collections.asr as nemo_asr
import shutil
import torch

# --- CẤU HÌNH ---
MODEL_NAME = "nvidia/parakeet-ctc-0.6b-vi"
PORT = 8000
TEMP_FILE = "temp_audio_input.wav"

app = FastAPI()
asr_model = None

@app.on_event("startup")
async def startup_event():
    """Load model một lần khi server khởi động"""
    global asr_model
    print(f"⏳ Đang tải mô hình {MODEL_NAME}... (Lần đầu sẽ mất vài phút)")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    asr_model = nemo_asr.models.ASRModel.from_pretrained(model_name=MODEL_NAME)
    asr_model.to(device)

    print(f"✅ Mô hình đã sẵn sàng trên thiết bị: {device}")
    print(f"ℹ️  Using transcribe signature: {asr_model.transcribe}")
    print(f"🚀 Server đang chạy tại: http://localhost:{PORT}")


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """API nhận file wav và trả về text"""
    if asr_model is None:
        raise HTTPException(status_code=503, detail="Model chưa sẵn sàng")

    try:
        # 1) Lưu file upload xuống ổ cứng tạm thời
        with open(TEMP_FILE, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2) Gọi model để nhận dạng
        # NeMo có thể trả về list[str] hoặc list[Hypothesis].
        transcriptions = asr_model.transcribe(audio=[TEMP_FILE])

        # 3) Chuẩn hoá kết quả: luôn trả về text thuần (string)
        text_result = ""
        if transcriptions and len(transcriptions) > 0:
            first = transcriptions[0]
            # đôi khi có thể là list-of-list
            if isinstance(first, list) and len(first) > 0:
                first = first[0]

            # Nếu là Hypothesis/đối tượng có thuộc tính .text
            if hasattr(first, "text"):
                text_result = first.text or ""
            else:
                text_result = str(first) if first is not None else ""

        print("TEXT =", text_result)
        return {"status": "success", "text": text_result}

    except Exception as e:
        print(f"Lỗi server: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
