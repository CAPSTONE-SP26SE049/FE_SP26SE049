import React from 'react';
import * as diff from 'diff';

interface DiffViewerProps {
    oldText?: string | null;
    newText?: string | null;
    type?: 'words' | 'chars' | 'sentences';
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText = '', newText = '', type = 'words' }) => {
    const sOld = String(oldText || '');
    const sNew = String(newText || '');

    if (sOld === sNew) {
        return <span className="text-gray-600">{sNew || <i>(trống)</i>}</span>;
    }

    let diffObj;
    if (type === 'chars') {
        diffObj = diff.diffChars(sOld, sNew);
    } else if (type === 'sentences') {
        diffObj = diff.diffSentences(sOld, sNew);
    } else {
        diffObj = diff.diffWords(sOld, sNew);
    }

    return (
        <div className="diff-viewer inline-block leading-relaxed whitespace-pre-wrap font-sans">
            {diffObj.map((part, index) => {
                const colorClass = part.added
                    ? 'bg-green-100 text-green-800 font-semibold px-1 py-0.5 rounded mx-0.5'
                    : part.removed
                        ? 'bg-red-100 text-red-800 line-through px-1 py-0.5 rounded mx-0.5 opacity-70'
                        : 'text-gray-800';
                return (
                    <span key={index} className={colorClass}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );
};

export default DiffViewer;
