import React from 'react';
import { Button, Col, Divider, Form, Input, InputNumber, Modal, Row, Select, Table, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { ChallengeDetailPreview } from './ChallengeDetailPreview';
import { DIFFICULTY_CONFIG, SKILL_CONFIG } from './constants';

const { Text } = Typography;

const quizModalSectionTitle = (title: string, subtitle?: string) => (
  <div style={{ marginBottom: 12 }}>
    <Text strong style={{ fontSize: 14, color: 'rgba(0,0,0,0.88)' }}>
      {title}
    </Text>
    {subtitle ? (
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
        {subtitle}
      </Text>
    ) : null}
  </div>
);

const quizFormItemMb = { marginBottom: 16 };

/** Khớp cột `name` (255) và metadata text trên BE. */
const QUIZ_TITLE_MAX = 255;
const QUIZ_DESCRIPTION_MAX = 2000;
const QUIZ_INSTRUCTIONS_MAX = 4000;
const TIME_LIMIT_MAX_MINUTES = 999;

const quizTitleRules = [
  { required: true },
  {
    validator: (_: unknown, v: string) => {
      const s = typeof v === 'string' ? v.trim() : '';
      if (!s) return Promise.reject(new Error('Tiêu đề không được để trống'));
      if (s.length > QUIZ_TITLE_MAX) {
        return Promise.reject(new Error(`Tiêu đề tối đa ${QUIZ_TITLE_MAX} ký tự`));
      }
      return Promise.resolve();
    },
  },
];

const optionalTextMax = (max: number, label: string) => [
  {
    validator: (_: unknown, v: string) => {
      if (v == null || v === '') return Promise.resolve();
      if (String(v).length > max) {
        return Promise.reject(new Error(`${label} tối đa ${max} ký tự`));
      }
      return Promise.resolve();
    },
  },
];

type ChapterManagementModalsProps = {
  dialects: any[];
  form: FormInstance;
  editForm: FormInstance;
  quizForm: FormInstance;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isCreateQuizModalOpen: boolean;
  isChallengeModalOpen: boolean;
  isImportModalOpen: boolean;
  creating: boolean;
  updating: boolean;
  creatingQuiz: boolean;
  loadingBank: boolean;
  importing: boolean;
  importFile: File | null;
  selectedBankIds: string[];
  availableChallenges: any[];
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseQuiz: () => void;
  onCloseChallenge: () => void;
  onCloseImport: () => void;
  onSubmitCreate: () => void;
  onSubmitEdit: () => void;
  onSubmitQuiz: () => void;
  onSubmitChallenge: () => void;
  onCreateFinish: (values: any) => void;
  onEditFinish: (values: any) => void;
  onQuizFinish: (values: any) => void;
  /** Tiêu đề modal quiz (thêm / sửa). */
  quizModalTitle?: string;
  onBankSelectionChange: (keys: string[]) => void;
  onImportFileChange: (file: File | null) => void;
  onImportStart: () => void;
  /** Xem nhanh thử thách (câu hỏi & đáp án) từ màn chi tiết quiz. */
  challengePreview: any | null;
  onCloseChallengePreview: () => void;
};

export function ChapterManagementModals({
  dialects,
  form,
  editForm,
  quizForm,
  isCreateModalOpen,
  isEditModalOpen,
  isCreateQuizModalOpen,
  isChallengeModalOpen,
  isImportModalOpen,
  creating,
  updating,
  creatingQuiz,
  loadingBank,
  importing,
  importFile,
  selectedBankIds,
  availableChallenges,
  onCloseCreate,
  onCloseEdit,
  onCloseQuiz,
  onCloseChallenge,
  onCloseImport,
  onSubmitCreate,
  onSubmitEdit,
  onSubmitQuiz,
  onSubmitChallenge,
  onCreateFinish,
  onEditFinish,
  onQuizFinish,
  quizModalTitle = 'Thêm bài kiểm tra',
  onBankSelectionChange,
  onImportFileChange,
  onImportStart,
  challengePreview,
  onCloseChallengePreview,
}: ChapterManagementModalsProps) {
  return (
    <>
      <Modal
        title="Thêm học phần"
        open={isCreateModalOpen}
        onCancel={onCloseCreate}
        onOk={onSubmitCreate}
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical" onFinish={onCreateFinish}>
          <Form.Item name="name" label="Tên học phần" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dialectId" label="Phương ngữ" rules={[{ required: true }]}>
            <Select options={dialects.map((d: any) => ({ value: d.id, label: d.name }))} />
          </Form.Item>
          <Form.Item name="minStarsRequired" label="Sao yêu cầu" initialValue={3}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa học phần"
        open={isEditModalOpen}
        onCancel={onCloseEdit}
        onOk={onSubmitEdit}
        confirmLoading={updating}
      >
        <Form form={editForm} layout="vertical" onFinish={onEditFinish}>
          <Form.Item name="name" label="Tên học phần" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dialectId" label="Phương ngữ" rules={[{ required: true }]}>
            <Select options={dialects.map((d: any) => ({ value: d.id, label: d.name }))} />
          </Form.Item>
          <Form.Item name="minStarsRequired" label="Sao yêu cầu">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={quizModalTitle}
        open={isCreateQuizModalOpen}
        onCancel={onCloseQuiz}
        onOk={onSubmitQuiz}
        confirmLoading={creatingQuiz}
        width={820}
        centered
        destroyOnHidden
        getContainer={() => document.body}
        mousePosition={null}
        rootStyle={{ margin: 0 }}
        styles={{
          wrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          root: {
            top: 0,
            paddingBottom: 0,
            maxWidth: 'calc(100vw - 24px)',
          },
          body: {
            maxHeight: 'min(78vh, 720px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 8px 4px',
          },
          footer: {
            marginTop: 0,
            paddingTop: 12,
            paddingBottom: 16,
            paddingInline: 24,
            borderTop: '1px solid #f0f0f0',
          },
        }}
      >
        <div
          style={{
            background: '#fafafa',
            borderRadius: 10,
            padding: '18px 20px 6px',
            border: '1px solid #f0f0f0',
          }}
        >
          <Form form={quizForm} layout="vertical" size="middle" requiredMark onFinish={onQuizFinish}>
            {quizModalSectionTitle('Thông tin chung', 'Tên hiển thị trên danh sách bài kiểm tra')}
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={quizTitleRules}
              style={quizFormItemMb}
              extra={
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="link"
                    className="!px-0"
                    onClick={() => quizForm.setFieldsValue({ title: 'Source code' })}
                  >
                    Source code
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tối đa {QUIZ_TITLE_MAX} ký tự
                  </Text>
                </div>
              }
            >
              <Input placeholder="Ví dụ: Kiểm tra cuối chương — Đọc hiểu" maxLength={QUIZ_TITLE_MAX} allowClear />
            </Form.Item>

            <Divider style={{ margin: '4px 0 16px' }} />

            {quizModalSectionTitle('Nội dung hiển thị', 'Mô tả và hướng dẫn cho người làm bài (tùy chọn nhưng nên có)')}
            <Row gutter={[20, 0]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                  rules={optionalTextMax(QUIZ_DESCRIPTION_MAX, 'Mô tả')}
                  style={quizFormItemMb}
                >
                  <Input.TextArea
                    placeholder="Giới thiệu ngắn về bài kiểm tra"
                    rows={3}
                    maxLength={QUIZ_DESCRIPTION_MAX}
                    showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="instructions"
                  label="Hướng dẫn"
                  rules={optionalTextMax(QUIZ_INSTRUCTIONS_MAX, 'Hướng dẫn')}
                  style={quizFormItemMb}
                >
                  <Input.TextArea
                    placeholder="Cách làm bài, lưu ý thời gian, quy tắc chấm…"
                    rows={3}
                    maxLength={QUIZ_INSTRUCTIONS_MAX}
                    showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '4px 0 16px' }} />

            {quizModalSectionTitle('Cấu hình làm bài', 'Ngưỡng đạt, thời gian và điểm mỗi câu')}
            <Row gutter={[20, 0]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="passingScore"
                  label="Điểm đạt (%)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập điểm đạt' },
                    { type: 'number', min: 0, max: 100, message: 'Giá trị từ 0 đến 100' },
                  ]}
                  initialValue={80}
                  style={quizFormItemMb}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0 – 100" controls />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="timeLimitMinutes"
                  label="Thời gian (phút)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập thời gian' },
                    {
                      type: 'number',
                      min: 1,
                      max: TIME_LIMIT_MAX_MINUTES,
                      message: `Từ 1 đến ${TIME_LIMIT_MAX_MINUTES} phút`,
                    },
                  ]}
                  initialValue={15}
                  style={quizFormItemMb}
                >
                  <InputNumber min={1} max={TIME_LIMIT_MAX_MINUTES} style={{ width: '100%' }} placeholder="Phút" controls />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="pointsPerQuestion"
                  label="Điểm mỗi câu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập điểm mỗi câu' },
                    { type: 'number', min: 1, max: 999, message: 'Từ 1 đến 999' },
                  ]}
                  initialValue={10}
                  style={quizFormItemMb}
                >
                  <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="1 – 999" controls />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '4px 0 16px' }} />

            {quizModalSectionTitle('Phân loại', 'Kỹ năng và mức độ — dùng để lọc và báo cáo')}
            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="skillType"
                  label="Kỹ năng"
                  rules={[{ required: true, message: 'Chọn kỹ năng' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder="Chọn kỹ năng"
                    allowClear={false}
                    options={Object.entries(SKILL_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="difficultyTag"
                  label="Độ khó"
                  rules={[{ required: true, message: 'Chọn độ khó' }]}
                  initialValue="BEGINNER"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder="Chọn độ khó"
                    allowClear={false}
                    options={Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      <Modal
        title="Ngân hàng thử thách"
        open={isChallengeModalOpen}
        onCancel={onCloseChallenge}
        width={800}
        onOk={onSubmitChallenge}
      >
        <Table
          rowSelection={{
            selectedRowKeys: selectedBankIds,
            onChange: (keys) => onBankSelectionChange(keys as string[]),
          }}
          dataSource={availableChallenges}
          columns={[
            { title: 'Nội dung', dataIndex: 'contentText' },
            { title: 'Loại', dataIndex: 'type' },
          ]}
          rowKey="id"
          loading={loadingBank}
          pagination={{ pageSize: 15 }}
        />
      </Modal>

      <Modal
        title="Chi tiết thử thách — câu hỏi & đáp án"
        open={!!challengePreview}
        onCancel={onCloseChallengePreview}
        footer={
          <Button type="primary" onClick={onCloseChallengePreview}>
            Đóng
          </Button>
        }
        width={720}
        centered
        destroyOnHidden
        getContainer={() => document.body}
        mousePosition={null}
        styles={{
          body: { maxHeight: 'min(80vh, 720px)', overflowY: 'auto', paddingTop: 8 },
        }}
      >
        {challengePreview ? <ChallengeDetailPreview challenge={challengePreview} /> : null}
      </Modal>

      <Modal title="Import học phần" open={isImportModalOpen} onCancel={onCloseImport} footer={null}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="file" accept=".csv" onChange={(e) => onImportFileChange(e.target.files?.[0] || null)} />
          <Button type="primary" loading={importing} onClick={onImportStart}>
            Bắt đầu Import
          </Button>
        </div>
      </Modal>
    </>
  );
}
