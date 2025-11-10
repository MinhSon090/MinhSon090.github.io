const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt về phòng trọ Hòa Lạc
const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn phòng trọ ở khu vực Hòa Lạc, Hà Nội. 
Nhiệm vụ của bạn là trả lời các câu hỏi về phòng trọ một cách thân thiện, chuyên nghiệp và chính xác.

THÔNG TIN CƠ BẢN VỀ PHÒNG TRỌ:
- Giá phòng: 1.5 - 3 triệu/tháng tùy loại phòng
- Tiện ích: WiFi miễn phí, giường, tủ, bàn học, máy giặt chung, nước nóng
- Điện nước: Điện 3,500đ/kWh, nước 100,000đ/người/tháng
- Cho phép nấu ăn trong phòng
- Gần các trường: ĐH FPT, ĐH Quốc Gia, Học Viện Kỹ Thuật Quân Sự
- Giờ giấc tự do nhưng giữ trật tự sau 22h
- Không nuôi thú cưng
- Đặt cọc 1 tháng tiền phòng
- Có điều hòa, ban công
- An ninh: Camera 24/7, khóa vân tay

QUY TẮC TRẢ LỜI:
1. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt
2. Nhiệt tình, thân thiện, dùng emoji phù hợp 😊
3. Nếu không biết thông tin, hãy khuyên khách liên hệ chủ trọ
4. Luôn kết thúc bằng câu hỏi để tiếp tục hỗ trợ
5. Không bịa đặt thông tin không có trong dữ liệu trên`;

/**
 * Chat endpoint - Gọi Google Gemini API
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                error: 'Message is required',
                response: 'Bạn chưa nhập câu hỏi. Hãy hỏi tôi về phòng trọ nhé! 😊'
            });
        }

        // Check if API key exists
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({ 
                error: 'API key not configured',
                response: 'Xin lỗi, chatbot đang bảo trì. Vui lòng thử lại sau! 🔧'
            });
        }

        // Get Gemini model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 500,
            }
        });

        // Build conversation context
        let fullPrompt = SYSTEM_PROMPT + '\n\n';
        
        // Add conversation history (last 5 messages)
        if (conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-5);
            fullPrompt += 'LỊCH SỬ HỘI THOẠI:\n';
            recentHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Khách' : 'Bạn'}: ${msg.content}\n`;
            });
            fullPrompt += '\n';
        }
        
        fullPrompt += `KHÁCH HỎI: ${message}\n\nTRẢ LỜI:`;

        // Call Gemini API
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const botReply = response.text();

        console.log(`✅ Gemini API called successfully. Message: "${message.substring(0, 50)}..."`);

        res.json({ 
            success: true,
            response: botReply,
            model: 'gemini-pro'
        });

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error.message);
        
        // Return friendly error message
        res.status(500).json({ 
            error: error.message,
            response: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ trực tiếp chủ trọ nhé! 🙏'
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Chatbot API is running',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
    });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({ 
        message: 'Chatbot Backend API',
        endpoints: {
            chat: 'POST /api/chat',
            health: 'GET /api/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot backend running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`🔑 Gemini API key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});
