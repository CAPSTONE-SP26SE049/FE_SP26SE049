import React from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Table } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { DIFFICULTY_CONFIG, SKILL_CONFIG } from './constants';

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
  onBankSelectionChange: (keys: string[]) => void;
  onImportFileChange: (file: File | null) => void;
  onImportStart: () => void;
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
  onBankSelectionChange,
  onImportFileChange,
  onImportStart,
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
        title="Thêm bài kiểm tra"
        open={isCreateQuizModalOpen}
        onCancel={onCloseQuiz}
        onOk={onSubmitQuiz}
        confirmLoading={creatingQuiz}
      >
        <Form form={quizForm} layout="vertical" onFinish={onQuizFinish}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="instructions" label="Hướng dẫn">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="passingScore" label="Điểm đạt (%)" rules={[{ required: true }]} initialValue={80}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeLimitMinutes" label="Thời gian (phút)" initialValue={15}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="skillType" label="Kỹ năng" rules={[{ required: true }]}>
            <Select options={Object.entries(SKILL_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="difficultyTag" label="Độ khó" initialValue="BEGINNER">
            <Select options={Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="pointsPerQuestion" label="Điểm mỗi câu" initialValue={10}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
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
