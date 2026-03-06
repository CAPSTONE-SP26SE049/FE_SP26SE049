Dưới đây là danh sách đầy đủ các API bị ảnh hưởng trực tiếp bởi việc refactor Dialects (Vùng miền) từ dạng Hardcode (Enum) sang Dynamic (Database/String):

1. Nhóm API Quản lý Vùng miền (Admin)
Admin sử dụng các API này để định nghĩa các vùng miền mới (ví dụ: Miền Tây, Tây Nguyên, v.v.) vào hệ thống.

Tạo vùng miền mới (POST)
URL: /api/v1/admin/content/dialects
In (JSON): {"name": "NORTH", "description": "Giọng miền Bắc"}
Out (JSON): {"id": "uuid", "name": "NORTH", ...}
Cập nhật vùng miền (PUT)
URL: /api/v1/admin/content/dialects/{id}
In (JSON): {"name": "NORTH_PRO", "description": "Mô tả mới"}
Xóa vùng miền (DELETE)
URL: /api/v1/admin/content/dialects/{id}
2. Nhóm API Định danh & Người dùng (Auth/User)
Thay đổi quan trọng nhất là trường region từ Enum chuyển thành String để linh hoạt.

Đăng ký tài khoản (POST)
URL: /api/v1/auth/register
In (JSON):
json
{
  "email": "...",
  "region": "NORTH" // Chấp nhận bất kỳ chuỗi nào
}
Đăng ký cho Educator (Admin tạo)
URL: /api/v1/admin/educators
In (JSON): Tương tự đăng ký, trường region là String.
Cập nhật Profile (PATCH)
URL: /api/v1/auth/profile hoặc /api/v1/admin/users/{id}
In (JSON): {"region": "SOUTH"}
Lấy thông tin Profile (GET)
URL: /api/v1/auth/profile
Out (JSON): Trường region trả về String.
3. Nhóm API Nội dung & Lộ trình (Educator/Public)
Lấy lộ trình theo vùng miền (GET)
URL: /api/v1/educator/curriculum/{region}
In: {region} là Path Variable (String) - Ví dụ: /curriculum/NORTH.
Out (JSON): Danh sách Level tương ứng.
Lấy danh sách Vùng miền công khai (GET)
URL: /api/v1/dialects
Out (JSON): Danh sách tất cả các vùng miền hiện có trong Database để Front-end hiển thị Dropdown.
4. Nhóm API Bảng xếp hạng (Leaderboard)
Bảng xếp hạng khu vực (GET)
URL: /api/v1/leaderboards/region/{regionCode}
In: {regionCode} là Path Variable (String).
Out (JSON): Top 10 người dùng có region khớp với chuỗi này.
Tóm tắt thay đổi JSON In/Out:
API	Trường	Thay đổi
All Request	region	Không còn bị bắt lỗi nếu không phải "north/central/south".
All Response	region / name	Luôn trả về chuỗi String chính xác từ Database.
Path Variable	{region}	Tự động so khớp không phân biệt hoa thường (Case-insensitive) với Database.
