import os
import uuid
import torch
import librosa
import soundfile as sf
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import nemo.collections.asr as nemo_asr

app = FastAPI(title="NVIDIA Parakeet ASR Server")

# Cấu hình CORS để Frontend có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from huggingface_hub import hf_hub_download

# Load mô hình NVIDIA Parakeet Vietnamese
print("Đang tải mô hình NVIDIA Parakeet... Vui lòng đợi.")

def load_model():
    try:
        print("Đang kiểm tra và tải file mô hình từ HuggingFace (nếu chưa có)...")
        os.makedirs("models", exist_ok=True)
        
        nemo_file_path = hf_hub_download(
            repo_id="nvidia/parakeet-ctc-0.6b-vietnamese",
            filename="parakeet-ctc-0.6b-vi.nemo",
            local_dir="models"
        )
        
        print(f"File mô hình đã có tại: {nemo_file_path}")
        print("Đang giải nén và khởi tạo mô hình... Quá trình này có thể mất vài phút.")
        
        model = nemo_asr.models.EncDecCTCModelBPE.restore_from(nemo_file_path)
        
        # ── Tăng tốc với GPU CUDA (GTX 1650 hỗ trợ CUDA) ──────────────────
        if torch.cuda.is_available():
            model = model.cuda()
            print(f"🚀 Đang dùng GPU: {torch.cuda.get_device_name(0)} (CUDA {torch.version.cuda})")
            print("   → Tốc độ dự kiến: 3-8 giây/câu thay vì 30-60s")
        else:
            print("⚠️  Không tìm thấy CUDA - chạy CPU (chậm hơn)")
        
        model.eval()  # Chế độ inference (tắt dropout, nhanh hơn)
        
        # Warm-up: chạy 1 lần để CUDA JIT compile kernel (lần after sẽ nhanh)
        print("🔥 Khởi động model (warm-up)...")
        dummy_audio = os.path.join(TEMP_DIR, "warmup.wav")
        sf.write(dummy_audio, [0.0] * 16000, 16000)  # 1 giây im lặng
        try:
            model.transcribe([dummy_audio])
            os.remove(dummy_audio)
            print("✅ Warm-up hoàn tất - model sẵn sàng!")
        except Exception:
            pass
        
        return model
    except Exception as e:
        print(f"Lỗi hệ thống khi khởi tạo mô hình: {e}")
        return None

asr_model = load_model()
if asr_model:
    print("Mô hình đã được tải thành công!")
else:
    print("Không thể tải mô hình. Vui lòng kiểm tra lại kết nối hoặc file cache.")

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/asr")
async def transcribe(file: UploadFile = File(...)):
    if asr_model is None:
        return {"error": "ASR Model not loaded"}

    # Lưu file tạm thời
    file_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        # Xử lý audio (Nemo yêu cầu 16kHz mono)
        audio, sr = librosa.load(temp_path, sr=16000, mono=True)
        processed_path = os.path.join(TEMP_DIR, f"processed_{file_id}.wav")
        sf.write(processed_path, audio, sr)

        # Chạy nhận diện
        transcriptions = asr_model.transcribe([processed_path])
        
        # Đảm bảo kết quả trả về là string (một số phiên bản NeMo trả về Hypothesis object)
        raw_text = transcriptions[0] if transcriptions else ""
        if hasattr(raw_text, 'text'):
            text = raw_text.text
        elif isinstance(raw_text, dict) and 'text' in raw_text:
            text = raw_text['text']
        else:
            text = str(raw_text)

        print(f"Nhận diện được: {text}")
        return {"text": text}


    except Exception as e:
        print(f"Lỗi xử lý ASR: {e}")
        return {"error": str(e)}
    
    finally:
        # Dọn dẹp file tạm
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if 'processed_path' in locals() and os.path.exists(processed_path):
            os.remove(processed_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
