import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slider, Button, Tooltip, Spin } from 'antd';
import {
    SoundOutlined,
    PlayCircleOutlined,
    InfoCircleOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import '@google/model-viewer';

// Declare the model-viewer custom element for TypeScript
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

/**
 * Finds Three.js meshes with morph targets inside a model-viewer element.
 * model-viewer stores its internal Three.js scene as a Symbol property.
 * We traverse the element's own Symbol properties to find the scene,
 * then traverse the scene graph to locate meshes with morphTargetInfluences.
 */
function findMorphTargetsInViewer(viewer: any): { meshes: any[]; sceneObj: any } {
    const result = { meshes: [] as any[], sceneObj: null as any };
    if (!viewer) return result;

    // Search through all Symbol properties on the model-viewer element
    for (const sym of Object.getOwnPropertySymbols(viewer)) {
        try {
            const val = viewer[sym];
            if (!val || typeof val !== 'object') continue;

            // Look for a Three.js Object3D-like structure
            // ModelScene has a .model property which is a Three.js Group
            let traverseTarget = null;

            if (val.model && typeof val.model.traverse === 'function') {
                // This is the ModelScene; val.model is the Three.js root Group
                traverseTarget = val.model;
                result.sceneObj = val;
            } else if (typeof val.traverse === 'function' && val.isObject3D) {
                // Direct Three.js Object3D
                traverseTarget = val;
                result.sceneObj = val;
            }

            if (traverseTarget) {
                traverseTarget.traverse((node: any) => {
                    if (node.isMesh && node.morphTargetInfluences && node.morphTargetInfluences.length > 0) {
                        result.meshes.push(node);
                    }
                });
                if (result.meshes.length > 0) break;
            }
        } catch (e) {
            // Skip inaccessible symbols
        }
    }

    return result;
}

export default function PronunciationModelPage() {
    const navigate = useNavigate();
    const modelRef = useRef<any>(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const animationRef = useRef<number | null>(null);
    const morphMeshesRef = useRef<any[]>([]);
    const sceneObjRef = useRef<any>(null);
    const nudgeRef = useRef(false);

    // Clean up animation frame on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Force model-viewer to re-render after morph target changes
    const forceRender = useCallback(() => {
        const mv = modelRef.current;
        if (!mv) return;

        // Method 1: Call queueRender on the internal ModelScene
        const scene = sceneObjRef.current;
        if (scene && typeof scene.queueRender === 'function') {
            scene.queueRender();
            return;
        }

        // Method 2: Try to find needsRender symbol on the element
        for (const sym of Object.getOwnPropertySymbols(mv)) {
            try {
                if (typeof mv[sym] === 'function' && sym.toString().includes('needsRender')) {
                    mv[sym]();
                    return;
                }
            } catch (e) { }
        }

        // Method 3: Nudge the exposure attribute to trigger a re-render
        nudgeRef.current = !nudgeRef.current;
        mv.setAttribute('exposure', nudgeRef.current ? '1.2001' : '1.2');
    }, []);

    // Update morph target value on all found meshes
    const updateMorphTarget = useCallback((value: number) => {
        const meshes = morphMeshesRef.current;
        if (meshes.length === 0) return;

        meshes.forEach((mesh: any) => {
            // Try to find the L_Position shape key by name first
            if (mesh.morphTargetDictionary) {
                const idx = mesh.morphTargetDictionary['L_Position'];
                if (idx !== undefined) {
                    mesh.morphTargetInfluences[idx] = value;
                    return;
                }
            }
            // Fallback: set the first morph target
            mesh.morphTargetInfluences[0] = value;
        });

        forceRender();
    }, [forceRender]);

    // Initialize morph target references after model loads
    const initMorphTargets = useCallback(() => {
        const mv = modelRef.current;
        if (!mv) return;

        const { meshes, sceneObj } = findMorphTargetsInViewer(mv);
        morphMeshesRef.current = meshes;
        sceneObjRef.current = sceneObj;

        console.log(`[PronunciationModel] Found ${meshes.length} meshes with morph targets`);
        meshes.forEach((mesh: any, i: number) => {
            console.log(`  Mesh ${i}: "${mesh.name}"`, {
                dictionary: mesh.morphTargetDictionary,
                influences: Array.from(mesh.morphTargetInfluences),
            });
        });
    }, []);

    const handleSliderChange = useCallback(
        (value: number) => {
            if (isAnimating) return;
            const normalizedValue = value / 100;
            setSliderValue(value);
            updateMorphTarget(normalizedValue);
        },
        [isAnimating, updateMorphTarget]
    );

    const handleGuideAnimation = useCallback(() => {
        if (isAnimating) return;
        if (morphMeshesRef.current.length === 0) {
            console.warn('[PronunciationModel] No morph target meshes found, cannot animate');
            return;
        }
        setIsAnimating(true);

        // Phase 1: Animate from 0 → 1 in 0.5s
        const riseDuration = 500; // ms
        const holdDuration = 1000; // ms
        const fallDuration = 500; // ms

        let startTime: number | null = null;

        const animateRise = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / riseDuration, 1);
            // Smooth easing (ease-out cubic)
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            updateMorphTarget(easedProgress);
            setSliderValue(Math.round(easedProgress * 100));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animateRise);
            } else {
                // Phase 2: Hold at 1 for 1 second
                setTimeout(() => {
                    startTime = null;
                    animationRef.current = requestAnimationFrame(animateFall);
                }, holdDuration);
            }
        };

        const animateFall = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);
            // Smooth easing (ease-in cubic reverse)
            const easedProgress = Math.pow(1 - progress, 3);

            updateMorphTarget(easedProgress);
            setSliderValue(Math.round(easedProgress * 100));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animateFall);
            } else {
                updateMorphTarget(0);
                setSliderValue(0);
                setIsAnimating(false);
            }
        };

        // Start from 0
        updateMorphTarget(0);
        setSliderValue(0);
        animationRef.current = requestAnimationFrame(animateRise);
    }, [isAnimating, updateMorphTarget]);

    const handleModelLoad = useCallback(() => {
        // Delay slightly to ensure Three.js internals are fully initialized
        setTimeout(() => {
            initMorphTargets();
            setModelLoaded(true);
        }, 200);
    }, [initMorphTargets]);

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 font-nunito relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                >
                    Quay lại
                </Button>
            </div>

            <div className="flex items-center gap-6 mb-8">
                <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green to-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(88,204,2,0.4)]"
                >
                    <SoundOutlined className="text-white text-3xl" />
                </motion.div>
                <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl leading-none">
                        Mô Hình <span className="text-brand-green">Phát Âm</span>
                    </h2>
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2">KHÁM PHÁ CƠ CHẾ TẠO ÂM TIẾNG VIỆT</p>
                </div>
            </div>

            {/* Main Content */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
                    {/* Sound Label Header */}
                    <div className="bg-gradient-to-r from-brand-green/20 to-teal-500/20 px-10 py-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand-green shadow-[0_0_20px_rgba(88,204,2,0.4)] flex items-center justify-center border border-white/20">
                                <span className="text-white text-3xl font-black italic">L</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tight uppercase mb-1">Âm "L" — Phụ Âm Đầu Lưỡi</h3>
                                <p className="text-white/40 text-[11px] font-black uppercase tracking-widest leading-none">Đặt đầu lưỡi chạm vào nướu trên rồi bật ra</p>
                            </div>
                        </div>
                        <Tooltip title="Nhấn nút hướng dẫn bên dưới để xem chuyển động của lưỡi khi phát âm L">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-help hover:bg-white/10 transition-all group">
                                <InfoCircleOutlined className="text-white/20 text-xl group-hover:text-white transition-colors" />
                            </div>
                        </Tooltip>
                    </div>

                    {/* 3D Model Viewer Container */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none z-[1]" />

                        <div className="w-full h-[520px] bg-black/40 flex items-center justify-center relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none" />

                            <model-viewer
                                ref={(el: any) => {
                                    if (el && el !== modelRef.current) {
                                        modelRef.current = el;
                                        el.addEventListener('load', handleModelLoad);
                                    }
                                }}
                                src="/models/mieng_phat_am_L.glb"
                                alt="Mô hình 3D phát âm chữ L"
                                camera-controls
                                shadow-intensity="1"
                                exposure="1.5"
                                camera-orbit="0deg 85deg 0.35m"
                                field-of-view="35deg"
                                interaction-prompt="auto"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    outline: 'none',
                                    '--poster-color': 'transparent',
                                } as React.CSSProperties}
                            />

                            {/* Interaction Hint */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 opacity-40 group-hover:opacity-100 transition-all text-white/60 text-[9px] font-black uppercase tracking-widest pointer-events-none z-10">
                                Dùng chuột để xoay mô hình 3D
                            </div>

                            {/* Loading overlay */}
                            {!modelLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl z-20">
                                    <Spin size="large" />
                                    <div className="mt-6 text-white/30 font-black uppercase text-[10px] tracking-[0.4em]">Đang đồng bộ thực tế ảo...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls & Info Section */}
                    <div className="px-10 py-12 bg-white/2 backdrop-blur-xl space-y-10">
                        {/* Action Row */}
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            {/* Guide Card */}
                            <div className="flex-1 w-full">
                                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center text-center relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 blur-3xl rounded-full -mr-16 -mt-16" />

                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<PlayCircleOutlined className="text-xl" />}
                                        onClick={handleGuideAnimation}
                                        disabled={isAnimating || !modelLoaded}
                                        className={clsx(
                                            "h-20 px-12 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] italic border-none shadow-2xl transition-all relative overflow-hidden",
                                            isAnimating
                                                ? "bg-white/10 text-white/20"
                                                : "bg-brand-green hover:bg-brand-green transform hover:scale-105 active:scale-95 shadow-brand-green/20"
                                        )}
                                    >
                                        <span className="relative z-10">{isAnimating ? 'Đang mô phỏng...' : 'Kích hoạt hướng dẫn'}</span>
                                        {!isAnimating && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                        )}
                                    </Button>
                                    <p className="mt-6 text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">Xem quy trình chuyển động của âm L</p>
                                </motion.div>
                            </div>

                            {/* Manual Settings */}
                            <div className="flex-[1.5] w-full">
                                <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <div className="w-1 h-3 bg-brand-green rounded-full shadow-[0_0_8px_#58cc02]" />
                                            Điều chỉnh thủ công
                                        </h4>
                                        <div className="text-3xl font-black italic text-brand-green drop-shadow-[0_0_10px_rgba(88,204,2,0.3)]">{sliderValue}%</div>
                                    </div>

                                    <div className="flex items-center gap-6 mb-4">
                                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest min-w-[50px]">Xuống</div>
                                        <Slider
                                            min={0}
                                            max={100}
                                            value={sliderValue}
                                            onChange={handleSliderChange}
                                            disabled={isAnimating || !modelLoaded}
                                            tooltip={{ open: false }}
                                            className="flex-1 pronunciation-slider"
                                            styles={{
                                                track: { background: '#58cc02', height: 8, boxShadow: '0 0 15px rgba(88,204,2,0.5)' },
                                                rail: { background: 'rgba(255,255,255,0.05)', height: 8 },
                                                handle: { width: 24, height: 24, background: 'white', border: 'none', boxShadow: '0 0 20px rgba(0,0,0,0.5)', marginTop: -8 }
                                            }}
                                        />
                                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest min-w-[50px] text-right">Lên</div>
                                    </div>
                                    <p className="text-center text-white/30 text-[9px] font-black uppercase tracking-[0.1em] mt-6">Kéo thanh trượt để quan sát vị trí đầu lưỡi</p>
                                </div>
                            </div>
                        </div>

                        {/* Pro Tip Card */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="bg-gradient-to-r from-brand-green/10 via-brand-green/20 to-brand-green/10 p-10 rounded-[2.5rem] border border-brand-green/20 flex gap-8 items-start relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-brand-green shadow-[0_0_20px_#58cc02]" />
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
                                <InfoCircleOutlined className="text-brand-green text-3xl" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-white italic tracking-tight uppercase mb-3 flex items-center gap-2">
                                    Mẹo từ chuyên gia
                                    <div className="px-2 py-0.5 bg-brand-green text-white text-[8px] font-black tracking-widest rounded-full shadow-lg">SECRET TIP</div>
                                </h4>
                                <p className="text-white/60 text-sm font-medium leading-relaxed italic">
                                    "Để phát âm chữ 'L' chuẩn, hãy đặt đầu lưỡi nhẹ nhàng chạm vào phần nướu phía sau răng cửa trên, rồi bật lưỡi xuống dứt khoát. Luồng hơi sẽ thoát qua hai bên lưỡi tạo ra một âm thanh trong và sáng."
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .pronunciation-slider .ant-slider-handle:after {
                    background: #58cc02 !important;
                    box-shadow: 0 0 10px rgba(88, 204, 2, 0.5) !important;
                }
                model-viewer::part(default-progress-bar) {
                    display: none;
                }
                .ant-tooltip-inner {
                    border-radius: 12px !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    padding: 8px 16px !important;
                    background: rgba(0,0,0,0.85) !important;
                    backdrop-filter: blur(8px) !important;
                }
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                model-viewer {
                  --progress-bar-color: #667eea;
                }
            `}</style>
        </div>
    );
}
