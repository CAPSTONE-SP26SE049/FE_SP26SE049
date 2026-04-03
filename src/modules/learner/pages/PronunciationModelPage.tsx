import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Typography, Card, Slider, Button, Tooltip } from 'antd';
import {
    SoundOutlined,
    PlayCircleOutlined,
    InfoCircleOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '@google/model-viewer';

const { Title, Text } = Typography;

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
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="text-gray-500 hover:text-gray-800 font-medium"
                >
                    Quay lại
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                    <SoundOutlined className="text-white text-2xl" />
                </div>
                <div>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#4b4b4b' }}>
                        Mô Hình Phát Âm
                    </Title>
                    <Text className="text-gray-500">
                        Khám phá cách đặt lưỡi khi phát âm các âm tiếng Việt.
                    </Text>
                </div>
            </div>

            {/* Main Content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card
                    className="rounded-3xl shadow-sm border-gray-100 overflow-hidden"
                    bodyStyle={{ padding: 0 }}
                >
                    {/* Sound Label */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '16px 28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white text-xl font-black">L</span>
                            </div>
                            <div>
                                <Text className="text-white font-bold text-lg block" style={{ lineHeight: 1.2 }}>
                                    Âm "L" — Phụ Âm Đầu Lưỡi
                                </Text>
                                <Text className="text-white/70 text-sm">
                                    Đặt đầu lưỡi chạm vào nướu trên rồi bật ra
                                </Text>
                            </div>
                        </div>
                        <Tooltip title="Nhấn nút hướng dẫn bên dưới để xem chuyển động của lưỡi khi phát âm L">
                            <InfoCircleOutlined className="text-white/60 text-xl cursor-help hover:text-white transition-colors" />
                        </Tooltip>
                    </div>

                    {/* 3D Model Viewer */}
                    <div
                        style={{
                            width: '100%',
                            height: '480px',
                            background: 'linear-gradient(180deg, #f8f9ff 0%, #eef0f8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
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
                            shadow-intensity="0.5"
                            exposure="1.2"
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

                        {/* Loading overlay */}
                        {!modelLoaded && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(248,249,255,0.9)',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 5,
                                }}
                            >
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        border: '4px solid #e0e7ff',
                                        borderTopColor: '#667eea',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                <Text className="text-gray-400 mt-3 font-medium">Đang tải mô hình 3D...</Text>
                            </div>
                        )}
                    </div>

                    {/* Controls Section */}
                    <div
                        style={{
                            padding: '24px 32px 32px',
                            background: '#fff',
                            borderTop: '1px solid #f0f0f0',
                        }}
                    >
                        {/* Guide Button */}
                        <div className="flex items-center justify-center mb-8">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<PlayCircleOutlined />}
                                    onClick={handleGuideAnimation}
                                    disabled={isAnimating || !modelLoaded}
                                    style={{
                                        background: isAnimating
                                            ? '#d1d5db'
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        height: 52,
                                        paddingInline: 36,
                                        borderRadius: 16,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        boxShadow: isAnimating ? 'none' : '0 8px 24px rgba(102, 126, 234, 0.35)',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {isAnimating ? 'Đang phát...' : 'Hướng Dẫn Âm L'}
                                </Button>
                            </motion.div>
                        </div>

                        {/* Manual Slider */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                                borderRadius: 20,
                                padding: '20px 28px 16px',
                                border: '1px solid #e9e5f5',
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Text className="text-gray-600 font-semibold text-sm">
                                    🎛️ Điều chỉnh thủ công
                                </Text>
                                <Text className="text-gray-400 text-xs">
                                    Kéo thanh trượt để di chuyển lưỡi
                                </Text>
                            </div>
                            <div className="flex items-center gap-4">
                                <Text className="text-xs text-gray-400 font-medium min-w-[36px]">Xuống</Text>
                                <Slider
                                    min={0}
                                    max={100}
                                    value={sliderValue}
                                    onChange={handleSliderChange}
                                    disabled={isAnimating || !modelLoaded}
                                    tooltip={{
                                        formatter: (val) => `${val}%`,
                                    }}
                                    style={{ flex: 1 }}
                                    styles={{
                                        track: {
                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                        },
                                        rail: {
                                            background: '#ddd6fe',
                                        },
                                    }}
                                />
                                <Text className="text-xs text-gray-400 font-medium min-w-[24px]">Lên</Text>
                            </div>
                            <div className="text-center mt-1">
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {sliderValue}%
                                </Text>
                            </div>
                        </div>

                        {/* Info tip */}
                        <div
                            style={{
                                marginTop: 20,
                                padding: '12px 20px',
                                borderRadius: 14,
                                background: '#fffbeb',
                                border: '1px solid #fef3c7',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                            }}
                        >
                            <InfoCircleOutlined className="text-amber-500 mt-1" />
                            <div>
                                <Text className="text-amber-800 text-sm font-semibold block">Mẹo phát âm</Text>
                                <Text className="text-amber-700 text-xs">
                                    Để phát âm chữ "L" chuẩn, hãy đặt đầu lưỡi nhẹ nhàng chạm vào phần nướu phía sau răng cửa
                                    trên, rồi bật lưỡi xuống khi phát âm. Luồng hơi thoát qua hai bên lưỡi tạo ra âm "L".
                                </Text>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* CSS for loading spinner */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        model-viewer {
          --progress-bar-color: #667eea;
        }
        model-viewer::part(default-progress-bar) {
          display: none;
        }
      `}</style>
        </div>
    );
}
