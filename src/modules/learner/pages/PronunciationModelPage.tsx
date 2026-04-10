import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slider, Tooltip, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Volume2, Play, RotateCcw, Lightbulb, Mouse } from 'lucide-react';
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

/* ─── Main Page ───────────────────────────────────────── */
export default function PronunciationModelPage() {
    const modelRef = useRef<any>(null);
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
        mv.setAttribute('exposure', nudgeRef.current ? '1.5001' : '1.5');
    }, []);

    const updateMorphTarget = useCallback((value: number) => {
        const meshes = morphMeshesRef.current;
        if (!meshes.length) return;
        meshes.forEach((mesh: any) => {
            if (mesh.morphTargetDictionary) {
                const idx = mesh.morphTargetDictionary['L_Position'];
                if (idx !== undefined) { mesh.morphTargetInfluences[idx] = value; return; }
            }
            mesh.morphTargetInfluences[0] = value;
        });
        forceRender();
    }, [forceRender]);

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
        <div className="p-4 lg:py-6 lg:px-8 max-w-4xl mx-auto space-y-4">

            {/* ── Header ── */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Volume2 size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800 leading-none">Mô Hình Phát Âm</h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Khám phá cơ chế tạo âm tiếng Việt 3D</p>
                </div>
            </div>

            {/* ── Sound label card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
                    <span className="text-white text-2xl font-black italic">L</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-800">Âm "L" — Phụ Âm Đầu Lưỡi</h3>
                    <p className="text-sm text-gray-400 font-medium mt-0.5">Đặt đầu lưỡi chạm vào nướu trên rồi bật ra</p>
                </div>
                <Tooltip title="Nhấn nút hướng dẫn để xem chuyển động của lưỡi khi phát âm L">
                    <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-purple-50 hover:border-purple-100 transition-all">
                        <InfoCircleOutlined className="text-gray-400" />
                    </button>
                </Tooltip>
            </div>

            {/* ── 3D Model card ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
                {/* Color accent strip */}
                <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-orange-400 to-amber-400" />

                <div className="relative bg-gray-950 overflow-hidden aspect-[4/3] w-full max-h-[300px] lg:max-h-[340px]">
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <model-viewer
                        ref={(el: any) => {
                            if (el && el !== modelRef.current) {
                                modelRef.current = el;
                                el.addEventListener('load', handleModelLoad);
                            }
                        }}
                        src="/3D/Pronunciation.glb"
                        alt="Mô hình 3D phát âm chữ L"
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
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                            <Mouse size={12} className="text-white/50" />
                            <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Dùng chuột để xoay mô hình</span>
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
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Animation button */}
                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center">
                        <p className="text-[10px] uppercase font-black text-purple-400 tracking-widest">Hướng dẫn tự động</p>
                        <button
                            onClick={handleGuideAnimation}
                            disabled={isAnimating || !modelLoaded}
                            className={clsx(
                                "w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
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
                        <p className="text-[10px] text-purple-300 font-medium">Xem quy trình chuyển động âm L</p>
                    </div>

                    {/* Slider control */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
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
                        <p className="text-[10px] text-gray-400 font-medium text-center">Kéo để quan sát vị trí đầu lưỡi</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Tip card ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex gap-4 items-start"
            >
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb size={18} className="text-orange-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-gray-800 text-sm">Mẹo từ chuyên gia</h4>
                        <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Pro tip</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Để phát âm chữ <strong className="text-purple-600">"L"</strong> chuẩn, hãy đặt đầu lưỡi nhẹ nhàng chạm vào phần nướu phía sau răng cửa trên, rồi bật lưỡi xuống dứt khoát. Luồng hơi sẽ thoát qua hai bên lưỡi tạo ra âm thanh trong và sáng.
                    </p>
                </div>
            </motion.div>

            <style>{`
                .pronunciation-slider .ant-slider-handle::after {
                    display: none !important;
                }
                model-viewer::part(default-progress-bar) { display: none; }
            `}</style>
        </div>
    );
}
