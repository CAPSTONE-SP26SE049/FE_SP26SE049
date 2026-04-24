import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slider, Spin } from 'antd';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Volume2, Play, RotateCcw, Lightbulb, Mouse, AlertTriangle } from '../../../lib/icons';
import '@google/model-viewer';

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
        <div className="p-4 lg:py-6 lg:px-8 max-w-[1200px] mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:items-start w-full">

                {/* ── Left Column: Info & Selector ── */}
                <div className="lg:col-span-5 space-y-5 lg:space-y-6">
                    {/* ── Header ── */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Volume2 size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-800 leading-none">Mô Hình Phát Âm</h2>
                            <p className="text-xs text-gray-400 font-semibold mt-0.5">Khám phá cơ chế tạo âm tiếng Việt 3D</p>
                        </div>
                    </div>

                    {/* ── Sound Selector ── */}
                    <div className="flex flex-wrap gap-3 w-full">
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
                                    "px-5 py-2.5 rounded-xl font-black transition-all border-2 text-sm",
                                    activeSound === sound
                                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30 ring-4 ring-purple-600/10 scale-105 relative z-10"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/70 shadow-sm"
                                )}
                            >
                                ÂM "{sound}"
                            </button>
                        ))}
                    </div>

                    {/* ── Sound label card ── */}
                    <motion.div
                        key={`label-${activeSound}`}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
                                <span className="text-white text-2xl font-black italic">{activeSound}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-gray-800">{SOUND_INFO[activeSound].title}</h3>
                                <p className="text-sm text-gray-400 font-medium mt-1 leading-snug">{SOUND_INFO[activeSound].desc}</p>
                            </div>
                        </div>
                        {SOUND_INFO[activeSound].region && (
                            <div className="bg-red-50/60 border border-red-100/80 rounded-2xl p-3.5 flex items-start gap-3 mt-1 shadow-sm">
                                <div className="mt-0.5">
                                    <AlertTriangle size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <h4 className="font-black text-red-700 text-sm flex items-center gap-2">
                                        Lỗi đặc trưng {SOUND_INFO[activeSound].region}
                                    </h4>
                                    <p className="text-red-600 text-sm mt-0.5 leading-relaxed bg-red-100/50 inline-block px-2 py-0.5 rounded-lg border border-red-100 font-medium">
                                        {SOUND_INFO[activeSound].regionError}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* ── Tip card ── */}
                    <motion.div
                        key={`tip-${activeSound}`}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5 flex gap-4 items-start"
                    >
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lightbulb size={18} className="text-orange-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="font-black text-gray-800 text-sm">Mẹo từ chuyên gia</h4>
                                <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Pro tip</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: SOUND_INFO[activeSound].tip.replace(`"${activeSound}"`, `<strong class="text-purple-600">"${activeSound}"</strong>`) }} />
                        </div>
                    </motion.div>
                </div>

                {/* ── Right Column: 3D Model ── */}
                <div className="lg:col-span-7">
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[480px] lg:h-[620px]"
                    >
                        {/* Color accent strip */}
                        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-orange-400 to-amber-400 flex-shrink-0" />

                        {/* Model Viewport */}
                        <div className="relative bg-gray-950 overflow-hidden flex-1 w-full">
                            {/* Ambient glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

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
                                shadow-intensity="1"
                                exposure="1.5"
                                camera-orbit="0deg 85deg auto"
                                field-of-view="30deg"
                                interaction-prompt="auto"
                                style={{ width: '100%', height: '100%', outline: 'none', '--poster-color': 'transparent' } as React.CSSProperties}
                            />

                            {/* Hint badge */}
                            {modelLoaded && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 pointer-events-none">
                                    <Mouse size={12} className="text-white/50" />
                                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Dùng chuột để xoay</span>
                                </div>
                            )}

                            {/* Loading overlay */}
                            {!modelLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm z-20">
                                    <Spin size="large" />
                                    <p className="mt-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Đang tải mô hình 3D...</p>
                                </div>
                            )}
                        </div>

                        {/* ── Controls panel ── */}
                        <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-shrink-0 bg-white">
                            {/* Animation button */}
                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center gap-3 text-center">
                                <p className="text-[10px] uppercase font-black text-purple-400 tracking-widest">Hướng dẫn tự động</p>
                                <button
                                    onClick={handleGuideAnimation}
                                    disabled={isAnimating || !modelLoaded}
                                    className={clsx(
                                        "w-full h-11 md:h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                                        isAnimating || !modelLoaded
                                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                            : "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
                                    )}
                                >
                                    {isAnimating ? (
                                        <><Spin size="small" /><span>Đang mô phỏng...</span></>
                                    ) : (
                                        <><Play size={16} />Kích hoạt hướng dẫn</>
                                    )}
                                </button>
                                <p className="text-[10px] text-purple-300 font-medium hidden md:block">Xem tiến trình chuyển động âm {activeSound}</p>
                            </div>

                            {/* Slider control */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5 space-y-3 flex flex-col justify-center">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Điều chỉnh thủ công</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-purple-600">{sliderValue}%</span>
                                        <button
                                            onClick={handleReset}
                                            disabled={isAnimating || sliderValue === 0}
                                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all disabled:opacity-30"
                                        >
                                            <RotateCcw size={11} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-400 font-bold w-10">Xuống</span>
                                    <Slider
                                        min={0}
                                        max={100}
                                        value={sliderValue}
                                        onChange={handleSliderChange}
                                        disabled={isAnimating || !modelLoaded}
                                        tooltip={{ open: false }}
                                        className="flex-1 pronunciation-slider"
                                        styles={{
                                            track: { background: 'linear-gradient(90deg, #9333ea, #a855f7)', height: 6 },
                                            rail: { background: '#e5e7eb', height: 6 },
                                            handle: { width: 20, height: 20, background: 'white', border: '3px solid #9333ea', boxShadow: '0 2px 8px rgba(147,51,234,0.3)', marginTop: -7 },
                                        }}
                                    />
                                    <span className="text-[10px] text-gray-400 font-bold w-6 text-right">Lên</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium text-center hidden md:block">Kéo để quan sát vị trí đầu lưỡi</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .pronunciation-slider .ant-slider-handle::after {
                    display: none !important;
                }
                model-viewer::part(default-progress-bar) { display: none; }
            `}</style>
        </div>
    );
}
