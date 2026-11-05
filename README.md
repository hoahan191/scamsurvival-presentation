# SCAM SURVIVAL – Bài thuyết trình Vòng Chinh phục 6/11

Trang web tĩnh (HTML/CSS/JS thuần, không cần build) để trình chiếu trên Vercel.

## Xem thử trên máy
Mở `index.html` bằng Chrome. Hoặc chạy một máy chủ nhỏ để video tua mượt hơn:

```
npx serve .
```

## Deploy lên Vercel
- **Cách 1:** kéo thả cả thư mục này vào https://vercel.com/new.
- **Cách 2:** đẩy thư mục lên một repo GitHub rồi Import vào Vercel. Chọn Framework Preset **Other**, để trống Build Command và Output Directory.
- **Cách 3 (CLI):** chạy `npx vercel` trong thư mục này, sau đó chạy `npx vercel --prod`.

## Phím tắt khi trình chiếu
| Phím | Tác dụng |
|---|---|
| → / Space | Slide sau |
| ← | Slide trước |
| P | Phát / dừng video |
| F | Toàn màn hình |
| N | Ghi chú người nói |
| S | Cửa sổ người nói (slide hiện tại, slide kế, ghi chú, đồng hồ; điều khiển được màn chính) |
| G | Tổng quan tất cả slide |
| số + Enter | Nhảy tới slide |

Có thể mở thẳng một slide bằng đường dẫn, ví dụ `…/#3`.

## Cấu trúc
- `index.html`: 21 slide, gồm 17 slide gốc và 4 slide mới ở vị trí 2–5.
- `assets/video/`: video game 60 giây và video Learning 90 giây.
- `assets/img/`: ảnh slide gốc, mã QR (SVG), ảnh máy chủ nhà.
- `assets/fonts/`: font Be Vietnam Pro và Oswald tự host, không gọi Google Fonts.
- Trang không gửi dữ liệu đi đâu: không có analytics và không có request ra ngoài.
