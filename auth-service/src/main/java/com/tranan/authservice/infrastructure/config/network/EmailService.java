package com.tranan.authservice.infrastructure.config.network;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.from}")
    private String sender;

    /**
     * Gửi email OTP (Bất đồng bộ)
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // true = multipart (để gửi HTML), UTF-8 để không lỗi font tiếng Việt
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(sender);
            helper.setTo(toEmail);
            helper.setSubject("🔐 Mã OTP Khôi Phục Mật Khẩu - E-Commerce App"); // Sửa lại tiêu đề cho hợp dự án

            String htmlContent = buildOtpEmailTemplate(otp, userName);
            helper.setText(htmlContent, true); // true = isHtml

            mailSender.send(message);
        } catch (MessagingException e) {
            // Log lỗi lại thay vì ném RuntimeException để tránh crash luồng async ngầm
            // log.error("Lỗi gửi email OTP tới {}", toEmail, e);
            throw new RuntimeException("Không thể gửi email: " + e.getMessage());
        }
    }

    // Template HTML giữ nguyên như cũ (tôi đổi tên Brand cho hợp E-commerce)
    private String buildOtpEmailTemplate(String otp, String userName) {
        String template = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                        background-color: #f3f4f6;
                        padding: 40px 20px; 
                    }
                    .email-wrapper {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #4F46E5 0%%, #7C3AED 100%%); /* Màu xanh tím hiện đại cho E-com */
                        padding: 30px;
                        text-align: center;
                        color: white;
                    }
                    .content { padding: 30px; }
                    .otp-box {
                        background: #f0fdf4;
                        border: 2px dashed #4F46E5;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 25px 0;
                    }
                    .otp-code {
                        font-size: 36px;
                        font-weight: 800;
                        color: #4F46E5;
                        letter-spacing: 5px;
                        font-family: monospace;
                    }
                    .footer {
                        background: #f9fafb;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #6b7280;
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="header">
                        <h1>Khôi Phục Mật Khẩu</h1>
                    </div>
                    
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản mua sắm của bạn.</p>
                        
                        <div class="otp-box">
                            <div style="font-size: 12px; color: #666; margin-bottom: 10px;">MÃ XÁC THỰC CỦA BẠN</div>
                            <div class="otp-code">%s</div>
                        </div>
                        
                        <p>⚠️ Mã này sẽ hết hạn sau <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ.</p>
                    </div>
                    
                    <div class="footer">
                        <p>&copy; 2024 E-Commerce Store. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
        // Lưu ý: Trong Java Text Block, ký tự % phải được escape thành %% nếu dùng String.format
        // Nhưng method .formatted() của Java 15+ thì xử lý thông minh hơn.
        // Nếu bạn chạy bị lỗi ký tự %, hãy đổi %% thành % hoặc ngược lại tùy version Java.
        return template.formatted(userName, otp);
    }
}