import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Volume2, Play, RotateCcw, Lightbulb, AlertTriangle, Sparkles, Type, Pause } from 'lucide-react';
import MouthViseme, { useWordAnimation, textToVisemeKeys } from '../components/MouthViseme';
import type { FaceType } from '../components/MouthViseme';
import '@google/model-viewer';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                src?: string
                alt?: string
                'camera-controls'?: boolean | string
                'auto-rotate'?: boolean | string
                'shadow-intensity'?: string
                exposure?: string
                'camera-orbit'?: string
                'field-of-view'?: string
                'interaction-prompt'?: string
                'animation-name'?: string
                autoplay?: boolean | string
                'animation-crossfade-duration'?: string
                loading?: string
                style?: React.CSSProperties
            }, HTMLElement>
        }
    }
}

const SOUND_GROUPS = [
    ['N', 'L'],
    ['S', 'X'],
    ['D', 'GI', 'R'],
    ['TR', 'CH']
];

const SOUND_INFO: Record<string, { title: string, desc: string, tip: string, region: string, regionError: string }> = {
    'N': { title: 'Âm "N" — Phụ Âm Mũi', desc: 'Đầu lưỡi chạm ngạc cứng, hơi ra đằng mũi', tip: 'Để phát âm chữ "N" chuẩn, đầu lưỡi đặt vào vòm miệng cứng, luồng khí sẽ bị chặn lại ở miệng và thoát ra bằng đường mũi.', region: 'Miền Bắc', regionError: 'Hay mắc lỗi phát âm lẫn lộn thành "L".' },
    'L': { title: 'Âm "L" — Phụ Âm Đầu Lưỡi', desc: 'Đặt đầu lưỡi chạm vào nướu trên rồi bật ra', tip: 'Để phát âm chữ "L" chuẩn, hãy đặt đầu lưỡi nhẹ nhàng chạm vào phần nướu phía sau răng cửa trên, rồi bật lưỡi xuống dứt khoát.', region: 'Miền Bắc', regionError: 'Dễ nói ngọng thành âm "N".' },
    'S': { title: 'Âm "S" — Phụ Âm Đầu Lưỡi Uốn', desc: 'Đầu lưỡi uốn cong về hậu ngạc, xát mạnh hơi', tip: 'Phát âm "S" cần uốn cong đầu lưỡi lên phía ngạc cứng nhưng không chạm hẳn, để luồng hơi đi qua khe hở tạo thành âm xát mạnh (âm s- nặng).', region: 'Miền Trung', regionError: 'Hay nhầm lẫn và đổi chỗ giữa "S" và "X".' },
    'X': { title: 'Âm "X" — Phụ Âm Đầu Lưỡi Phẳng', desc: 'Mặt lưỡi tiếp cận ngạc cứng trước, xát nhẹ', tip: 'Phát âm "X" bằng cách duỗi tự nhiên mặt lưỡi, luồng hơi đi ra nhẹ nhàng, không uốn cong lưỡi (âm x- nhẹ).', region: 'Miền Trung', regionError: 'Hay nhầm lẫn và đổi chỗ giữa "S" và "X".' },
    'D': { title: 'Âm "D" — Phụ Âm Mặt Lưỡi', desc: 'Mặt lưỡi tiếp cận ngạc, xát nhẹ có rung thanh', tip: 'Phát âm chữ "D" bằng cách đưa phần trước mặt lưỡi sát ngạc cứng, đẩy luồng hơi ra xát nhẹ, dây thanh rung.', region: 'Miền Nam', regionError: 'Thường phát âm sai thành "R" hoặc "GI".' },
    'GI': { title: 'Âm "GI" — Phụ Âm Mặt Lưỡi Xát', desc: 'Mặt lưỡi hơi nâng, xát nhẹ ở ngạc cứng', tip: 'Trong ngôn ngữ hiện đại, "GI" có khẩu hình mô phỏng gần giống như âm "D", xát nhẹ qua mặt lưỡi.', region: 'Miền Nam', regionError: 'Thường phát âm gần giống với "D" hoặc "Y".' },
    'R': { title: 'Âm "R" — Phụ Âm Đầu Lưỡi Rung', desc: 'Đầu lưỡi uốn cong và rung mạnh luồng hơi', tip: 'Để phát âm chuẩn "R", uốn đầu lưỡi lên sát ngạc cứng, đẩy khí ra làm rung đầu lưỡi tạo thành âm xát rung cực mạnh.', region: 'Miền Nam', regionError: 'Ít khi uốn lưỡi, thường đọc nhẹ thành "D" hoặc "Y".' },
    'TR': { title: 'Âm "TR" — Phụ Âm Đầu Lưỡi Cuộn', desc: 'Đầu lưỡi uốn lên chạm ngạc cứng rồi bật mạnh', tip: 'Phát âm "TR" yêu cầu uốn cong đầu lưỡi lên chạm vào vòm ngạc cứng, sau đó bật thật mạnh luồng hơi ra ngoài.', region: 'Miền Trung', regionError: 'Dễ nhầm lẫn và đọc thành âm "CH".' },
    'CH': { title: 'Âm "CH" — Phụ Âm Mặt Lưỡi', desc: 'Mặt lưỡi nâng lên chạm ngạc cứng, bật hơi', tip: 'Khi phát âm "CH", mặt lưỡi nâng cao chạm vào phần ngạc cứng, sau đó hạ xuống và xát mạnh luồng hơi ra ngoài không làm rung dây thanh.', region: 'Miền Trung', regionError: 'Hay nhầm lẫn và đọc thành âm "TR".' }
};

const EXAMPLE_WORDS: Record<string, string[]> = {
    'N': ['nón', 'nước', 'nắng', 'nấm'],
    'L': ['lá', 'lửa', 'lồng', 'lưỡi'],
    'S': ['sáng', 'sông', 'sách', 'sợi'],
    'X': ['xanh', 'xuân', 'xóm', 'xương'],
    'D': ['dừa', 'dạy', 'dầu', 'dán'],
    'GI': ['gió', 'giày', 'giỗ', 'giấc'],
    'R': ['rừng', 'rắn', 'ròng', 'rán'],
    'TR': ['trăng', 'trường', 'trẻ', 'trái'],
    'CH': ['chim', 'chợ', 'chạy', 'cháo'],
};

export default function PronunciationModelPage() {
    const [activeSound, setActiveSound] = useState<string>('N');
    const [wordInput, setWordInput] = useState('');
    const [faceType, setFaceType] = useState<FaceType>('child');
    const { currentViseme, isPlaying, currentPhonemeIndex, playWord, stop } = useWordAnimation();
    const [manualViseme, setManualViseme] = useState('rest');
    
    // 3D Model Viewer state hooks
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const modelViewerRef = useRef<any>(null);

    useEffect(() => {
        const viewer = modelViewerRef.current;
        if (!viewer) return;
        const handleLoop = () => {
            viewer.pause();
            // Optional: viewer.currentTime = 0; if you want it to reset
        };
        viewer.addEventListener('loop', handleLoop);
        return () => viewer.removeEventListener('loop', handleLoop);
    }, [viewMode, activeSound]);

    const displayViseme = isPlaying ? currentViseme : manualViseme;

    const handleSoundSelect = useCallback((sound: string) => {
        if (isPlaying) return;
        setActiveSound(sound);
        setManualViseme(sound.toLowerCase());
    }, [isPlaying]);

    const handlePlayWord = useCallback((word: string) => {
        if (isPlaying) { stop(); return; }
        setWordInput(word);
        playWord(word, 350);
    }, [isPlaying, playWord, stop]);

    const handlePlayInput = useCallback(() => {
        if (!wordInput.trim()) return;
        if (isPlaying) { stop(); return; }
        playWord(wordInput.trim(), 350);
    }, [wordInput, isPlaying, playWord, stop]);

    const handleReset = useCallback(() => {
        stop();
        setManualViseme('rest');
    }, [stop]);

    const phonemes = wordInput ? textToVisemeKeys(wordInput) : [];

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-4 lg:p-6 pb-12">
            <div className="max-w-none mx-auto px-2 lg:px-6">

                {/* Header */}
                <header className="relative mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="w-14 h-14 bg-[#49B6E5] rounded-[1.8rem] border-[2.5px] border-slate-900 shadow-[4px_4px_0_#1f2937] flex items-center justify-center text-white"
                        >
                            <Volume2 size={24} strokeWidth={2.5} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">Mô Hình Phát Âm</h1>
                            <p className="text-slate-500 font-bold text-xs md:text-sm mt-0.5 italic tracking-wide">Khám phá cơ chế tạo âm tiếng Việt sinh động</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* Left Column: Controls & Info */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6 order-2 xl:order-1">

                        {/* Sound Selection Grid */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Chọn âm tiết</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-4 gap-3">
                                {SOUND_GROUPS.flat().map((sound) => (
                                    <button
                                        key={sound}
                                        onClick={() => handleSoundSelect(sound)}
                                        className={clsx(
                                            "relative h-12 rounded-xl font-black transition-all border-[2.5px] text-base",
                                            activeSound === sound
                                                ? "bg-[#49B6E5] text-white border-slate-900 shadow-[3px_3px_0_#1f2937] -translate-y-0.5 rotate-2"
                                                : "bg-white text-slate-500 border-slate-900 shadow-[2px_2px_0_#1f2937] hover:bg-slate-50 active:translate-y-0 active:shadow-none"
                                        )}
                                    >
                                        {sound}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Information Cards */}
                        <div className="space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSound}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white rounded-[1.5rem] border-[2px] border-slate-900 shadow-[6px_6px_0_#1f2937] p-6 space-y-4 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-5">
                                        <Volume2 size={60} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-[#fbf6ef] rounded-2xl border-[2px] border-slate-900 flex items-center justify-center -rotate-3">
                                            <span className="text-2xl font-black text-[#49B6E5] italic tracking-tighter">{activeSound}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">{SOUND_INFO[activeSound].title}</h3>
                                            <p className="text-slate-500 font-bold text-xs mt-0.5">{SOUND_INFO[activeSound].desc}</p>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 rounded-xl border-[1.5px] border-slate-900 p-4 space-y-1.5">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle size={16} strokeWidth={3} />
                                            <h4 className="font-black text-xs uppercase tracking-wider">Lưu ý lỗi {SOUND_INFO[activeSound].region}</h4>
                                        </div>
                                        <p className="text-red-700 font-bold text-xs leading-relaxed pl-6">
                                            {SOUND_INFO[activeSound].regionError}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Pro Tip Card */}
                            <motion.div
                                key={`tip-${activeSound}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#49B6E5]/10 rounded-[1.5rem] border-[2px] border-[#49B6E5] p-5 flex gap-4 items-start relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                    <Sparkles className="text-[#49B6E5]" size={24} />
                                </div>
                                <div className="w-10 h-10 bg-white rounded-xl border-[1.5px] border-[#49B6E5] flex items-center justify-center flex-shrink-0">
                                    <Lightbulb size={20} className="text-[#49B6E5]" strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">Mẹo phát âm</h4>
                                        <span className="text-[8px] bg-white text-[#49B6E5] px-2 py-0.5 rounded-full border border-[#49B6E5] font-black uppercase">Chuyên gia</span>
                                    </div>
                                    <p className="text-slate-600 font-bold text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: SOUND_INFO[activeSound].tip.replace(`"${activeSound}"`, `<strong class="text-[#49B6E5]">"${activeSound}"</strong>`) }} />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column: Viseme Viewport & Controls */}
                    <div className="lg:col-span-12 xl:col-span-7 order-1 xl:order-2 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[1.5rem] border-[2px] border-slate-900 shadow-[8px_8px_0_#1f2937] overflow-hidden flex flex-col"
                        >
                            {/* Top Bar */}
                            <div className="px-5 py-3 bg-slate-50 border-b-[2px] border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2.5 h-2.5 rounded-full border-[1.2px] border-slate-900 bg-red-400" />
                                        <div className="w-2.5 h-2.5 rounded-full border-[1.2px] border-slate-900 bg-yellow-400" />
                                        <div className="w-2.5 h-2.5 rounded-full border-[1.2px] border-slate-900 bg-green-400" />
                                    </div>
                                    <span className="ml-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:inline">Pronunciation View</span>
                                </div>

                                {/* 2D / 3D Mode Selector */}
                                <div className="flex gap-1 bg-slate-200 p-0.5 rounded-lg border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0_#1f2937]">
                                    <button
                                        onClick={() => setViewMode('2d')}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                                            viewMode === '2d'
                                                ? "bg-[#49B6E5] text-white shadow-[1px_1px_0_#1f2937]"
                                                : "text-slate-500 hover:text-slate-900"
                                        )}
                                    >
                                        Hình 2D
                                    </button>
                                    <button
                                        onClick={() => setViewMode('3d')}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                                            viewMode === '3d'
                                                ? "bg-[#49B6E5] text-white shadow-[1px_1px_0_#1f2937]"
                                                : "text-slate-500 hover:text-slate-900"
                                        )}
                                    >
                                        Mô hình 3D
                                    </button>
                                </div>

                                <div className="px-3 py-1 bg-white border-[1.2px] border-slate-900 rounded-lg text-[8px] font-black text-[#49B6E5] shadow-[1.5px_1.5px_0_#1f2937]">
                                    {isPlaying ? `ĐANG PHÁT: ${wordInput}` : `ÂM: ${activeSound}`}
                                </div>
                            </div>

                            {/* Viseme Viewport */}
                            <div className={clsx(
                                "relative bg-gradient-to-b from-[#fef9f4] to-[#fdf0e8] flex items-center justify-center p-6 transition-all",
                                viewMode === '2d' ? "h-[340px] md:h-[400px]" : "h-[450px] md:h-[550px]"
                            )}>
                                {viewMode === '2d' ? (
                                    <>
                                        <MouthViseme
                                            viseme={displayViseme}
                                            faceType={faceType}
                                            className="w-[280px] h-[280px] md:w-[320px] md:h-[320px]"
                                        />

                                        {/* Current phoneme label */}
                                        <AnimatePresence>
                                            {isPlaying && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border-[2px] border-slate-900 shadow-[3px_3px_0_#1f2937]"
                                                >
                                                    <span className="font-black text-[#49B6E5] text-sm uppercase">{currentViseme}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <div className="w-full h-full relative flex items-center justify-center">
                                        {/* 3D Action Controls */}
                                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (modelViewerRef.current) {
                                                        modelViewerRef.current.currentTime = 0;
                                                        modelViewerRef.current.play();
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-[#49B6E5] text-white font-black text-xs uppercase shadow-[3px_3px_0_#1f2937] flex items-center gap-2 transition-all"
                                            >
                                                <Play size={16} /> Phát hoạt ảnh
                                            </motion.button>
                                        </div>

                                        {/* 3D Model viewer using web component */}
                                        <model-viewer
                                            ref={modelViewerRef}
                                            key={`model-${activeSound}`}
                                            src="/3D/Pronunciation.glb"
                                            alt="Mô hình phát âm 3D"
                                            camera-controls
                                            auto-rotate
                                            shadow-intensity="1.5"
                                            exposure="1.0"
                                            animation-name={activeSound}
                                            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                                        ></model-viewer>

                                        {/* Helper tips overlay */}
                                        <div className="absolute bottom-0 right-0 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg border border-slate-700 text-[9px] font-bold shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                                            🖱️ Giữ chuột trái xoay • Cuộn để phóng to
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            {viewMode === '2d' && (
                                <div className="p-4 md:p-5 bg-white border-t-[2px] border-slate-900 space-y-4">

                                    {/* Face Type Selector */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn nhân vật</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {([
                                                { key: 'child' as FaceType, label: 'Trẻ em', emoji: '👶' },
                                                { key: 'adult' as FaceType, label: 'Người lớn', emoji: '🧑' },
                                                { key: 'elderly' as FaceType, label: 'Người già', emoji: '👴' },
                                            ]).map(ft => (
                                                <motion.button
                                                    key={ft.key}
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setFaceType(ft.key)}
                                                    className={clsx(
                                                        "flex-1 py-2 px-3 rounded-xl border-[2px] font-black text-xs flex items-center justify-center gap-1.5 transition-all",
                                                        faceType === ft.key
                                                            ? "border-slate-900 bg-[#49B6E5] text-white shadow-[3px_3px_0_#1f2937]"
                                                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-900 hover:shadow-[2px_2px_0_#1f2937]"
                                                    )}
                                                >
                                                    <span className="text-base">{ft.emoji}</span> {ft.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Word Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Type size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhập từ để mô phỏng</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                value={wordInput}
                                                onChange={e => setWordInput(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handlePlayInput(); }}
                                                placeholder="Ví dụ: lá, nước, trường..."
                                                className="flex-1 h-12 px-4 rounded-xl border-[2.5px] border-slate-900 bg-[#fbf6ef] shadow-[2px_2px_0_#1f2937] font-bold text-[#263D5B] placeholder:text-slate-300 focus:outline-none focus:border-[#49B6E5] transition-colors"
                                            />
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handlePlayInput}
                                                disabled={!wordInput.trim()}
                                                className={clsx(
                                                    "h-12 px-5 rounded-xl border-[2.5px] border-slate-900 font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_#1f2937] flex items-center gap-2 transition-all disabled:opacity-40",
                                                    isPlaying ? "bg-red-400 text-white" : "bg-[#49B6E5] text-white"
                                                )}
                                            >
                                                {isPlaying ? <><Pause size={16} /> Dừng</> : <><Play size={16} /> Phát</>}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleReset}
                                                className="h-12 w-12 rounded-xl border-[2.5px] border-slate-900 bg-white shadow-[3px_3px_0_#1f2937] flex items-center justify-center"
                                            >
                                                <RotateCcw size={16} />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Phoneme sequence display */}
                                    {phonemes.length > 0 && wordInput && (
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Chuỗi âm:</span>
                                            {phonemes.map((p, idx) => (
                                                <motion.span
                                                    key={idx}
                                                    animate={currentPhonemeIndex === idx ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                                                    className={clsx(
                                                        "px-2 py-1 rounded-lg border-[1.5px] text-xs font-black transition-colors",
                                                        currentPhonemeIndex === idx
                                                            ? "border-[#49B6E5] bg-[#49B6E5] text-white shadow-[2px_2px_0_#1f2937]"
                                                            : currentPhonemeIndex > idx
                                                                ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                                                                : "border-slate-200 bg-slate-50 text-slate-400"
                                                    )}
                                                >
                                                    {p}
                                                </motion.span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Example words */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Từ mẫu cho âm {activeSound}:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {(EXAMPLE_WORDS[activeSound] || []).map(word => (
                                                <motion.button
                                                    key={word}
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handlePlayWord(word)}
                                                    className="px-4 py-2 rounded-xl border-[2px] border-slate-900 bg-white shadow-[2px_2px_0_#1f2937] font-black text-sm text-[#263D5B] hover:bg-[#49B6E5] hover:text-white transition-colors"
                                                >
                                                    {word}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
