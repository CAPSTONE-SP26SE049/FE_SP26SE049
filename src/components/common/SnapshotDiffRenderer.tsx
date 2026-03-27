import React from 'react';
import DiffViewer from './DiffViewer';

interface SnapshotRendererProps {
    oldSnapshot: any;
    newSnapshot: any;
    contentType: 'CHALLENGE' | 'LEVEL' | string;
}

export const SnapshotDiffRenderer: React.FC<SnapshotRendererProps> = ({ oldSnapshot, newSnapshot, contentType }) => {
    if (!newSnapshot) return null;

    const renderRow = (label: string, oldValue: any, newValue: any, diffType: 'words' | 'chars' = 'words') => {
        const oV = oldValue == null ? '' : String(oldValue);
        const nV = newValue == null ? '' : String(newValue);
        if (oV === nV && !nV) return null; // hide empty unchanged

        return (
            <div className="mb-2 text-sm">
                <div className="text-gray-500 font-medium mb-1">{label}:</div>
                {oV === nV ? (
                    <div className="text-gray-700 bg-gray-50 px-2 py-1 rounded">{nV}</div>
                ) : (
                    <div className="bg-white border border-gray-200 px-2 py-1 rounded">
                        <DiffViewer oldText={oV} newText={nV} type={diffType} />
                    </div>
                )}
            </div>
        );
    };

    if (contentType === 'CHALLENGE') {
        const renderPhonemes = (oldP: any, newP: any) => {
            const oStr = Array.isArray(oldP) ? oldP.join(', ') : oldP;
            const nStr = Array.isArray(newP) ? newP.join(', ') : newP;
            return renderRow('Âm vị', oStr, nStr, 'words');
        };

        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-inner">
                {renderRow('Nội dung (Text)', oldSnapshot?.contentText, newSnapshot?.contentText, 'words')}
                {renderRow('Phiên âm IPA', oldSnapshot?.phoneticTranscriptionIpa, newSnapshot?.phoneticTranscriptionIpa, 'chars')}
                {renderPhonemes(oldSnapshot?.focusPhonemes, newSnapshot?.focusPhonemes)}
                {renderRow('Audio URL', oldSnapshot?.referenceAudioUrl, newSnapshot?.referenceAudioUrl, 'words')}
            </div>
        );
    }

    if (contentType === 'LEVEL') {
        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-inner">
                {renderRow('Tên học phần', oldSnapshot?.name || oldSnapshot?.title, newSnapshot?.name || newSnapshot?.title, 'words')}
                {renderRow('Mô tả', oldSnapshot?.description, newSnapshot?.description, 'words')}
                {renderRow('Thứ tự', oldSnapshot?.levelOrder, newSnapshot?.levelOrder, 'words')}
                {renderRow('Số sao tối thiểu', oldSnapshot?.minStarsRequired, newSnapshot?.minStarsRequired, 'words')}
                {renderRow('Ngưỡng AI', oldSnapshot?.aiThreshold, newSnapshot?.aiThreshold, 'words')}
                {renderRow('Error Tag', oldSnapshot?.errorTag?.name, newSnapshot?.errorTag?.name, 'words')}
                {renderRow('Audio URL', oldSnapshot?.audioUrl, newSnapshot?.audioUrl, 'words')}
            </div>
        );
    }

    return null;
};

export default SnapshotDiffRenderer;
