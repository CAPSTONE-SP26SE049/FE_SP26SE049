import React from 'react';
import { Divider, Tag, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { DIFFICULTY_CONFIG, SKILL_CONFIG } from './constants';
import { getRegionLabel } from './regionUtils';

const { Text, Title } = Typography;

function metaOf(ch: any): Record<string, any> {
  return (ch?.metadataJson ?? ch?.metadata_json ?? {}) as Record<string, any>;
}

function nonEmptyStr(v: unknown): string {
  if (v == null) return '';
  const s = String(v).trim();
  return s;
}

type Props = {
  challenge: any;
};

/**
 * Hiển thị đề bài / metadata theo kỹ năng (đồng bộ logic xem nhanh với kho thử thách educator).
 */
export function ChallengeDetailPreview({ challenge }: Props) {
  if (!challenge) return null;

  const meta = metaOf(challenge);
  const skill = challenge.skillType ?? challenge.skill_type;
  const diff = challenge.difficultyTag ?? challenge.difficulty_tag;
  const skillCfg = skill ? SKILL_CONFIG[skill] : null;
  const diffCfg = diff ? DIFFICULTY_CONFIG[diff] : null;

  const audioUrl =
    meta.audioUrl ?? meta.audio_url ?? meta.referenceAudioUrl ?? meta.reference_audio_url;
  const options = meta.options;
  const correctAnswer = meta.correctAnswer ?? meta.correct_answer;
  const words = meta.words;
  const errorIdx = meta.error_index ?? meta.errorIndex;
  const correctWord = meta.correct_word ?? meta.correctWord;
  const scrambled = meta.scrambledWords ?? meta.scrambled_words;
  const correctSentence = meta.correctSentence ?? meta.correct_sentence;
  const transcript = meta.transcript;

  const descriptionText = nonEmptyStr(meta.description);
  const hintText = nonEmptyStr(meta.hint);
  const instructionsText = nonEmptyStr(meta.instructions);
  const noteText = nonEmptyStr(meta.note);
  const instructionsDistinct = instructionsText && instructionsText !== hintText ? instructionsText : '';

  const hasGuidanceBlock =
    Boolean(descriptionText || hintText || instructionsDistinct || noteText);

  return (
    <div style={{ padding: '4px 0 8px' }}>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
          Yêu cầu / nội dung câu
        </Text>
        <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
          {challenge.contentText ?? '—'}
        </Title>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px', marginBottom: 16 }}>
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Kỹ năng
          </Text>
          {skillCfg ? <Tag color={skillCfg.color}>{skillCfg.label}</Tag> : <Tag>{skill || '—'}</Tag>}
        </div>
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Độ khó
          </Text>
          {diffCfg ? <Tag color={diffCfg.color}>{diffCfg.label}</Tag> : <Tag>{diff || '—'}</Tag>}
        </div>
        {(challenge.region || meta.region) && (
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Vùng miền
            </Text>
            <Tag>{getRegionLabel(challenge.region ?? meta.region)}</Tag>
          </div>
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div
        style={{
          background: '#fafafa',
          padding: 16,
          borderRadius: 10,
          border: '1px solid #f0f0f0',
        }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 14, fontSize: 15 }}>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          Câu hỏi & đáp án
        </Title>

        {hasGuidanceBlock && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e6f4ff',
            }}
          >
            {descriptionText ? (
              <div style={{ marginBottom: hintText || instructionsDistinct || noteText ? 12 : 0 }}>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>
                  Mô tả
                </Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{descriptionText}</Text>
              </div>
            ) : null}
            {hintText ? (
              <div style={{ marginBottom: instructionsDistinct || noteText ? 12 : 0 }}>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>
                  Gợi ý
                </Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{hintText}</Text>
              </div>
            ) : null}
            {instructionsDistinct ? (
              <div style={{ marginBottom: noteText ? 12 : 0 }}>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>
                  Hướng dẫn
                </Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{instructionsDistinct}</Text>
              </div>
            ) : null}
            {noteText ? (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>
                  Ghi chú
                </Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{noteText}</Text>
              </div>
            ) : null}
          </div>
        )}

        {skill === 'READING' && (
          <>
            {Array.isArray(words) && words.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <Text strong>Các từ trong câu</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {words.map((word: string, idx: number) => (
                    <Tag key={idx} color={idx === errorIdx ? 'error' : 'default'} style={{ padding: '4px 10px' }}>
                      {word}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {correctWord != null && correctWord !== '' && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Từ viết đúng
                </Text>
                <Text type="success" strong style={{ fontSize: 15 }}>
                  {correctWord}
                </Text>
              </div>
            )}
          </>
        )}

        {skill === 'LISTENING' && (
          <>
            {audioUrl && (
              <div style={{ marginBottom: 14 }}>
                <Text strong>Âm thanh</Text>
                <div style={{ marginTop: 6 }}>
                  <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '100%' }} />
                </div>
              </div>
            )}
            {Array.isArray(options) && options.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <Text strong>Lựa chọn</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {options.map((opt: string, idx: number) => (
                    <Tag key={idx} color={opt === correctAnswer ? 'success' : 'default'} style={{ padding: '4px 10px' }}>
                      {opt}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {correctAnswer != null && correctAnswer !== '' && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    Đáp án đúng
                  </Text>
                  <Text type="success" strong>
                    {String(correctAnswer)}
                  </Text>
                </div>
              )}
              {transcript && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    Transcript
                  </Text>
                  <Text italic>{transcript}</Text>
                </div>
              )}
            </div>
          </>
        )}

        {skill === 'WRITING' && (
          <>
            {Array.isArray(scrambled) && scrambled.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <Text strong>Từ xáo trộn</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {scrambled.map((w: string, idx: number) => (
                    <Tag key={idx} style={{ background: '#fff', border: '1px dashed #d9d9d9' }}>
                      {w}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {correctSentence != null && correctSentence !== '' && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Câu đúng
                </Text>
                <Text type="success" strong style={{ fontSize: 15 }}>
                  {correctSentence}
                </Text>
              </div>
            )}
          </>
        )}

        {(skill === 'SPEAKING' || skill === 'ENTRY_TEST') && (
          <>
            {audioUrl && (
              <div style={{ marginBottom: 14 }}>
                <Text strong>Âm thanh mẫu</Text>
                <div style={{ marginTop: 6 }}>
                  <audio controls src={audioUrl} style={{ width: '100%' }} />
                </div>
              </div>
            )}
            {transcript && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Nội dung cần nói
                </Text>
                <Text type="success" strong style={{ fontSize: 15 }}>
                  {transcript}
                </Text>
              </div>
            )}
          </>
        )}

        {!['READING', 'LISTENING', 'WRITING', 'SPEAKING', 'ENTRY_TEST'].includes(skill) && (
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Dữ liệu chi tiết (metadata)
            </Text>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: '#fff',
                borderRadius: 8,
                border: '1px solid #eee',
                fontSize: 12,
                maxHeight: 280,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
