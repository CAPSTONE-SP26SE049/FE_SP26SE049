import os
import uuid
import requests
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SpeakVN - Custom ASR Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cấu hình Model mới
REMOTE_API_URL = "https://nguyenductuan-speak-journey-vn.hf.space/api/v1/transcribe"

@app.get("/")
def root():
    return {
        "service": "SpeakVN Custom ASR Proxy",
        "remote_url": REMOTE_API_URL,
        "status": "active"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/asr")
@app.post("/api/v1/transcribe")
async def transcribe(
    audio: UploadFile = File(...), 
    target: str = Form(""),
    model: str = Form(None),
    language: str = Form(None),
    sampling_rate: str = Form(None)
):
    try:
        # Chuyển tiếp request lên HF Space
        files = {"audio": (audio.filename, await audio.read(), audio.content_type)}
        data = {"target": target}
        if model: data["model"] = model
        if language: data["language"] = language
        if sampling_rate: data["sampling_rate"] = sampling_rate
        
        response = requests.post(REMOTE_API_URL, files=files, data=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "success": False, 
                "error": f"Remote API error: {response.status_code}",
                "details": response.text
            }

    except Exception as e:
        print(f"[ASR PROXY ERROR] {e}")
        return {"success": False, "error": str(e)}

@app.post("/predict-pronunciation")
async def predict_pronunciation(
    file: UploadFile = File(...), 
    target: str = Form(""),
    model: str = Form(None),
    language: str = Form(None),
    sampling_rate: str = Form(None)
):
    # Hỗ trợ cả key 'file' và 'audio' để tương thích ngược
    return await transcribe(file, target, model, language, sampling_rate)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
