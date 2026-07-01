# AIDA Vision - Hệ thống Giám sát & Phân tích Giao thông Thông minh

AIDA Vision là một hệ thống bảng điều khiển (Control Desk) chuyên dụng dùng trong phòng vận hành giám sát giao thông và tự động phát hiện vi phạm bằng công nghệ AI. Dự án được tối ưu hóa cho các ca trực kéo dài của điều hành viên, tập trung vào khả năng phản hồi tức thời, độ tương phản cao và giảm thiểu mỏi mắt dưới điều kiện ánh sáng yếu.

## 🌟 Tính năng Nổi bật

1. **Tổng quan Hệ thống (LIVE Dashboard)**:
   - Theo dõi mật độ vi phạm và phân bổ độ tin cậy của mô hình AI theo thời gian thực.
   - Các biểu đồ trực quan (Recharts) hỗ trợ phân tích mật độ vi phạm theo dòng thời gian.
   
2. **Quản lý & Duyệt lỗi Vi phạm**:
   - Giao diện duyệt lỗi AI với ảnh phóng to biển số xe và thông tin chi tiết.
   - Tuân thủ nguyên tắc **Mono-Plate Rule** (Biển số hiển thị bằng font chữ JetBrains Mono in hoa để tăng độ nhận diện).

3. **Tra cứu Phương tiện**:
   - Tra cứu biển số xe nhanh để hiển thị thông tin loại xe, trạng thái vi phạm và lịch sử di chuyển dưới dạng dòng thời gian (timeline) 24 giờ qua.

4. **Tải lên & Phân tích Video AI (Cameras System)**:
   - Hệ thống giả lập phân tích luồng video tải lên thời gian thực.
   - Hiển thị trực quan bounding box (khung nhận diện vật thể) của lỗi vượt đèn đỏ (Red Light), chạy quá tốc độ (Speeding).
   - Tự động đồng bộ và đẩy cảnh báo mới vào luồng alert trực ca.

5. **Trợ giúp & Phím tắt Nhanh (Hotkeys)**:
   - Hỗ trợ phím tắt vận hành nhanh: `Alt + 1-6` để chuyển đổi qua lại giữa các tab, `Alt + H` để đóng/mở tài liệu hướng dẫn nhanh.
   - Ngăn kéo Quick-Help Onboarding trượt mượt mà hiển thị biểu phí xử phạt và quy định duyệt lỗi AI.

## 🛠️ Công nghệ Sử dụng

- **Core**: React 19 (TypeScript)
- **Styling**: Tailwind CSS v4 (Cấu hình tùy biến màu sắc và font chữ)
- **Icons**: Lucide React
- **Đồ thị**: Recharts
- **Bundler**: Vite

## 🚀 Hướng dẫn Cài đặt & Chạy Dự án

### Yêu cầu hệ thống
- Đã cài đặt **Node.js** (Khuyến nghị phiên bản 18 trở lên)

### Các bước thực hiện

1. **Cài đặt các gói thư viện**:
   ```bash
   npm install
   # hoặc dùng pnpm
   pnpm install
   ```

2. **Cấu hình môi trường**:
   - Tạo file `.env.local` dựa trên file `.env.example`.
   - Thiết lập các giá trị cần thiết (nếu có).

3. **Chạy ứng dụng ở môi trường phát triển**:
   ```bash
   npm run dev
   # hoặc pnpm dev
   ```
   Ứng dụng sẽ được chạy tại cổng: `http://localhost:3000`

4. **Biên dịch dự án cho môi trường Production**:
   ```bash
   npm run build
   ```
