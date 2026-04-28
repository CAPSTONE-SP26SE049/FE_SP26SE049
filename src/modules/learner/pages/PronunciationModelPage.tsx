import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Volume2, Play, RotateCcw, Lightbulb, MousePointer2, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import '@google/model-viewer';
import { DoodleLoading } from '../../../components/ui/DoodleLoading';

/* ─── Types ─────────────────────────────────────────── */
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string;
                    alt?: string;
                    'camera-controls'?: boolean | string;
                    'auto-rotate'?: boolean | string;
                    'shadow-intensity'?: string;
                    'environment-image'?: string;
                    exposure?: string;
                    'camera-orbit'?: string;
                    'field-of-view'?: string;
                    'min-camera-orbit'?: string;
                    'max-camera-orbit'?: string;
                    'interaction-prompt'?: string;
                    poster?: string;
                    loading?: string;
                    reveal?: string;
                    ar?: boolean | string;
                    style?: React.CSSProperties;
                },
                HTMLElement
            >;
        }
    }
}

/* ─── Helpers ─────────────────────────────────────────── */
function findMorphTargetsInViewer(viewer: any): { meshes: any[]; sceneObj: any } {
    const result = { meshes: [] as any[], sceneObj: null as any };
    if (!viewer) return result;
    for (const sym of Object.getOwnPropertySymbols(viewer)) {
        try {
            const val = viewer[sym];
            if (!val || typeof val !== 'object') continue;
            let traverseTarget = null;
            if (val.model && typeof val.model.traverse === 'function') {
                traverseTarget = val.model;
                result.sceneObj = val;
            } else if (typeof val.traverse === 'function' && val.isObject3D) {
                traverseTarget = val;
                result.sceneObj = val;
            }
            if (traverseTarget) {
                traverseTarget.traverse((node: any) => {
                    if (node.isMesh && node.morphTargetInfluences?.length > 0) result.meshes.push(node);
                });
                if (result.meshes.length > 0) break;
            }
        } catch { }
    }
    return result;
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

/* ─── Main Page ───────────────────────────────────────── */
export default function PronunciationModelPage() {
    const modelRef = useRef<any>(null);
    const [activeSound, setActiveSound] = useState<string>('N');
    const [sliderValue, setSliderValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const animationRef = useRef<number | null>(null);
    const morphMeshesRef = useRef<any[]>([]);
    const sceneObjRef = useRef<any>(null);
    const nudgeRef = useRef(false);

    useEffect(() => () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); }, []);

    const forceRender = useCallback(() => {
        const mv = modelRef.current;
        if (!mv) return;
        const scene = sceneObjRef.current;
        if (scene?.queueRender) { scene.queueRender(); return; }
        for (const sym of Object.getOwnPropertySymbols(mv)) {
            try {
                if (typeof mv[sym] === 'function' && sym.toString().includes('needsRender')) { mv[sym](); return; }
            } catch { }
        }
        nudgeRef.current = !nudgeRef.current;
        requestAnimationFrame(() => {
            mv.setAttribute('exposure', nudgeRef.current ? '1.5001' : '1.5');
        });
    }, []);

    const updateMorphTarget = useCallback((value: number, overrideSound?: string) => {
        const soundToUse = overrideSound || activeSound;
        const meshes = morphMeshesRef.current;
        if (!meshes.length) return;
        meshes.forEach((mesh: any) => {
            if (mesh.morphTargetDictionary) {
                // Ensure other shape keys are zeroed out if changing
                Object.keys(SOUND_INFO).forEach(k => {
                    const idx = mesh.morphTargetDictionary[k];
                    if (idx !== undefined && k !== soundToUse) {
                        mesh.morphTargetInfluences[idx] = 0;
                    }
                });

                const idx = mesh.morphTargetDictionary[soundToUse];
                if (idx !== undefined) { mesh.morphTargetInfluences[idx] = value; return; }
            }
            mesh.morphTargetInfluences[0] = value;
        });
        forceRender();
    }, [forceRender, activeSound]);

    const initMorphTargets = useCallback(() => {
        const mv = modelRef.current;
        if (!mv) return;
        const { meshes, sceneObj } = findMorphTargetsInViewer(mv);
        morphMeshesRef.current = meshes;
        sceneObjRef.current = sceneObj;
    }, []);

    const handleSliderChange = useCallback((value: number) => {
        if (isAnimating) return;
        setSliderValue(value);
        updateMorphTarget(value / 100);
    }, [isAnimating, updateMorphTarget]);

    const handleGuideAnimation = useCallback(() => {
        if (isAnimating) return;
        if (!morphMeshesRef.current.length) return;
        setIsAnimating(true);
        const rise = 500, hold = 1000, fall = 500;
        let startTime: number | null = null;

        const animateRise = (ts: number) => {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / rise, 1);
            const ep = 1 - Math.pow(1 - p, 3);
            updateMorphTarget(ep);
            setSliderValue(Math.round(ep * 100));
            if (p < 1) animationRef.current = requestAnimationFrame(animateRise);
            else setTimeout(() => { startTime = null; animationRef.current = requestAnimationFrame(animateFall); }, hold);
        };
        const animateFall = (ts: number) => {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / fall, 1);
            const ep = Math.pow(1 - p, 3);
            updateMorphTarget(ep);
            setSliderValue(Math.round(ep * 100));
            if (p < 1) animationRef.current = requestAnimationFrame(animateFall);
            else { updateMorphTarget(0); setSliderValue(0); setIsAnimating(false); }
        };

        updateMorphTarget(0);
        setSliderValue(0);
        animationRef.current = requestAnimationFrame(animateRise);
    }, [isAnimating, updateMorphTarget]);

    const handleReset = useCallback(() => {
        if (isAnimating) return;
        setSliderValue(0);
        updateMorphTarget(0);
    }, [isAnimating, updateMorphTarget]);

    const handleModelLoad = useCallback(() => {
        setTimeout(() => { initMorphTargets(); setModelLoaded(true); }, 200);
    }, [initMorphTargets]);

    return (
        <div className="min-h-screen bg-[#fbf6ef] font-nunito p-6 lg:p-10 pb-24">
            <div className="max-w-[1200px] mx-auto">

                {/* ── Header Doodle ── */}
                <header className="relative mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="w-20 h-20 bg-[#49B6E5] rounded-[2.5rem] border-[3px] border-slate-900 shadow-[6px_6px_0_#1f2937] flex items-center justify-center text-white"
                        >
                            <Volume2 size={32} strokeWidth={2.5} />
                        </motion.div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Mô Hình 3D</h1>
                            <p className="text-slate-500 font-bold text-sm md:text-base mt-1 italic tracking-wide">Khám phá cơ chế tạo âm tiếng Việt sinh động</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* ── Left Column: Controls & Info ── */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-10 order-2 xl:order-1">

                        {/* ── Sound Selection Grid ── */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Chọn âm tiết</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-4 gap-4">
                                {SOUND_GROUPS.flat().map((sound) => (
                                    <button
                                        key={sound}
                                        onClick={() => {
                                            if (isAnimating) return;
                                            setActiveSound(sound);
                                            setSliderValue(0);
                                            updateMorphTarget(0, sound);
                                        }}
                                        className={clsx(
                                            "relative h-14 rounded-2xl font-black transition-all border-[2.5px] text-lg",
                                            activeSound === sound
                                                ? "bg-[#49B6E5] text-white border-slate-900 shadow-[4px_4px_0_#1f2937] -translate-y-1 rotate-2"
                                                : "bg-white text-slate-500 border-slate-900 shadow-[2px_2px_0_#1f2937] hover:bg-slate-50 active:translate-y-0 active:shadow-none"
                                        )}
                                    >
                                        {sound}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Information Cards ── */}
                        <div className="space-y-6">
                            {/* Main Info Card */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSound}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white rounded-[2rem] border-[2.5px] border-slate-900 shadow-[8px_8px_0_#1f2937] p-8 space-y-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Volume2 size={80} />
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-[#fbf6ef] rounded-3xl border-[2.5px] border-slate-900 flex items-center justify-center -rotate-3">
                                            <span className="text-4xl font-black text-[#49B6E5] italic tracking-tighter">{activeSound}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{SOUND_INFO[activeSound].title}</h3>
                                            <p className="text-slate-500 font-bold text-sm mt-1">{SOUND_INFO[activeSound].desc}</p>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 rounded-2xl border-[2px] border-slate-900 p-5 space-y-2 group">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle size={18} strokeWidth={3} />
                                            <h4 className="font-black text-sm uppercase tracking-wider">Lưu ý lỗi {SOUND_INFO[activeSound].region}</h4>
                                        </div>
                                        <p className="text-red-700 font-bold text-sm leading-relaxed pl-7">
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
                                className="bg-[#49B6E5]/10 rounded-[2rem] border-[2.5px] border-[#49B6E5] p-6 flex gap-5 items-start relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-20">
                                    <Sparkles className="text-[#49B6E5]" size={32} />
                                </div>
                                <div className="w-12 h-12 bg-white rounded-2xl border-[2px] border-[#49B6E5] flex items-center justify-center flex-shrink-0">
                                    <Lightbulb size={24} className="text-[#49B6E5]" strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1 pt-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">Mẹo phát âm</h4>
                                        <span className="text-[9px] bg-white text-[#49B6E5] px-2 py-0.5 rounded-full border border-[#49B6E5] font-black uppercase">Chuyên gia</span>
                                    </div>
                                    <p className="text-slate-600 font-bold text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: SOUND_INFO[activeSound].tip.replace(`"${activeSound}"`, `<strong class="text-[#49B6E5]">"${activeSound}"</strong>`) }} />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* ── Right Column: 3D Viewport & Controls ── */}
                    <div className="lg:col-span-12 xl:col-span-7 order-1 xl:order-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2.5rem] border-[2.5px] border-slate-900 shadow-[10px_10px_0_#1f2937] overflow-hidden flex flex-col h-[600px] md:h-[750px]"
                        >
                            {/* Sketchy Top Bar */}
                            <div className="px-6 py-4 bg-slate-50 border-b-[2.5px] border-slate-900 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full border-[1.5px] border-slate-900 bg-red-400" />
                                        <div className="w-3 h-3 rounded-full border-[1.5px] border-slate-900 bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full border-[1.5px] border-slate-900 bg-green-400" />
                                    </div>
                                    <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">3D Pronunciation View</span>
                                </div>
                                <div className="px-4 py-1 bg-white border-[1.5px] border-slate-900 rounded-xl text-[9px] font-black text-[#49B6E5] shadow-[2px_2px_0_#1f2937]">
                                    SOUND: {activeSound}
                                </div>
                            </div>

                            {/* Viewport Core */}
                            <div className="relative bg-slate-900 overflow-hidden flex-1 w-full group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950" />

                                <model-viewer
                                    ref={(el: any) => {
                                        if (el && el !== modelRef.current) {
                                            modelRef.current = el;
                                            el.addEventListener('load', handleModelLoad);
                                        }
                                    }}
                                    src="/3D/Pronunciation.glb"
                                    alt={`Mô hình 3D phát âm chữ ${activeSound}`}
                                    camera-controls
                                    shadow-intensity="1.5"
                                    exposure="1.8"
                                    camera-orbit="0deg 85deg auto"
                                    field-of-view="28deg"
                                    interaction-prompt="auto"
                                    style={{ width: '100%', height: '100%', outline: 'none', filter: 'drop-shadow(0 0 40px rgba(73,182,229,0.1))' } as React.CSSProperties}
                                />

                                {/* Interactive Tooltip Overlay */}
                                {modelLoaded && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border-[1.5px] border-white/20 flex items-center gap-3 text-white/60 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                                        <MousePointer2 size={14} strokeWidth={3} className="animate-bounce" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">Sử dụng chuột để quan sát từ nhiều phía</span>
                                    </div>
                                )}

                                {/* Loading State */}
                                {!modelLoaded && (
                                    <div className="absolute inset-0 z-50">
                                        <DoodleLoading message="Đang dựng mô hình 3D..." />
                                    </div>
                                )}
                            </div>

                            {/* ── The Lab Controls ── */}
                            <div className="p-6 md:p-8 bg-white border-t-[2.5px] border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                                {/* Guide Activation */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-[#49B6E5] rounded-[1.5rem] rotate-1 scale-[1.02] shadow-[4px_4px_0_#1f2937] transition-transform group-hover:rotate-0" />
                                    <button
                                        onClick={handleGuideAnimation}
                                        disabled={isAnimating || !modelLoaded}
                                        className={clsx(
                                            "relative w-full h-20 md:h-24 rounded-[1.5rem] border-[2.5px] border-slate-900 text-white font-black text-xl flex flex-col items-center justify-center gap-2 transition-all",
                                            isAnimating || !modelLoaded
                                                ? "bg-slate-400 cursor-not-allowed opacity-80"
                                                : "bg-[#49B6E5] active:translate-y-1 active:shadow-none"
                                        )}
                                    >
                                        {isAnimating ? (
                                            <div className="flex items-center gap-3">
                                                <RotateCcw className="animate-spin" size={24} strokeWidth={3} />
                                                <span>Đang mô phỏng...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <Play size={24} strokeWidth={3} fill="currentColor" />
                                                    <span>Bắt đầu hướng dẫn</span>
                                                </div>
                                                <span className="text-[10px] uppercase opacity-70 tracking-widest">Mô phỏng chuyển động lưỡi</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Manual Slider */}
                                <div className="space-y-4 px-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#49B6E5]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác thủ công</span>
                                        </div>
                                        <button
                                            onClick={handleReset}
                                            disabled={isAnimating || sliderValue === 0}
                                            className="px-3 py-1 bg-[#fbf6ef] border-[2px] border-slate-900 rounded-lg shadow-[2px_2px_0_#1f2937] text-[10px] font-black hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 flex items-center gap-1.5"
                                        >
                                            <RotateCcw size={10} strokeWidth={3} />
                                            Đặt lại
                                        </button>
                                    </div>

                                    <div className="relative pt-6">
                                        <div className="absolute -top-1 left-0 right-0 flex justify-between px-1">
                                            <span className="text-[8px] font-black text-slate-300 uppercase">Tự nhiên</span>
                                            <span className="text-[8px] font-black text-slate-300 uppercase">Căng nhất</span>
                                        </div>
                                        <Slider
                                            min={0}
                                            max={100}
                                            value={sliderValue}
                                            onChange={handleSliderChange}
                                            disabled={isAnimating || !modelLoaded}
                                            tooltip={{ open: false }}
                                            className="doodle-slider"
                                        />
                                        <div className="mt-4 flex items-center justify-center">
                                            <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full font-black text-lg shadow-[4px_4px_0_#49B6E5] italic">
                                                {sliderValue}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <style>{`
                .doodle-slider .ant-slider-rail {
                    background-color: #e2e8f0 !important;
                    height: 12px !important;
                    border-radius: 12px !important;
                    border: 2px solid #1f2937 !important;
                }
                .doodle-slider .ant-slider-track {
                    background-color: #49B6E5 !important;
                    height: 12px !important;
                    border-radius: 12px !important;
                    border-right: 2px solid #1f2937 !important;
                }
                .doodle-slider .ant-slider-handle {
                    width: 28px !important;
                    height: 28px !important;
                    margin-top: -10px !important;
                    background-color: #fff !important;
                    border: 3px solid #1f2937 !important;
                    box-shadow: 4px 4px 0 #1f2937 !important;
                    opacity: 1 !important;
                }
                .doodle-slider .ant-slider-handle:hover, 
                .doodle-slider .ant-slider-handle:focus {
                    transform: scale(1.1) rotate(5deg);
                }
                .doodle-slider .ant-slider-handle::after {
                    display: none !important;
                }
                model-viewer::part(default-progress-bar) { display: none; }
            `}</style>
        </div>
    );
}
