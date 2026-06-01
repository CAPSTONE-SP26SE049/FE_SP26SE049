import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'

/**
 * Viseme data: SVG path definitions for mouth cross-section
 * Each viseme defines positions for: upper lip, lower lip, tongue, jaw opening
 */

interface VisemeState {
    upperLip: string
    lowerLip: string
    tongue: string
    tongueColor?: string
    jawDrop: number // 0-1 how open the mouth is
    label: string
}

const VISEMES: Record<string, VisemeState> = {
    rest: {
        upperLip: 'M 80,178 Q 150,173 220,178',
        lowerLip: 'M 80,208 Q 150,213 220,208',
        tongue: 'M 100,198 C 120,195 140,192 150,192 C 160,192 180,195 200,198 Q 150,196 100,198 Z',
        jawDrop: 0,
        label: 'Nghỉ',
    },
    n: {
        upperLip: 'M 80,177 Q 150,171 220,177',
        lowerLip: 'M 80,210 Q 150,218 220,210',
        tongue: 'M 100,188 C 115,182 135,172 148,168 C 152,167 156,168 160,170 C 175,176 190,184 200,190 Q 150,186 100,188 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.15,
        label: 'N',
    },
    l: {
        upperLip: 'M 80,177 Q 150,171 220,177',
        lowerLip: 'M 80,210 Q 150,220 220,210',
        tongue: 'M 100,190 C 115,184 132,174 147,168 C 153,166 157,167 162,170 C 178,177 192,185 200,192 Q 150,188 100,190 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.2,
        label: 'L',
    },
    s: {
        upperLip: 'M 80,177 Q 150,173 220,177',
        lowerLip: 'M 80,208 Q 150,214 220,208',
        tongue: 'M 100,194 C 118,188 135,182 148,179 C 152,178 156,179 160,180 C 175,184 190,190 200,194 Q 150,192 100,194 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.1,
        label: 'S',
    },
    x: {
        upperLip: 'M 80,177 Q 150,173 220,177',
        lowerLip: 'M 80,208 Q 150,215 220,208',
        tongue: 'M 100,194 C 118,187 135,180 148,177 C 153,176 158,177 162,179 C 177,183 192,190 200,194 Q 150,192 100,194 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.1,
        label: 'X',
    },
    d: {
        upperLip: 'M 80,176 Q 150,170 220,176',
        lowerLip: 'M 80,212 Q 150,222 220,212',
        tongue: 'M 100,192 C 118,184 136,176 148,171 C 153,169 158,170 163,173 C 178,178 192,186 200,192 Q 150,189 100,192 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.25,
        label: 'D',
    },
    gi: {
        upperLip: 'M 80,176 Q 150,170 220,176',
        lowerLip: 'M 80,212 Q 150,221 220,212',
        tongue: 'M 100,193 C 117,185 135,177 148,172 C 153,170 158,171 163,174 C 178,179 192,187 200,194 Q 150,190 100,193 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.22,
        label: 'GI',
    },
    r: {
        upperLip: 'M 80,176 Q 150,169 220,176',
        lowerLip: 'M 80,213 Q 150,225 220,213',
        tongue: 'M 100,195 C 115,188 130,180 142,175 C 148,172 152,170 156,172 C 162,174 168,177 175,181 C 188,187 195,192 200,195 Q 150,192 100,195 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.3,
        label: 'R',
    },
    tr: {
        upperLip: 'M 80,176 Q 150,168 220,176',
        lowerLip: 'M 80,214 Q 150,228 220,214',
        tongue: 'M 100,198 C 112,192 125,184 138,177 C 145,173 150,170 155,170 C 160,171 167,174 175,179 C 188,186 195,193 200,198 Q 150,195 100,198 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.35,
        label: 'TR',
    },
    ch: {
        upperLip: 'M 80,176 Q 150,170 220,176',
        lowerLip: 'M 80,212 Q 150,223 220,212',
        tongue: 'M 100,193 C 117,185 133,178 147,174 C 152,172 157,173 162,175 C 177,180 192,188 200,194 Q 150,190 100,193 Z',
        tongueColor: '#e85d75',
        jawDrop: 0.25,
        label: 'CH',
    },
    // Vowels
    a: {
        upperLip: 'M 80,175 Q 150,167 220,175',
        lowerLip: 'M 80,216 Q 150,235 220,216',
        tongue: 'M 100,203 C 125,200 140,198 150,198 C 160,198 175,200 200,203 Q 150,201 100,203 Z',
        jawDrop: 0.6,
        label: 'A',
    },
    e: {
        upperLip: 'M 80,176 Q 150,170 220,176',
        lowerLip: 'M 80,213 Q 150,226 220,213',
        tongue: 'M 100,197 C 120,190 138,184 148,182 C 153,181 158,182 163,184 C 178,188 192,194 200,197 Q 150,195 100,197 Z',
        jawDrop: 0.35,
        label: 'E',
    },
    i: {
        upperLip: 'M 80,177 Q 150,173 220,177',
        lowerLip: 'M 80,209 Q 150,215 220,209',
        tongue: 'M 100,192 C 118,185 135,178 148,175 C 153,174 158,175 163,177 C 178,181 192,187 200,192 Q 150,189 100,192 Z',
        jawDrop: 0.12,
        label: 'I',
    },
    o: {
        upperLip: 'M 90,176 Q 150,168 210,176',
        lowerLip: 'M 90,214 Q 150,230 210,214',
        tongue: 'M 100,201 C 125,198 140,196 150,196 C 160,196 175,198 200,201 Q 150,199 100,201 Z',
        jawDrop: 0.45,
        label: 'O',
    },
    u: {
        upperLip: 'M 95,177 Q 150,172 205,177',
        lowerLip: 'M 95,211 Q 150,222 205,211',
        tongue: 'M 110,198 C 130,195 142,193 150,193 C 158,193 170,195 190,198 Q 150,196 110,198 Z',
        jawDrop: 0.3,
        label: 'U',
    },
    ư: {
        upperLip: 'M 92,177 Q 150,172 208,177',
        lowerLip: 'M 92,211 Q 150,221 208,211',
        tongue: 'M 105,197 C 122,190 138,184 148,182 C 153,181 158,182 165,184 C 180,188 192,193 200,197 Q 150,194 105,197 Z',
        jawDrop: 0.28,
        label: 'Ư',
    },
    ơ: {
        upperLip: 'M 88,176 Q 150,169 212,176',
        lowerLip: 'M 88,214 Q 150,228 212,214',
        tongue: 'M 100,200 C 125,197 140,195 150,195 C 160,195 175,197 200,200 Q 150,198 100,200 Z',
        jawDrop: 0.4,
        label: 'Ơ',
    },
    ê: {
        upperLip: 'M 85,176 Q 150,171 215,176',
        lowerLip: 'M 85,212 Q 150,224 215,212',
        tongue: 'M 100,196 C 120,189 137,183 148,180 C 153,179 158,180 163,182 C 178,186 192,192 200,196 Q 150,193 100,196 Z',
        jawDrop: 0.3,
        label: 'Ê',
    },
    ô: {
        upperLip: 'M 93,176 Q 150,170 207,176',
        lowerLip: 'M 93,213 Q 150,227 207,213',
        tongue: 'M 105,200 C 125,197 140,195 150,195 C 160,195 175,197 195,200 Q 150,198 105,200 Z',
        jawDrop: 0.38,
        label: 'Ô',
    },
    ă: {
        upperLip: 'M 80,175 Q 150,167 220,175',
        lowerLip: 'M 80,215 Q 150,232 220,215',
        tongue: 'M 100,202 C 125,199 140,197 150,197 C 160,197 175,199 200,202 Q 150,200 100,202 Z',
        jawDrop: 0.5,
        label: 'Ă',
    },
    â: {
        upperLip: 'M 85,176 Q 150,169 215,176',
        lowerLip: 'M 85,214 Q 150,229 215,214',
        tongue: 'M 100,200 C 125,197 140,195 150,195 C 160,195 175,197 200,200 Q 150,198 100,200 Z',
        jawDrop: 0.42,
        label: 'Â',
    },
}

// Vietnamese phoneme mapping: text → viseme sequence
function textToPhonemes(text: string): string[] {
    const normalized = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const phonemes: string[] = []
    let i = 0

    while (i < normalized.length) {
        // Multi-char consonants
        if (i + 1 < normalized.length) {
            const two = normalized.slice(i, i + 2)
            if (two === 'tr') { phonemes.push('tr'); i += 2; continue }
            if (two === 'ch') { phonemes.push('ch'); i += 2; continue }
            if (two === 'gi') { phonemes.push('gi'); i += 2; continue }
            if (two === 'ng' || two === 'nh') { phonemes.push('n'); i += 2; continue }
            if (two === 'kh' || two === 'ph' || two === 'th') { phonemes.push(two[0]); i += 2; continue }
        }

        const ch = normalized[i]
        // Map characters to visemes
        if ('aăâ'.includes(ch)) { phonemes.push('a'); }
        else if (ch === 'e' || ch === 'ê') { phonemes.push('e'); }
        else if (ch === 'i' || ch === 'y') { phonemes.push('i'); }
        else if (ch === 'o' || ch === 'ô') { phonemes.push('o'); }
        else if (ch === 'u') { phonemes.push('u'); }
        else if (ch === 'ư') { phonemes.push('ư'); }
        else if (ch === 'ơ') { phonemes.push('ơ'); }
        else if ('nlsxdr'.includes(ch)) { phonemes.push(ch); }
        else if (ch === ' ') { phonemes.push('rest'); }
        // Skip other consonants that don't have distinct visemes
        i++
    }

    return phonemes.length > 0 ? phonemes : ['rest']
}

// Get original text phonemes (preserving diacritics for display)
function textToVisemeKeys(text: string): string[] {
    const lower = text.toLowerCase()
    const phonemes: string[] = []
    let i = 0

    while (i < lower.length) {
        if (i + 1 < lower.length) {
            const two = lower.slice(i, i + 2)
            if (['tr', 'ch', 'gi', 'ng', 'nh', 'kh', 'ph', 'th'].includes(two)) {
                if (two === 'tr' || two === 'ch' || two === 'gi') phonemes.push(two)
                else if (two === 'ng' || two === 'nh') phonemes.push('n')
                else phonemes.push(two[0])
                i += 2; continue
            }
        }

        const ch = lower[i]
        const normalized = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')

        if ('aăâ'.includes(normalized) || 'aăâ'.includes(ch)) phonemes.push('a')
        else if (normalized === 'e' || ch === 'ê') phonemes.push('e')
        else if (normalized === 'i' || ch === 'y') phonemes.push('i')
        else if (normalized === 'o' || ch === 'ô') phonemes.push('o')
        else if (normalized === 'u' || ch === 'u') phonemes.push('u')
        else if (ch === 'ư') phonemes.push('ư')
        else if (ch === 'ơ') phonemes.push('ơ')
        else if ('nlsxdr'.includes(ch)) phonemes.push(ch)
        else if (ch === ' ') phonemes.push('rest')

        i++
    }

    return phonemes.length > 0 ? phonemes : ['rest']
}

export type FaceType = 'child' | 'adult' | 'elderly'

interface MouthVisemeProps {
    viseme: string
    progress?: number // 0-1 for manual control
    className?: string
    faceType?: FaceType
}

const MouthViseme: React.FC<MouthVisemeProps> = ({ viseme, progress = 1, className = '', faceType = 'child' }) => {
    const currentViseme = VISEMES[viseme] || VISEMES.rest
    const jawOffset = currentViseme.jawDrop * 35 * progress

    const faceConfig = {
        child: {
            skinFrom: '#ffe8d6', skinTo: '#fcd5b8', skinStroke: '#e8b89a',
            eyeSize: 22, pupilSize: 10, blushOpacity: 0.6,
        },
        adult: {
            skinFrom: '#f5dcc8', skinTo: '#e8c4a8', skinStroke: '#d4a080',
            eyeSize: 18, pupilSize: 9, blushOpacity: 0.3,
        },
        elderly: {
            skinFrom: '#f0ddd0', skinTo: '#e0c8b5', skinStroke: '#c8a890',
            eyeSize: 16, pupilSize: 8, blushOpacity: 0.2,
        },
    }

    const fc = faceConfig[faceType]

    return (
        <div className={`relative ${className}`}>
            <svg viewBox="20 30 260 260" className="w-full h-full">
                <defs>
                    <radialGradient id="cavityGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1a0808" />
                        <stop offset="100%" stopColor="#0d0505" />
                    </radialGradient>
                    <radialGradient id="tongueGrad" cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#f07088" />
                        <stop offset="100%" stopColor={currentViseme.tongueColor || '#d94f6a'} />
                    </radialGradient>
                    <linearGradient id="lipGradUpper" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#d4757a" />
                        <stop offset="100%" stopColor="#c0555e" />
                    </linearGradient>
                    <linearGradient id="lipGradLower" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c85560" />
                        <stop offset="100%" stopColor="#b04550" />
                    </linearGradient>
                    <radialGradient id="faceGrad" cx="50%" cy="40%" r="55%">
                        <stop offset="0%" stopColor={fc.skinFrom} />
                        <stop offset="100%" stopColor={fc.skinTo} />
                    </radialGradient>
                    <radialGradient id="eyeWhite" cx="45%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f0f0f0" />
                    </radialGradient>
                    <radialGradient id="pupilGrad" cx="40%" cy="35%" r="50%">
                        <stop offset="0%" stopColor="#3d2c2c" />
                        <stop offset="100%" stopColor="#1a1010" />
                    </radialGradient>
                    <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffb0b0" stopOpacity={fc.blushOpacity} />
                        <stop offset="100%" stopColor="#ffb0b0" stopOpacity="0" />
                    </radialGradient>
                    <filter id="softShadow">
                        <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
                    </filter>
                </defs>

                {/* === Face === */}
                <ellipse cx="150" cy="165" rx="105" ry="110" fill="url(#faceGrad)" stroke={fc.skinStroke} strokeWidth="2" />

                {/* === Curly hair === */}
                {faceType === 'child' && (
                    <g>
                        <path d="M 95,78 Q 90,65 96,60 Q 104,55 108,64 Q 110,70 106,76" fill="none" stroke="#5a3825" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 112,70 Q 110,57 117,52 Q 126,48 128,58 Q 129,65 124,70" fill="none" stroke="#5a3825" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 135,66 Q 134,53 142,48 Q 150,45 152,55 Q 152,62 148,67" fill="none" stroke="#5a3825" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 158,66 Q 158,53 165,48 Q 174,45 175,55 Q 175,63 171,68" fill="none" stroke="#5a3825" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 180,70 Q 182,57 189,52 Q 198,48 198,60 Q 196,68 192,73" fill="none" stroke="#5a3825" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 105,82 Q 100,72 105,67 Q 111,63 114,70 Q 115,76 112,80" fill="none" stroke="#6b4430" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 172,72 Q 175,60 181,56 Q 188,54 187,64 Q 186,70 183,74" fill="none" stroke="#6b4430" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 145,63 Q 143,52 148,48 Q 154,45 156,53 Q 156,60 153,64" fill="none" stroke="#6b4430" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                )}
                {faceType === 'adult' && (
                    <g>
                        <path d="M 80,80 Q 85,55 110,50 Q 140,46 150,48 Q 160,46 190,50 Q 215,55 220,80" fill="none" stroke="#3d2518" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 90,75 Q 95,58 115,54 Q 135,50 150,52" fill="none" stroke="#3d2518" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 150,52 Q 165,50 185,54 Q 205,58 210,75" fill="none" stroke="#3d2518" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 100,68 Q 105,60 115,58" fill="none" stroke="#4a2e1c" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 185,58 Q 195,60 200,68" fill="none" stroke="#4a2e1c" strokeWidth="2" strokeLinecap="round" />
                    </g>
                )}
                {faceType === 'elderly' && (
                    <g>
                        <path d="M 85,78 Q 90,55 115,50 Q 140,47 150,48 Q 160,47 185,50 Q 210,55 215,78" fill="none" stroke="#a0a0a0" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 95,72 Q 100,58 120,54 Q 140,51 150,52" fill="none" stroke="#b0b0b0" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 150,52 Q 160,51 180,54 Q 200,58 205,72" fill="none" stroke="#b0b0b0" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 108,68 Q 112,60 120,58" fill="none" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 180,58 Q 188,60 192,68" fill="none" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" />
                    </g>
                )}

                {/* === Ears === */}
                <ellipse cx="52" cy="145" rx="14" ry="18" fill={fc.skinTo} stroke={fc.skinStroke} strokeWidth="1.5" />
                <ellipse cx="52" cy="145" rx="8" ry="11" fill={fc.skinFrom} opacity="0.5" />
                <ellipse cx="248" cy="145" rx="14" ry="18" fill={fc.skinTo} stroke={fc.skinStroke} strokeWidth="1.5" />
                <ellipse cx="248" cy="145" rx="8" ry="11" fill={fc.skinFrom} opacity="0.5" />

                {/* === Wrinkles (elderly only) === */}
                {faceType === 'elderly' && (
                    <g opacity="0.3">
                        <path d="M 90,100 Q 95,97 100,100" fill="none" stroke="#a08070" strokeWidth="1" strokeLinecap="round" />
                        <path d="M 200,100 Q 205,97 210,100" fill="none" stroke="#a08070" strokeWidth="1" strokeLinecap="round" />
                        <path d="M 100,230 Q 120,235 140,232" fill="none" stroke="#a08070" strokeWidth="0.8" strokeLinecap="round" />
                        <path d="M 160,232 Q 180,235 200,230" fill="none" stroke="#a08070" strokeWidth="0.8" strokeLinecap="round" />
                        <path d="M 120,145 Q 125,143 130,145" fill="none" stroke="#a08070" strokeWidth="0.6" strokeLinecap="round" />
                        <path d="M 170,145 Q 175,143 180,145" fill="none" stroke="#a08070" strokeWidth="0.6" strokeLinecap="round" />
                    </g>
                )}

                {/* === Eyebrows === */}
                <motion.path
                    animate={viseme !== 'rest' ? { d: 'M 95,88 Q 112,82 130,86' } : { d: 'M 95,90 Q 112,85 130,89' }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    fill="none" stroke={faceType === 'elderly' ? '#909090' : '#8b6050'} strokeWidth={faceType === 'elderly' ? 2.5 : 3} strokeLinecap="round"
                />
                <motion.path
                    animate={viseme !== 'rest' ? { d: 'M 170,86 Q 188,82 205,88' } : { d: 'M 170,89 Q 188,85 205,90' }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    fill="none" stroke={faceType === 'elderly' ? '#909090' : '#8b6050'} strokeWidth={faceType === 'elderly' ? 2.5 : 3} strokeLinecap="round"
                />

                {/* === Eyes === */}
                {/* Left eye */}
                <ellipse cx="112" cy="115" rx={fc.eyeSize * 0.9} ry={fc.eyeSize} fill="url(#eyeWhite)" stroke="#c09080" strokeWidth="1.5" />
                <motion.ellipse
                    cx={112} cy={117}
                    animate={{ rx: fc.pupilSize, ry: viseme !== 'rest' ? fc.pupilSize + 1 : fc.pupilSize }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    fill="url(#pupilGrad)"
                />
                <circle cx="107" cy="111" r={faceType === 'child' ? 4 : 3} fill="white" opacity="0.9" />
                <circle cx="115" cy="119" r="2" fill="white" opacity="0.5" />
                {faceType === 'child' && (
                    <>
                        <path d="M 93,105 Q 96,100 100,103" fill="none" stroke="#8b6050" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 124,103 Q 128,100 131,105" fill="none" stroke="#8b6050" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                )}
                {faceType === 'elderly' && (
                    <path d="M 94,120 Q 112,125 130,120" fill="none" stroke="#b09080" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
                )}

                {/* Right eye */}
                <ellipse cx="188" cy="115" rx={fc.eyeSize * 0.9} ry={fc.eyeSize} fill="url(#eyeWhite)" stroke="#c09080" strokeWidth="1.5" />
                <motion.ellipse
                    cx={188} cy={117}
                    animate={{ rx: fc.pupilSize, ry: viseme !== 'rest' ? fc.pupilSize + 1 : fc.pupilSize }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    fill="url(#pupilGrad)"
                />
                <circle cx="183" cy="111" r={faceType === 'child' ? 4 : 3} fill="white" opacity="0.9" />
                <circle cx="191" cy="119" r="2" fill="white" opacity="0.5" />
                {faceType === 'child' && (
                    <>
                        <path d="M 169,105 Q 172,100 176,103" fill="none" stroke="#8b6050" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 200,103 Q 204,100 207,105" fill="none" stroke="#8b6050" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                )}
                {faceType === 'elderly' && (
                    <path d="M 170,120 Q 188,125 206,120" fill="none" stroke="#b09080" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
                )}

                {/* === Glasses (adult only) === */}
                {faceType === 'adult' && (
                    <g>
                        <circle cx="112" cy="115" r="24" fill="none" stroke="#3d3d3d" strokeWidth="2" />
                        <circle cx="188" cy="115" r="24" fill="none" stroke="#3d3d3d" strokeWidth="2" />
                        <path d="M 136,115 Q 150,120 164,115" fill="none" stroke="#3d3d3d" strokeWidth="2" />
                        <path d="M 88,112 Q 70,110 55,115" fill="none" stroke="#3d3d3d" strokeWidth="1.5" />
                        <path d="M 212,112 Q 230,110 245,115" fill="none" stroke="#3d3d3d" strokeWidth="1.5" />
                    </g>
                )}

                {/* === Blush (cheeks) === */}
                <ellipse cx="80" cy="165" rx="18" ry="12" fill="url(#blushGrad)" />
                <ellipse cx="220" cy="165" rx="18" ry="12" fill="url(#blushGrad)" />

                {/* === Nose === */}
                <ellipse cx="150" cy="150" rx="7" ry="5" fill="#f0b8a0" stroke="#e0a088" strokeWidth="1" />
                <circle cx="146" cy="152" r="2.5" fill="#e8a890" opacity="0.6" />
                <circle cx="154" cy="152" r="2.5" fill="#e8a890" opacity="0.6" />

                {/* === MOUTH AREA === */}

                {/* Dark mouth cavity */}
                <motion.ellipse
                    cx={150}
                    animate={{ cy: 198 + jawOffset * 0.3, ry: 8 + jawOffset * 0.6, rx: 38 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                    fill="url(#cavityGrad)"
                />

                {/* Tongue - clipped to mouth area only */}
                <clipPath id="mouthClip">
                    <rect x="90" y="178" width="120" height="40" />
                </clipPath>
                <motion.path
                    clipPath="url(#mouthClip)"
                    animate={{ d: currentViseme.tongue, y: jawOffset * 0.35 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 12 }}
                    fill="url(#tongueGrad)"
                    stroke="#b84058"
                    strokeWidth="1.2"
                    filter="url(#softShadow)"
                />

                {/* Upper teeth - small, inside mouth */}
                <g opacity="0.7">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <rect
                            key={`upper-${i}`}
                            x={118 + i * 11}
                            y={183}
                            width={8}
                            height={6}
                            rx={1.5}
                            fill="#fafaf5"
                            stroke="#e0dcd5"
                            strokeWidth="0.5"
                        />
                    ))}
                </g>

                {/* Lower teeth - small, inside mouth */}
                <motion.g
                    opacity={0.7}
                    animate={{ y: jawOffset * 0.6 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                >
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <rect
                            key={`lower-${i}`}
                            x={119 + i * 11}
                            y={200}
                            width={8}
                            height={5}
                            rx={1.5}
                            fill="#fafaf5"
                            stroke="#e0dcd5"
                            strokeWidth="0.5"
                        />
                    ))}
                </motion.g>

                {/* Upper lip */}
                <motion.path
                    animate={{ d: currentViseme.upperLip }}
                    transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                    fill="url(#lipGradUpper)"
                    stroke="#903848"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Lower lip */}
                <motion.path
                    animate={{ d: currentViseme.lowerLip, y: jawOffset }}
                    transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                    fill="url(#lipGradLower)"
                    stroke="#903848"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Airflow arrows for nasal sounds */}
                {(viseme === 'n') && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.3 }}
                    >
                        <path d="M 150,160 Q 148,155 147,148" fill="none" stroke="#49B6E5" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arrowhead)" />
                        <defs>
                            <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                                <path d="M 0,0 L 5,2.5 L 0,5 Z" fill="#49B6E5" />
                            </marker>
                        </defs>
                    </motion.g>
                )}
            </svg>
        </div>
    )
}

// Exported hook for word animation
export function useWordAnimation() {
    const [currentViseme, setCurrentViseme] = useState('rest')
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(-1)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

    const playWord = useCallback((word: string, speed = 400) => {
        // Clear previous
        timeoutRef.current.forEach(t => clearTimeout(t))
        timeoutRef.current = []

        const phonemes = textToVisemeKeys(word)

        // Always start from rest so the transition is visible
        setIsPlaying(true)
        setCurrentPhonemeIndex(-1)
        setCurrentViseme('rest')

        phonemes.forEach((phoneme, idx) => {
            const t = setTimeout(() => {
                setCurrentViseme(phoneme)
                setCurrentPhonemeIndex(idx)
            }, (idx + 1) * speed)
            timeoutRef.current.push(t)
        })

        // End
        const endT = setTimeout(() => {
            setCurrentViseme('rest')
            setIsPlaying(false)
            setCurrentPhonemeIndex(-1)
        }, (phonemes.length + 1) * speed + 300)
        timeoutRef.current.push(endT)
    }, [])

    const stop = useCallback(() => {
        timeoutRef.current.forEach(t => clearTimeout(t))
        timeoutRef.current = []
        setCurrentViseme('rest')
        setIsPlaying(false)
        setCurrentPhonemeIndex(-1)
    }, [])

    useEffect(() => {
        return () => { timeoutRef.current.forEach(t => clearTimeout(t)) }
    }, [])

    return { currentViseme, isPlaying, currentPhonemeIndex, playWord, stop }
}

export { MouthViseme, textToVisemeKeys, VISEMES }
export type { VisemeState }
export default MouthViseme
