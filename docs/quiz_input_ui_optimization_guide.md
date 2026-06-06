# Hướng dẫn Tối ưu hóa Giao diện Nhập Đáp án (LISTENING) - Admin / Educator

Tài liệu này hướng dẫn cách sửa đổi giao diện nhập thông tin câu hỏi **LISTENING** trên trang Quản lý bài tập (`/admin/quizzes` và `/educator/quizzes`) của SpeakVN.

## 1. Vấn đề hiện tại
* **Nhập trùng lắp:** Học viên/Admin phải nhập từ đúng hai lần: một lần trong danh sách các đáp án lựa chọn (`options`), và một lần nữa trong trường "Đáp án đúng" (`correctAnswer`).
* **Dễ sai lệch dữ liệu:** Nếu nhập đáp án đúng ở hai nơi lệch nhau một ký tự hoặc dấu cách, hệ thống sẽ báo lỗi hoặc chấm điểm sai.
* **Giao diện thô sơ:** Form nhập liệu hiện tại sử dụng TextArea (mỗi dòng một câu) hoặc hiển thị 4 ô đáp án độc lập và một nút tích chọn riêng, không tối ưu cho quy trình nhập đáp án đúng -> đáp án nhiễu.

---

## 2. Giải pháp tối ưu hóa UI (Không đổi Logic Backend)
Thay vì bắt người dùng nhập danh sách 4 đáp án tự do và gõ lại đáp án đúng, chúng ta sẽ chuyển đổi UI thành:
1. **Ô nhập "Đáp án đúng":** Đây là từ/câu chính xác và cũng tự động là lựa chọn đầu tiên.
2. **3 ô nhập "Đáp án nhiễu" (Distractors):** Dùng để nhập các từ sai đánh lạc hướng.

**Dưới Backend:**
* Dữ liệu gửi đi vẫn là mảng `options` gồm 4 phần tử (trong đó phần tử đầu tiên là đáp án đúng) và trường `correctAnswer` khớp chính xác với đáp án đó.
* Đảm bảo tính toàn vẹn dữ liệu gốc và không thay đổi bất kỳ logic API/Database nào.

---

## 3. Các bước thực hiện chi tiết trong Code

Tệp tin cần sửa đổi:
- `FE_SP26SE049/src/modules/admin/pages/QuizManagementPage.tsx`
- `FE_SP26SE049/src/modules/educator/pages/QuizManagementPage.tsx`

### Bước 3.1: Cập nhật hàm Tải dữ liệu lên Form (`handleEditQuestion`)
Khi nhấn chỉnh sửa câu hỏi có sẵn, chúng ta sẽ trích xuất đáp án đúng và 3 đáp án nhiễu từ mảng `options`:

**Code cũ:**
```typescript
if (skill === 'LISTENING') {
    vals.options = meta.options?.join('\n');
    vals.correctAnswer = meta.correctAnswer;
}
```

**Sửa thành:**
```typescript
if (skill === 'LISTENING') {
    vals.correctAnswer = meta.correctAnswer || '';
    // Lọc bỏ đáp án đúng ra khỏi options để lấy danh sách đáp án nhiễu
    const distractors = (meta.options || []).filter((o: string) => o !== meta.correctAnswer);
    vals.distractor1 = distractors[0] || '';
    vals.distractor2 = distractors[1] || '';
    vals.distractor3 = distractors[2] || '';
}
```

---

### Bước 3.2: Cập nhật hàm Gửi dữ liệu tạo mới/cập nhật (`handleCreateNewChallenge`)
Khi nhấn lưu câu hỏi, gộp đáp án đúng và 3 đáp án nhiễu lại thành mảng `options` trước khi đóng gói JSON payload:

**Code cũ:**
```typescript
meta = { 
    options: values.options?.split('\n').filter((o: string) => o.trim()) || [], 
    correctAnswer: values.correctAnswer, 
    ... 
};
```

**Sửa thành:**
```typescript
const correctAns = values.correctAnswer || "";
const d1 = values.distractor1 || "";
const d2 = values.distractor2 || "";
const d3 = values.distractor3 || "";
const optionsArr = [correctAns, d1, d2, d3].filter(o => o.trim());

meta = { 
    options: optionsArr, 
    correctAnswer: correctAns, 
    answer: correctAns,
    transcript: correctSentence, 
    correctSentence: correctSentence,
    hint: values.hint || ""
};
```

---

### Bước 3.3: Cập nhật giao diện Form câu hỏi đơn lẻ (JSX)
Thay đổi TextArea danh sách đáp án thành các trường Input riêng biệt:

**Code cũ:**
```tsx
<Form.Item name="options" label="Danh sách đáp án (Mỗi dòng 1 câu)" rules={[{ required: true }]}>
    <Input.TextArea rows={4} className="doodle-input" />
</Form.Item>
<Form.Item name="correctAnswer" label="Đáp án đúng (Phải khớp chính xác một dòng trên)" rules={[{ required: true }]}>
    <Input className="doodle-input border-emerald-200" />
</Form.Item>
```

**Sửa thành:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Form.Item name="correctAnswer" label={<span className="text-[9px] font-black uppercase text-emerald-600">Đáp án đúng</span>} rules={[{ required: true, message: 'Nhập đáp án đúng' }]} className="md:col-span-2">
        <Input className="doodle-input border-emerald-500 bg-emerald-50/30" placeholder="Nhập đáp án đúng tại đây..." />
    </Form.Item>
    
    <Form.Item name="distractor1" label={<span className="text-[9px] font-black uppercase text-slate-400">Đáp án nhiễu 1</span>} rules={[{ required: true, message: 'Nhập đáp án nhiễu 1' }]}>
        <Input className="doodle-input" placeholder="Đáp án sai thứ 1..." />
    </Form.Item>

    <Form.Item name="distractor2" label={<span className="text-[9px] font-black uppercase text-slate-400">Đáp án nhiễu 2</span>} rules={[{ required: true, message: 'Nhập đáp án nhiễu 2' }]}>
        <Input className="doodle-input" placeholder="Đáp án sai thứ 2..." />
    </Form.Item>

    <Form.Item name="distractor3" label={<span className="text-[9px] font-black uppercase text-slate-400">Đáp án nhiễu 3</span>} rules={[{ required: true, message: 'Nhập đáp án nhiễu 3' }]}>
        <Input className="doodle-input" placeholder="Đáp án sai thứ 3..." />
    </Form.Item>
</div>
```

---

### Bước 3.4: Cập nhật giao diện trong Modal Biên tập hàng loạt (Batch UI)
Đối với chế độ biên tập hàng loạt, chúng ta điều chỉnh cách người dùng cập nhật dữ liệu trực tiếp trên mảng `q.options` và `q.correctAnswer`:

**Cách ánh xạ UI:**
* Ô nhập **"Đáp án đúng"**: Khi thay đổi giá trị sẽ cập nhật `correctAnswer` và `options[0]` cùng lúc.
* Ô nhập **"Đáp án nhiễu 1, 2, 3"**: Khi thay đổi giá trị sẽ cập nhật tương ứng vào `options[1]`, `options[2]`, `options[3]`.

**Mã nguồn JSX cập nhật:**
```tsx
{q.skillType === 'LISTENING' && (
    <div className="md:col-span-2 mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-2 ml-1">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Thiết lập đáp án</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Đáp án đúng */}
            <div className="relative">
                <p className="text-[8px] font-bold text-emerald-600 mb-1 ml-1">Đáp án đúng</p>
                <Input 
                    className="doodle-input text-xs border-emerald-500 bg-emerald-50 font-black text-emerald-800" 
                    placeholder="Đáp án đúng..." 
                    value={q.correctAnswer} 
                    onChange={e => {
                        updateBatchQuestionField(q.tempId, 'correctAnswer', e.target.value);
                        updateBatchOption(q.tempId, 0, e.target.value);
                    }} 
                />
            </div>
            {/* 3 Đáp án nhiễu */}
            <div>
                <p className="text-[8px] font-bold text-slate-400 mb-1 ml-1">Đáp án nhiễu 1</p>
                <Input 
                    className="doodle-input text-xs" 
                    placeholder="Đáp án nhiễu 1..." 
                    value={q.options[1] || ''} 
                    onChange={e => updateBatchOption(q.tempId, 1, e.target.value)} 
                />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-400 mb-1 ml-1">Đáp án nhiễu 2</p>
                <Input 
                    className="doodle-input text-xs" 
                    placeholder="Đáp án nhiễu 2..." 
                    value={q.options[2] || ''} 
                    onChange={e => updateBatchOption(q.tempId, 2, e.target.value)} 
                />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-400 mb-1 ml-1">Đáp án nhiễu 3</p>
                <Input 
                    className="doodle-input text-xs" 
                    placeholder="Đáp án nhiễu 3..." 
                    value={q.options[3] || ''} 
                    onChange={e => updateBatchOption(q.tempId, 3, e.target.value)} 
                />
            </div>
        </div>
    </div>
)}
```

---

## 4. Lợi ích của giải pháp này
* **Tránh lỗi chính tả:** Không lo lệch chữ giữa danh sách lựa chọn và đáp án đúng.
* **Quy trình chuẩn hóa:** Người biên soạn bắt buộc phải tư duy và điền đáp án đúng trước tiên, sau đó mới nghĩ đến các đáp án gây nhiễu xung quanh.
* **Giữ nguyên logic cũ:** Payload gửi lên API không đổi nên hoàn toàn tương thích ngược với Database hiện tại.
