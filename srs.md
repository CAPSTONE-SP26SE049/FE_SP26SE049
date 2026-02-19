 Capstone Project name: 
English: SpeakVN Journey - AI-Powered Vietnamese Pronunciation Correction Game
Vietnamese: Hành Trình Nói Chuẩn - Game Rèn Luyện Phát Âm Tiếng Việt Với AI
Abbreviation: SP26SE049
Context: 
Vietnamese regional accents create pronunciation challenges, especially N/L confusion in Northern regions (Hải Phòng, Hải Dương), S/X in Central, and D/GI/R in Southern areas. These patterns create communication barriers in professional contexts.

Traditional speech therapy costs 500,000-1,000,000 VND per session and is inaccessible to most citizens. Current apps focus on foreign languages, leaving a gap for Vietnamese pronunciation correction. AI speech recognition and gamification enable scalable solutions for millions of speakers.
Proposed Solutions 
•	Gamified journey mapping Vietnam (North to South) with region-specific pronunciation challenges
•	AI speech recognition detecting regional pronunciation errors in real-time
•	Adaptive difficulty personalizing practice based on individual error patterns
•	Visual phonetic feedback showing tongue/mouth positioning
•	Multi-modal learning: audio recognition, visual cues, interactive mini-games  
Functional requirement 
Player Mobile & Web Application
•	Character creation with pronunciation assessment (identify regional accent)
•	Map progression: 3 regions (North/Central/South), 15 levels, 5 pronunciation pairs (N/L, S/X, D/GI/R, TR/CH)
•	Mini-games: word challenges, sentence completion, conversation simulation
•	Real-time AI analysis with visual/audio feedback, star-based scoring (1-3 stars)
•	Achievement system (50+ badges), daily challenges, streak tracking
•	Interactive phonetic guide with 3D mouth/tongue animations
•	Progress analytics dashboard, personalized recommendations
•	Friend system, regional leaderboards, weekly tournaments
AI-Powered Intelligence Features
•	Vietnamese phoneme classification using Wav2Vec 2.0 fine-tuned on Vietnamese dataset
•	Regional accent detection (Northern/Central/Southern dialects)
•	Consonant confusion detection (N/L, S/X, D/R/GI, TR/CH pairs)
•	Tone accuracy measurement (6 Vietnamese tones) via pitch contour analysis
•	Real-time feedback latency < 500ms
•	Adaptive learning: dynamic difficulty adjustment, personalized word selection
•	Audio processing: noise reduction, voice activity detection, MFCC feature extraction
Admin Dashboard (Web)
•	Content management: upload pronunciation training content by region/difficulty
•	User analytics: aggregate statistics, error pattern heat maps, engagement metrics
•	System monitoring: AI model performance, server health, user feedback management
Educator Portal (Web)
•	Student account management with custom learning paths
•	Progress monitoring with detailed pronunciation analytics
•	Custom lesson plans, achievement goals, feedback delivery