---
title: SpeakVN Parakeet ASR
emoji: 🎙️
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
models:
  - nvidia/parakeet-ctc-0.6b-vietnamese
pinned: false
---

# SpeakVN — NVIDIA Parakeet Vietnamese ASR API

REST API phục vụ nhận dạng giọng nói tiếng Việt cho dự án SpeakVN.

## Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/health` | Kiểm tra trạng thái server |
| POST | `/asr` | Nhận dạng giọng nói (upload WAV) |
| POST | `/predict-pronunciation` | Alias dùng cho Godot client |
