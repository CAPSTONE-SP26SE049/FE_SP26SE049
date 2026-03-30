import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, message } from 'antd';
import { adminService } from '../services/adminService';
import { ChapterManagementModals } from './chapter-management/ChapterManagementModals';
import {
  ChapterListView,
  QuizDetailView,
  QuizListView,
} from './chapter-management/ChapterManagementViews';
import { createQuizColumns } from './chapter-management/chapterManagementColumns';
import { getRegionKeyFromDialect, getRegionLabel } from './chapter-management/regionUtils';
import type { LevelStat } from './chapter-management/aggregateLevelStats';
import { mergeEngagementIntoLevelStats } from './chapter-management/aggregateLevelStats';

const AdminChapterManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [viewMode, setViewMode] = useState<'CHAPTERS' | 'QUIZZES' | 'QUIZ_DETAIL'>('CHAPTERS');
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

  const [levels, setLevels] = useState<any[]>([]);
  const [dialects, setDialects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<any | null>(null);

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [quizChallenges, setQuizChallenges] = useState<any[]>([]);
  const [loadingQuizChallenges, setLoadingQuizChallenges] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [availableChallenges, setAvailableChallenges] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [challengePreview, setChallengePreview] = useState<any | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [quizForm] = Form.useForm();

  const [searchText, setSearchText] = useState('');

  const filterRegion = useMemo(() => {
    const r = searchParams.get('region');
    return r === 'BAC' || r === 'TRUNG' || r === 'NAM' ? r : undefined;
  }, [searchParams]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const [levelStats, setLevelStats] = useState<Record<string, LevelStat>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const refreshLevelStats = useCallback(async () => {
    if (levels.length === 0) {
      setLevelStats({});
      return;
    }
    setStatsLoading(true);
    try {
      const [countsOutcome, engagementOutcome] = await Promise.allSettled([
        adminService.getLevelQuizCounts(),
        adminService.getLevelEngagementStats(),
      ]);

      const countByLevel: Record<string, number> = {};
      if (countsOutcome.status === 'fulfilled') {
        const wrap: any = countsOutcome.value;
        const rows: any[] = Array.isArray(wrap?.data) ? wrap.data : [];
        for (const row of rows) {
          const lid = row?.levelId != null ? String(row.levelId) : '';
          if (!lid) continue;
          countByLevel[lid] = Number(row.quizCount ?? row.quiz_count ?? 0);
        }
      }

      const base: Record<string, LevelStat> = {};
      for (const level of levels) {
        const key = String(level.id);
        base[key] = {
          quizCount: countByLevel[key] ?? 0,
          learnerCount: 0,
          successRate: 0,
          failRate: 0,
        };
      }

      let engagement: {
        levelId: string;
        learnerCount: number;
        successRate: number;
        failRate: number;
      }[] = [];
      if (engagementOutcome.status === 'fulfilled') {
        const engBody = engagementOutcome.value?.data;
        const engagementList: any[] = Array.isArray(engBody)
          ? engBody
          : Array.isArray(engBody?.data)
            ? engBody.data
            : [];
        engagement = engagementList.map((row: any) => ({
          levelId: String(row.levelId ?? ''),
          learnerCount: Number(row.learnerCount ?? 0),
          successRate: Math.min(100, Math.max(0, Number(row.successRate ?? 0))),
          failRate: Math.min(100, Math.max(0, Number(row.failRate ?? 0))),
        }));
      }

      setLevelStats(mergeEngagementIntoLevelStats(base, engagement));
    } catch {
      setLevelStats({});
    } finally {
      setStatsLoading(false);
    }
  }, [levels]);

  useEffect(() => {
    fetchLevels();
    fetchDialects();
  }, []);

  useEffect(() => {
    refreshLevelStats();
  }, [refreshLevelStats]);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response = await adminService.getLevels();
      setLevels(response.data || []);
    } catch (error) {
      messageApi.error('Không thể tải danh sách học phần');
    } finally {
      setLoading(false);
    }
  };

  const fetchDialects = async () => {
    try {
      const response = await adminService.getDialects();
      setDialects(response.data || []);
    } catch (error) {
      console.error('Lỗi tải phương ngữ:', error);
    }
  };

  const fetchQuizzes = async (chapterId: string) => {
    setLoadingQuizzes(true);
    try {
      const response = await adminService.getQuizzesByLevel(chapterId);
      if (response?.status === 'error') {
        messageApi.error(response?.message || 'Không thể tải danh sách bài kiểm tra');
        setQuizzes([]);
        return;
      }
      const raw = response?.data;
      const list: any[] = Array.isArray(raw) ? raw : [];
      setQuizzes(
        list.map((q) => {
          const meta = (q.metadata_json ?? q.metadataJson ?? {}) as Record<string, any>;
          const firstNonEmpty = (...vals: unknown[]) => {
            for (const v of vals) {
              if (v == null) continue;
              const s = String(v).trim();
              if (s) return s;
            }
            return '';
          };
          const description = firstNonEmpty(q.description, meta.description);
          const instructions = firstNonEmpty(q.instructions, meta.instructions);
          const passingRaw = q.passingScore ?? q.passing_score ?? meta.passing_score;
          const timeRaw = q.timeLimitMinutes ?? q.time_limit_minutes ?? meta.time_limit_minutes;
          const passingScore =
            passingRaw != null && passingRaw !== '' && !Number.isNaN(Number(passingRaw))
              ? Number(passingRaw)
              : undefined;
          const timeLimitMinutes =
            timeRaw != null && timeRaw !== '' && !Number.isNaN(Number(timeRaw)) ? Number(timeRaw) : undefined;
          const qcRaw = q.questionCount ?? q.question_count ?? meta.question_count ?? meta.questionCount;
          const questionsArr = q.questions;
          let questionCount: number | undefined;
          if (qcRaw != null && qcRaw !== '' && !Number.isNaN(Number(qcRaw))) {
            questionCount = Number(qcRaw);
          } else if (Array.isArray(questionsArr) && questionsArr.length > 0) {
            questionCount = questionsArr.length;
          }
          return {
            ...q,
            id: q.id != null ? String(q.id) : q.id,
            title: firstNonEmpty(q.title, q.name) || '—',
            description,
            instructions,
            passingScore,
            timeLimitMinutes,
            questionCount,
            skillType: q.skillType ?? q.skill_type ?? meta.skill_type,
            difficultyTag: q.difficultyTag ?? q.difficulty ?? meta.difficulty,
          };
        })
      );
    } catch (error) {
      messageApi.error('Không thể tải danh sách bài kiểm tra (kiểm tra backend đang chạy và đăng nhập admin)');
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchQuizChallenges = async (quizId: string) => {
    setLoadingQuizChallenges(true);
    try {
      const response = await adminService.getQuizChallenges(quizId);
      setQuizChallenges(response.data || []);
    } catch (error) {
      messageApi.error('Không thể tải danh sách thử thách');
    } finally {
      setLoadingQuizChallenges(false);
    }
  };

  const getRegionKey = useCallback(
    (dialectId: string) => getRegionKeyFromDialect(dialectId, dialects),
    [dialects]
  );

  const fetchChallengeBank = async (skillType: string) => {
    setLoadingBank(true);
    try {
      const region = getRegionKey(selectedChapter?.dialectId);
      const levelId = selectedChapter?.id;
      const response = await adminService.getChallengeBank(skillType, region, levelId);

      const existingIds = new Set(
        quizChallenges
          .map((c: any) => c.challenge?.id ?? c.challengeId ?? c.id)
          .filter(Boolean)
      );
      const available = (response.data || []).filter((c: any) => c.id && !existingIds.has(c.id));

      setAvailableChallenges(available);
    } catch (error) {
      messageApi.error('Không thể tải ngân hàng thử thách');
    } finally {
      setLoadingBank(false);
    }
  };

  const handleCreateLevel = async (values: any) => {
    setCreating(true);
    try {
      await adminService.createLevel({
        ...values,
        levelOrder: levels.length + 1,
        status: 'APPROVED',
      });
      messageApi.success('Đã thêm học phần mới');
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchLevels();
    } catch (error) {
      messageApi.error('Lỗi khi thêm học phần');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLevel = async (values: any) => {
    if (!selectedLevel) return;
    setUpdating(true);
    try {
      await adminService.updateLevel(selectedLevel.id, values);
      messageApi.success('Đã cập nhật học phần');
      setIsEditModalOpen(false);
      fetchLevels();
    } catch (error) {
      messageApi.error('Lỗi khi cập nhật học phần');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    try {
      await adminService.deleteLevel(id);
      messageApi.success('Đã xóa học phần');
      fetchLevels();
    } catch (error) {
      messageApi.error('Lỗi khi xóa học phần');
    }
  };

  const handleQuizSubmit = async (values: any) => {
    if (!selectedChapter) return;
    setCreatingQuiz(true);
    const payload = {
      levelId: selectedChapter.id,
      title: String(values.title ?? '').trim(),
      description: values.description != null ? String(values.description).trim() : undefined,
      instructions: values.instructions != null ? String(values.instructions).trim() : undefined,
      passingScore: values.passingScore ?? 80,
      timeLimitMinutes: values.timeLimitMinutes ?? 15,
      skillType: values.skillType,
      difficulty: values.difficultyTag ?? 'BEGINNER',
      questionCount: values.questionCount ?? editingQuiz?.questionCount ?? 0,
      pointsPerQuestion: values.pointsPerQuestion ?? 10,
      comment: values.comment ?? (editingQuiz ? 'Cập nhật quiz từ admin' : 'Tạo quiz từ admin'),
    };
    try {
      if (editingQuiz) {
        await adminService.updateQuiz(editingQuiz.id, payload);
        messageApi.success('Đã cập nhật bài kiểm tra');
      } else {
        await adminService.createQuiz(payload);
        messageApi.success('Đã thêm bài kiểm tra mới');
      }
      setIsCreateQuizModalOpen(false);
      setEditingQuiz(null);
      quizForm.resetFields();
      fetchQuizzes(selectedChapter.id);
      void refreshLevelStats();
    } catch (error) {
      messageApi.error(editingQuiz ? 'Lỗi khi cập nhật bài kiểm tra' : 'Lỗi khi thêm bài kiểm tra');
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await adminService.deleteQuiz(quizId);
      messageApi.success('Đã xóa bài kiểm tra');
      if (selectedChapter) fetchQuizzes(selectedChapter.id);
      void refreshLevelStats();
    } catch (error) {
      messageApi.error('Lỗi khi xóa bài kiểm tra');
    }
  };

  const handleAssignChallenges = async () => {
    if (!selectedQuiz || selectedBankIds.length === 0) return;
    setLoadingBank(true);
    try {
      await adminService.assignChallengesToQuiz(selectedQuiz.id, selectedBankIds);
      messageApi.success(`Đã thêm ${selectedBankIds.length} thử thách`);
      setIsChallengeModalOpen(false);
      setSelectedBankIds([]);
      fetchQuizChallenges(selectedQuiz.id);
      if (selectedChapter) fetchQuizzes(selectedChapter.id);
      void refreshLevelStats();
    } catch (error) {
      messageApi.error('Lỗi khi gán thử thách');
    } finally {
      setLoadingBank(false);
    }
  };

  const handleRemoveChallenge = async (challengeId: string) => {
    if (!selectedQuiz) return;
    try {
      await adminService.removeChallengeFromQuiz(selectedQuiz.id, challengeId);
      messageApi.success('Đã gỡ thử thách');
      fetchQuizChallenges(selectedQuiz.id);
      if (selectedChapter) fetchQuizzes(selectedChapter.id);
      void refreshLevelStats();
    } catch (error) {
      messageApi.error('Lỗi khi gỡ thử thách');
    }
  };

  const handleViewChallenge = useCallback((record: any) => {
    const ch = record?.challenge ?? record;
    setChallengePreview(ch ?? null);
  }, []);

  const handleCloseChallengePreview = useCallback(() => setChallengePreview(null), []);

  const filteredLevels = useMemo(() => {
    let data = [...levels];
    if (searchText) {
      data = data.filter((l) => (l.name || '').toLowerCase().includes(searchText.toLowerCase()));
    }
    if (filterRegion) {
      data = data.filter((l) => getRegionKey(l.dialectId) === filterRegion);
    }
    return data;
  }, [levels, searchText, filterRegion, getRegionKey]);

  const quizColumns = useMemo(
    () =>
      createQuizColumns({
        onOpenQuizDetail: (record) => {
          setSelectedQuiz(record);
          setSelectedLevel(selectedChapter);
          setViewMode('QUIZ_DETAIL');
          fetchQuizChallenges(record.id);
        },
        onEditQuiz: (record) => {
          setEditingQuiz(record);
          quizForm.setFieldsValue({
            title: record.title,
            description: record.description,
            instructions: record.instructions,
            passingScore: record.passingScore ?? 80,
            timeLimitMinutes: record.timeLimitMinutes ?? 15,
            skillType: record.skillType,
            difficultyTag: record.difficultyTag ?? record.difficulty ?? 'BEGINNER',
            pointsPerQuestion: record.pointsPerQuestion ?? 10,
          });
          setIsCreateQuizModalOpen(true);
        },
        onDeleteQuiz: handleDeleteQuiz,
      }),
    [selectedChapter, fetchQuizChallenges, handleDeleteQuiz, quizForm]
  );

  return (
    <>
      {contextHolder}
      <div
        style={{
          padding: viewMode === 'QUIZ_DETAIL' ? '8px 20px 20px' : '24px',
        }}
      >
        {viewMode === 'CHAPTERS' && (
          <ChapterListView
            searchText={searchText}
            onSearchChange={setSearchText}
            regionBadgeLabel={filterRegion ? getRegionLabel(filterRegion) : undefined}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOpenCreateChapter={() => setIsCreateModalOpen(true)}
            filteredLevels={filteredLevels}
            loading={loading}
            getRegionKey={getRegionKey}
            onOpenQuizzes={(record) => {
              setSelectedChapter(record);
              setViewMode('QUIZZES');
              fetchQuizzes(record.id);
            }}
            onEditChapter={(record) => {
              setSelectedLevel(record);
              editForm.setFieldsValue({
                name: record.name,
                dialectId: record.dialectId,
                description: record.metadata_json?.description || record.description,
                minStarsRequired: record.metadata_json?.min_stars_required || record.minStarsRequired,
              });
              setIsEditModalOpen(true);
            }}
            onDeleteLevel={handleDeleteLevel}
            levelStats={levelStats}
            statsLoading={statsLoading}
          />
        )}
        {viewMode === 'QUIZZES' && (
          <QuizListView
            chapterName={selectedChapter?.name}
            onBack={() => setViewMode('CHAPTERS')}
            onOpenCreateQuiz={() => {
              setEditingQuiz(null);
              quizForm.resetFields();
              setIsCreateQuizModalOpen(true);
            }}
            quizzes={quizzes}
            quizColumns={quizColumns}
            loadingQuizzes={loadingQuizzes}
          />
        )}
        {viewMode === 'QUIZ_DETAIL' && (
          <QuizDetailView
            quizTitle={selectedQuiz?.title ?? selectedQuiz?.name}
            quizDescription={selectedQuiz?.description}
            quizInstructions={selectedQuiz?.instructions}
            quizSkillType={selectedQuiz?.skillType}
            quizDifficultyTag={selectedQuiz?.difficultyTag ?? selectedQuiz?.difficulty}
            quizPassingScore={selectedQuiz?.passingScore}
            quizTimeLimitMinutes={selectedQuiz?.timeLimitMinutes}
            onBack={() => setViewMode('QUIZZES')}
            onOpenChallengeBank={() => {
              fetchChallengeBank(selectedQuiz?.skillType);
              setIsChallengeModalOpen(true);
            }}
            quizChallenges={quizChallenges}
            loadingQuizChallenges={loadingQuizChallenges}
            onViewChallenge={handleViewChallenge}
            onRemoveChallenge={handleRemoveChallenge}
          />
        )}

        <ChapterManagementModals
          dialects={dialects}
          form={form}
          editForm={editForm}
          quizForm={quizForm}
          isCreateModalOpen={isCreateModalOpen}
          isEditModalOpen={isEditModalOpen}
          isCreateQuizModalOpen={isCreateQuizModalOpen}
          isChallengeModalOpen={isChallengeModalOpen}
          isImportModalOpen={isImportModalOpen}
          creating={creating}
          updating={updating}
          creatingQuiz={creatingQuiz}
          loadingBank={loadingBank}
          importing={importing}
          importFile={importFile}
          selectedBankIds={selectedBankIds}
          availableChallenges={availableChallenges}
          onCloseCreate={() => setIsCreateModalOpen(false)}
          onCloseEdit={() => setIsEditModalOpen(false)}
          onCloseQuiz={() => {
            setIsCreateQuizModalOpen(false);
            setEditingQuiz(null);
            quizForm.resetFields();
          }}
          onCloseChallenge={() => setIsChallengeModalOpen(false)}
          onCloseImport={() => setIsImportModalOpen(false)}
          onSubmitCreate={() => form.submit()}
          onSubmitEdit={() => editForm.submit()}
          onSubmitQuiz={() => quizForm.submit()}
          onSubmitChallenge={handleAssignChallenges}
          onCreateFinish={handleCreateLevel}
          onEditFinish={handleUpdateLevel}
          onQuizFinish={handleQuizSubmit}
          quizModalTitle={editingQuiz ? 'Chỉnh sửa bài kiểm tra' : 'Thêm bài kiểm tra'}
          onBankSelectionChange={setSelectedBankIds}
          onImportFileChange={setImportFile}
          onImportStart={async () => {
            if (!importFile) return;
            setImporting(true);
            messageApi.info('Tính năng import đang được tối ưu hóa');
            setImporting(false);
            setIsImportModalOpen(false);
          }}
          challengePreview={challengePreview}
          onCloseChallengePreview={handleCloseChallengePreview}
        />
      </div>
    </>
  );
};

export default AdminChapterManagementPage;
