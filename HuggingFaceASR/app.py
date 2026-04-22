import os
import uuid
import torch
import librosa
import soundfile as sf
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import nemo.collections.asr as nemo_asr
from huggingface_hub import hf_hub_download

app = FastAPI(title="SpeakVN - Parakeet ASR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "/tmp/asr_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

# ── Load model once at startup ───────────────────────────────────────────────
print("🔄 Downloading NVIDIA Parakeet Vietnamese model...")
asr_model = None

def load_model():
    try:
        nemo_file_path = hf_hub_download(
            repo_id="nvidia/parakeet-ctc-0.6b-vietnamese",
            filename="parakeet-ctc-0.6b-vi.nemo",
            cache_dir="/tmp/model_cache"
        )
        print(f"✅ Model file ready: {nemo_file_path}")

        model = nemo_asr.models.EncDecCTCModelBPE.restore_from(nemo_file_path)

        if torch.cuda.is_available():
            model = model.cuda()
            print(f"🚀 GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("⚠️  Running on CPU — expect 5-15s per request")

        model.eval()

        # Warm-up
        dummy = os.path.join(TEMP_DIR, "warmup.wav")
        sf.write(dummy, [0.0] * 16000, 16000)
        try:
            model.transcribe([dummy])
            os.remove(dummy)
        except Exception:
            pass

        print("✅ Model ready!")
        return model
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return None

asr_model = load_model()


@app.get("/")
def root():
    return {
        "service": "SpeakVN Parakeet ASR",
        "model": "nvidia/parakeet-ctc-0.6b-vietnamese",
        "status": "ready" if asr_model else "model_load_failed",
        "endpoints": ["/asr", "/predict-pronunciation", "/health"]
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": asr_model is not None}


# ── /asr — standard transcription endpoint ──────────────────────────────────
@app.post("/asr")
async def transcribe(file: UploadFile = File(...)):
    if asr_model is None:
        return {"error": "ASR Model not loaded", "text": ""}

    file_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{file_id}_input.wav")

    with open(temp_path, "wb") as buf:
        buf.write(await file.read())

    try:
        audio, sr = librosa.load(temp_path, sr=16000, mono=True)
        processed = os.path.join(TEMP_DIR, f"{file_id}_proc.wav")
        sf.write(processed, audio, sr)

        transcriptions = asr_model.transcribe([processed])
        raw = transcriptions[0] if transcriptions else ""

        if hasattr(raw, "text"):
            text = raw.text
        elif isinstance(raw, dict):
            text = raw.get("text", "")
        else:
            text = str(raw)

        print(f"[ASR] → '{text}'")
        return {"text": text}

    except Exception as e:
        print(f"[ASR ERROR] {e}")
        return {"error": str(e), "text": ""}

    finally:
        for p in [temp_path]:
            if os.path.exists(p):
                os.remove(p)
        if "processed" in locals() and os.path.exists(processed):
            os.remove(processed)


# ── /predict-pronunciation — Godot-compatible endpoint ──────────────────────
@app.post("/predict-pronunciation")
async def predict_pronunciation(file: UploadFile = File(...)):
    """Alias of /asr — used by Godot asr_client.gd LOCAL_ASR_URL"""
    result = await transcribe(file)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
