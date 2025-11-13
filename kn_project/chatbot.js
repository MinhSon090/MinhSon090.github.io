/**
 * Chatbot with FAQ Integration + Google Gemini AI
 * Load FAQ from Excel and provide smart suggestions
 */

// Configuration
const BACKEND_API_URL = 'http://localhost:5000/api/chat';  // Flask backend port 5000
const USE_AI_CHATBOT = true; // Set false để dùng FAQ matching cũ
const ENABLE_ROOM_SUGGESTIONS = true; // Bật gợi ý trọ thông minh

// FAQ Data - This will be populated from the Excel file
// For now, using sample data structure
let faqData = [];
let currentRandomFAQs = [];
let conversationHistory = []; // Lưu lịch sử hội thoại cho AI

// Data for room suggestions - Sử dụng biến từ script_backend.js
// propertyData đã được khai báo trong script_backend.js
let commentsData = {};
let ratingsData = {};

// Initialize chatbot
document.addEventListener('DOMContentLoaded', async function() {
    loadFAQData();
    await loadPropertyData(); // Wait for property data to load
    setupChatHandlers();
    console.log('✓ Chatbot initialized successfully');
});

/**
 * Load FAQ data from JSON (converted from Excel)
 */
async function loadFAQData() {
    try {
        const response = await fetch('faq/faq_data.json');
        if (response.ok) {
            faqData = await response.json();
            console.log(`✓ Loaded ${faqData.length} FAQ entries`);
            displayRandomFAQs();
        } else {
            // Fallback to sample data if JSON not found
            console.warn('FAQ file not found, using sample data');
            loadSampleFAQData();
            displayRandomFAQs();
        }
    } catch (error) {
        console.error('Error loading FAQ:', error);
        loadSampleFAQData();
        displayRandomFAQs();
    }
}

/**
 * Load property data for room suggestions
 */
async function loadPropertyData() {
    try {
        // Wait for propertyData to be loaded by script_backend.js
        const waitForPropertyData = () => {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (typeof propertyData !== 'undefined' && propertyData.length > 0) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        };
        
        await waitForPropertyData();
        console.log(`✓ Using ${propertyData.length} properties from script_backend.js`);
        
        // Load comments data
        const commentsResponse = await fetch('backend/comments.json');
        if (commentsResponse.ok) {
            commentsData = await commentsResponse.json();
            console.log(`✓ Loaded comments data`);
        }
        
        // Load ratings data
        const ratingsResponse = await fetch('backend/ratings.json');
        if (ratingsResponse.ok) {
            ratingsData = await ratingsResponse.json();
            console.log(`✓ Loaded ratings data`);
        }
    } catch (error) {
        console.error('Error loading property data:', error);
    }
}

/**
 * Greeting and general questions - NOT shown in suggestions
 * Chỉ dùng cho matching khi user hỏi, không hiện trong gợi ý
 */
let greetingQuestions = [
    {
        question: "Xin chào",
        answer: "Xin chào! Mình là chatbot hỗ trợ thông tin về phòng trọ ở Hòa Lạc. Mình có thể giúp bạn tìm phòng, báo giá, tiện ích hoặc hướng dẫn liên hệ. Bạn cần giúp gì?"
    },
    {
        question: "Chào bạn",
        answer: "Chào bạn! Mình có thể tư vấn về giá phòng, tiện ích, vị trí và cách liên hệ. Hãy cho mình biết bạn cần tìm gì nhé."
    },
    {
        question: "Bạn là ai?",
        answer: "Mình là trợ lý ảo (chatbot) của dịch vụ phòng trọ Hòa Lạc — mình giúp trả lời các câu hỏi thường gặp và gợi ý phòng phù hợp."
    },
    {
        question: "Chatbot là gì?",
        answer: "Chatbot là hệ thống tự động trả lời câu hỏi của bạn. Ở đây mình hỗ trợ thông tin về phòng trọ: giá, tiện ích, đặt cọc, liên hệ, vị trí..."
    },
    {
        question: "Bạn có làm gì được?",
        answer: "Mình có thể cung cấp thông tin về phòng trọ, trả lời các câu hỏi thường gặp, gợi ý phòng theo yêu cầu và hướng dẫn liên hệ. Hãy hỏi mình bằng tiếng Việt nhé!"
    },
    {
        question: "Hello",
        answer: "Xin chào! Mình có thể giúp bạn tìm phòng trọ. Bạn đang tìm phòng ở khu vực nào?"
    },
    {
        question: "Hi",
        answer: "Hi! Bạn cần tư vấn gì về phòng trọ không?"
    }
];

/**
 * Sample FAQ data as fallback - chỉ các câu hỏi thực tế về phòng trọ
 * Những câu này SẼ HIỆN trong suggestions
 */
function loadSampleFAQData() {
    faqData = [
        {
            question: "Giá phòng trọ ở Hòa Lạc bao nhiêu?",
            answer: "Giá phòng trọ tại Hòa Lạc dao động từ 1.5 - 3 triệu/tháng tùy theo diện tích và tiện ích. Phòng có điều hòa, nóng lạnh thường từ 2.5 - 3 triệu."
        },
        {
            question: "Có những tiện ích gì trong khu trọ?",
            answer: "Khu trọ có đầy đủ tiện ích: wifi miễn phí, máy giặt chung, chỗ để xe rộng rãi, an ninh 24/7, camera giám sát, có siêu thị gần."
        },
        {
            question: "Điện nước tính như thế nào?",
            answer: "Điện 3,500đ/số, nước 20,000đ/người/tháng hoặc 100,000đ/khối. Thanh toán cuối tháng, có công tơ riêng."
        },
        {
            question: "Có cho phép nấu ăn không?",
            answer: "Có, phòng được nấu ăn thoải mái. Khu bếp chung hoặc bếp riêng tùy loại phòng. Cần giữ vệ sinh chung."
        },
        {
            question: "Phòng trọ gần trường nào?",
            answer: "Gần ĐH FPT, ĐH Quốc gia, ĐH Thăng Long. Di chuyển bằng xe máy 5-10 phút. Có xe bus đi các trường."
        },
        {
            question: "Giờ giấc ra vào có quy định không?",
            answer: "Giờ giấc tự do, không giới hạn. Chỉ cần giữ yên tĩnh sau 22h để không ảnh hưởng đến người khác."
        },
        {
            question: "Có được nuôi thú cưng không?",
            answer: "Tùy chủ nhà. Một số phòng cho phép nuôi mèo, chó nhỏ với điều kiện giữ vệ sinh và không gây ồn."
        },
        {
            question: "Cần đặt cọc bao nhiêu khi thuê?",
            answer: "Thường đặt cọc 1-2 tháng tiền phòng. Hoàn trả khi trả phòng nếu không có hư hỏng."
        },
        {
            question: "Phòng có điều hòa và nóng lạnh không?",
            answer: "Có nhiều loại phòng: phòng không điều hòa (1.5-2tr), phòng có điều hòa (2.5-3tr), phòng full nội thất (3-3.5tr)."
        },
        {
            question: "An ninh khu trọ như thế nào?",
            answer: "An ninh tốt với camera 24/7, bảo vệ, cổng vân tay/thẻ từ. Khu vực yên tĩnh, an toàn cho sinh viên và nhân viên văn phòng."
        },
        {
            question: "Có chỗ để xe không?",
            answer: "Có bãi xe rộng rãi, có mái che. Miễn phí hoặc từ 50-100k/tháng tùy khu. An toàn với camera và bảo vệ."
        },
        {
            question: "Phòng trống khi nào?",
            answer: "Có phòng trống ngay. Bạn có thể xem phòng và dọn vào bất cứ lúc nào sau khi đặt cọc."
        },
        {
            question: "Có wifi miễn phí không?",
            answer: "Có wifi miễn phí tốc độ cao. Một số phòng có cáp mạng riêng. Đảm bảo xem phim, học tập tốt."
        },
        {
            question: "Diện tích phòng bao nhiêu?",
            answer: "Diện tích từ 15-30m². Phòng nhỏ 15-20m² (1.5-2tr), phòng lớn 25-30m² (2.5-3.5tr)."
        },
        {
            question: "Có thể ở ghép không?",
            answer: "Có phòng cho ở ghép 2-3 người. Giá ưu đãi hơn, phù hợp sinh viên. Phòng riêng biệt cho mỗi người."
        },
        {
            question: "Hợp đồng thuê như thế nào?",
            answer: "Hợp đồng tối thiểu 6 tháng hoặc 1 năm. Có thể thương lượng thuê ngắn hạn 3 tháng với giá cao hơn."
        },
        {
            question: "Có siêu thị gần không?",
            answer: "Có nhiều siêu thị, chợ, cửa hàng tiện lợi gần: Circle K, GS25, VinMart. Đi bộ 5-10 phút."
        },
        {
            question: "Có cho phép khách qua đêm không?",
            answer: "Được phép nhưng cần báo trước. Khách cùng giới có thể ở qua đêm. Khách khác giới cần hỏi chủ nhà."
        },
        {
            question: "Phòng có nội thất gì?",
            answer: "Tùy loại: cơ bản có giường, tủ, bàn. Full nội thất có thêm điều hòa, tủ lạnh, máy nóng lạnh, bếp."
        },
        {
            question: "Làm sao để xem phòng?",
            answer: "Bạn có thể liên hệ qua số điện thoại hoặc Zalo để hẹn xem phòng. Chủ nhà sẽ trực tiếp dẫn bạn đi xem."
        }
    ];
}

/**
 * Display all FAQ questions in the list
 */
function displayRandomFAQs() {
    if (faqData.length === 0) {
        console.warn('No FAQ data');
        return;
    }
    
    // Get the FAQ items container
    const faqItemsContainer = document.getElementById('faqItems');
    if (!faqItemsContainer) return;
    
    // Clear existing items
    faqItemsContainer.innerHTML = '';
    
    // Create and display all FAQ items
    faqData.forEach((faq, index) => {
        const faqItemDiv = document.createElement('div');
        faqItemDiv.className = 'faqItem';
        faqItemDiv.dataset.faqIndex = index;
        
        const questionSpan = document.createElement('span');
        questionSpan.className = 'faqQuestion';
        questionSpan.textContent = faq.question;
        
        faqItemDiv.appendChild(questionSpan);
        faqItemsContainer.appendChild(faqItemDiv);
        
        // Add click handler
        faqItemDiv.addEventListener('click', function() {
            const faqIndex = parseInt(this.dataset.faqIndex);
            if (faqData[faqIndex]) {
                sendMessage(faqData[faqIndex].question);
            }
        });
    });
    
    // Store current FAQs for reference
    currentRandomFAQs = faqData;
}

/**
 * Setup chat input and FAQ click handlers
 */
function setupChatHandlers() {
    const chatInput = document.getElementById('chatInputField');
    const sendBtn = document.getElementById('chatSendBtn');
    const faqToggleBtn = document.getElementById('faqToggleBtn');
    const faqItemsContainer = document.getElementById('faqItems');
    const faqSuggestions = document.getElementById('faqSuggestions');
    
    // FAQ Toggle button
    if (faqToggleBtn && faqItemsContainer && faqSuggestions) {
        faqToggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFAQ();
        });
        
        // Click vào toàn bộ faqTitle cũng toggle
        const faqTitle = faqSuggestions.querySelector('.faqTitle');
        if (faqTitle) {
            faqTitle.addEventListener('click', function() {
                toggleFAQ();
            });
        }
        
        function toggleFAQ() {
            const isExpanded = faqItemsContainer.classList.toggle('expanded');
            faqToggleBtn.classList.toggle('expanded');
            faqSuggestions.classList.toggle('expanded');
            
            // Save state to localStorage
            localStorage.setItem('faqExpanded', isExpanded);
        }
        
        // Restore previous state (mặc định đóng)
        const savedState = localStorage.getItem('faqExpanded');
        if (savedState === 'true') {
            faqItemsContainer.classList.add('expanded');
            faqToggleBtn.classList.add('expanded');
            faqSuggestions.classList.add('expanded');
        }
    }
    
    // Send button click
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message) {
                sendMessage(message);
                chatInput.value = '';
            }
        });
    }
    
    // Enter key to send
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    sendMessage(message);
                    chatInput.value = '';
                }
            }
        });
    }
}

/**
 * Handle FAQ suggestion click
 */
function handleFAQClick(faq) {
    // Display user's question
    addMessageToChat(faq.question, 'user');
    
    // Display bot's answer after a short delay
    setTimeout(() => {
        addMessageToChat(faq.answer, 'bot');
        // Refresh FAQ suggestions with 2 new random questions
        setTimeout(displayRandomFAQs, 500);
    }, 300);
}

/**
 * Send user message
 */
async function sendMessage(message) {
    // Display user message
    addMessageToChat(message, 'user');
    
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: message });
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    
    try {
        let response;
        
        if (USE_AI_CHATBOT) {
            // Use AI chatbot (Google Gemini)
            response = await getAIResponse(message);
        } else {
            // Use old FAQ matching
            response = getBotResponse(message);
        }
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Check if user is asking for room suggestions
        if (response === null && ENABLE_ROOM_SUGGESTIONS) {
            // Display room suggestions
            addMessageToChat('Dưới đây là những trọ/ktx phù hợp với yêu cầu của bạn:', 'bot');
            displayRoomSuggestions(message);
        } else {
            // Display bot response
            addMessageToChat(response, 'bot');
        }
        
        // Add to conversation history
        conversationHistory.push({ role: 'bot', content: response || 'Room suggestions' });
        
        // Keep only last 10 messages
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }
        
    } catch (error) {
        console.error('Error getting response:', error);
        removeTypingIndicator(typingId);
        addMessageToChat('Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại! 🙏', 'bot');
    }
}

/**
 * Get AI response from backend
 */
async function getAIResponse(message) {
    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.response;
        
    } catch (error) {
        console.error('❌ AI API error:', error);
        // Fallback to FAQ matching
        console.log('⚠️ Falling back to FAQ matching...');
        return getBotResponse(message);
    }
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
    const chatBody = document.querySelector('.chatBody');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatMessage botMessage typing-indicator';
    typingDiv.id = 'typing-' + Date.now();
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return typingDiv.id;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Get bot response based on message with improved matching algorithm
 */
function getBotResponse(message) {
    const userMessage = message.toLowerCase().trim();
    
    // Check if user is asking for room suggestions
    if (ENABLE_ROOM_SUGGESTIONS && isAskingForRoomSuggestions(userMessage)) {
        return null; // Return null to trigger room suggestion display
    }
    
    // Remove Vietnamese tone marks for better matching
    const normalizedUserMessage = removeVietnameseTones(userMessage);
    
    // Extract keywords from user message (words with 2+ characters)
    const userWords = normalizedUserMessage
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word));
    
    if (userWords.length === 0) {
        return 'Bạn có thể nói rõ hơn câu hỏi của mình được không? 😊';
    }
    
    // Score each FAQ based on keyword matching
    // Search in both greetingQuestions and faqData
    let bestMatch = null;
    let bestScore = 0;
    
    // Search in greetingQuestions first
    for (let faq of greetingQuestions) {
        const score = calculateMatchScore(userWords, faq.question, faq.answer);
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = faq;
        }
    }
    
    // Then search in faqData
    for (let faq of faqData) {
        const score = calculateMatchScore(userWords, faq.question, faq.answer);
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = faq;
        }
    }
    
    // Return best match if score is good enough (threshold: 0.3)
    if (bestMatch && bestScore >= 0.3) {
        return bestMatch.answer;
    }
    
    // If no good match, try pattern matching for common queries
    return getPatternResponse(userMessage) || getDefaultResponse();
}

/**
 * Calculate match score between user words and FAQ
 */
function calculateMatchScore(userWords, question, answer) {
    const normalizedQuestion = removeVietnameseTones(question.toLowerCase());
    const normalizedAnswer = removeVietnameseTones(answer.toLowerCase());
    
    // Extract keywords from question and answer
    const questionWords = normalizedQuestion
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word));
    
    const answerWords = normalizedAnswer
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word));
    
    let matchCount = 0;
    let weightedScore = 0;
    
    // Check each user word against question and answer
    for (let userWord of userWords) {
        // Exact match in question (higher weight)
        if (questionWords.some(qw => qw === userWord)) {
            matchCount++;
            weightedScore += 2.0; // Question match is worth more
        }
        // Partial match in question
        else if (questionWords.some(qw => qw.includes(userWord) || userWord.includes(qw))) {
            matchCount++;
            weightedScore += 1.5;
        }
        // Exact match in answer
        else if (answerWords.some(aw => aw === userWord)) {
            matchCount++;
            weightedScore += 1.0;
        }
        // Partial match in answer
        else if (answerWords.some(aw => aw.includes(userWord) || userWord.includes(aw))) {
            matchCount++;
            weightedScore += 0.5;
        }
    }
    
    // Calculate normalized score (0-1)
    const score = weightedScore / (userWords.length * 2.0);
    
    return score;
}

/**
 * Remove Vietnamese tone marks for better matching
 */
function removeVietnameseTones(str) {
    str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
    str = str.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
    str = str.replace(/[ìíịỉĩ]/g, 'i');
    str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
    str = str.replace(/[ùúụủũưừứựửữ]/g, 'u');
    str = str.replace(/[ỳýỵỷỹ]/g, 'y');
    str = str.replace(/đ/g, 'd');
    return str;
}

/**
 * Check if word is a stop word (common words to ignore)
 */
function isStopWord(word) {
    const stopWords = [
        'cua', 'la', 'va', 'thi', 'co', 'o', 'trong', 'nhu', 'ma', 'voi',
        'cho', 'den', 'tu', 'se', 'da', 'duoc', 'nay', 'do', 'khi', 'hay',
        'hoac', 'cac', 'mot', 'nhung', 'rat', 'biet', 'nao', 'gi', 'sao',
        'the', 'oi', 'a', 'nhe', 'ah', 'uhm', 'um'
    ];
    return stopWords.includes(word);
}

/**
 * Get pattern-based response for common queries
 */
function getPatternResponse(message) {
    // Price related
    if (message.match(/gia|tien|phi|chi phi|bao nhieu|gia ca/)) {
        return 'Giá phòng trọ tùy thuộc vào loại phòng và tiện ích. Bạn có thể tham khảo các phòng trong danh sách hoặc liên hệ để biết thêm chi tiết nhé! 😊';
    }
    
    // Contact related
    if (message.match(/lien he|lien lac|so dien thoai|hotline|sdt|phone/)) {
        return 'Bạn có thể liên hệ qua hotline hoặc để lại thông tin, chúng mình sẽ tư vấn cho bạn ngay! 📞';
    }
    
    // Location related
    if (message.match(/o dau|vi tri|dia chi|duong|khu vuc|gan/)) {
        return 'Chúng mình có nhiều phòng trọ tại khu vực Hòa Lạc và xung quanh. Bạn muốn tìm phòng gần khu vực nào cụ thể? 📍';
    }
    
    // Utilities related
    if (message.match(/tien ich|tien nghi|co gi|dien nuoc|wifi|dieu hoa/)) {
        return 'Phòng trọ có đầy đủ tiện nghi: wifi, điều hòa, nóng lạnh, giường tủ... Bạn quan tâm tiện ích nào cụ thể không? 🏠';
    }
    
    // Thanking
    if (message.match(/cam on|thanks|thank|camon/)) {
        return 'Rất vui được hỗ trợ bạn! Nếu có thêm câu hỏi gì, đừng ngại nhắn mình nhé! 🌟';
    }
    
    return null;
}

/**
 * Get default response when no match found
 */
function getDefaultResponse() {
    const responses = [
        'Mình chưa hiểu rõ câu hỏi của bạn. Bạn có thể chọn một trong các câu hỏi gợi ý bên trên được không? 😊',
        'Xin lỗi, mình chưa tìm thấy thông tin phù hợp. Bạn có thể diễn đạt lại câu hỏi hoặc chọn câu hỏi gợi ý nhé! 🙏',
        'Hmm, mình chưa chắc hiểu câu hỏi này. Bạn thử xem các câu hỏi thường gặp bên trên nhé! 💭'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Add message to chat body
 */
function addMessageToChat(message, type) {
    const chatBody = document.querySelector('.chatBody');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatMessage ${type === 'user' ? 'userMessage' : 'botMessage'}`;
    messageDiv.textContent = message;
    
    chatBody.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

/**
 * Check if user is asking for room suggestions
 */
function isAskingForRoomSuggestions(message) {
    const normalizedMessage = removeVietnameseTones(message.toLowerCase());
    
    // Keywords that indicate room suggestion request
    const suggestionKeywords = [
        'goi y', 'de xuat', 'tim tro', 'tim phong', 'co tro nao',
        'tim ktx', 'tim nha tro', 'giup tim', 'muon tim',
        'tro nao tot', 'phong nao tot', 'gia re', 'gan truong',
        'co dieu hoa', 'co wifi', 'rong rai', 'gan cho',
        'yeu cau', 'can tim', 'muon thue', 'muon o'
    ];
    
    return suggestionKeywords.some(keyword => normalizedMessage.includes(keyword));
}

/**
 * Get room suggestions based on user requirements
 */
function getRoomSuggestions(message, topN = 5) {
    if (!propertyData || propertyData.length === 0) {
        console.warn('propertyData is empty or undefined');
        return [];
    }
    
    console.log(`🔍 Finding suggestions for: "${message}"`);
    console.log(`📊 Total properties available: ${propertyData.length}`);
    
    const normalizedMessage = removeVietnameseTones(message.toLowerCase());
    
    // Score each property based on matching criteria
    const scoredProperties = propertyData.map(property => {
        let score = 0;
        
        // Extract price from property safely
        let price = 0;
        if (property.price) {
            const priceStr = String(property.price);
            const priceMatch = priceStr.match(/[\d,]+/g);
            price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
        }
        
        // Get average rating
        const avgRating = getAverageRating(property.id);
        const commentCount = getCommentCount(property.id);
        
        // Base score for all properties (so we always have results)
        score = 1;
        
        // Scoring based on various factors
        
        // 1. Match keywords in title and description
        const propertyText = removeVietnameseTones(
            ((property.title || '') + ' ' + (property.address || '') + ' ' + (property.loai || '')).toLowerCase()
        );
        
        const keywords = normalizedMessage.split(/\s+/).filter(w => w.length > 2);
        keywords.forEach(keyword => {
            if (propertyText.includes(keyword)) {
                score += 2;
            }
        });
        
        // 2. Price preference
        if (normalizedMessage.includes('re') || normalizedMessage.includes('gia re')) {
            if (price < 2000000) score += 5;
            else if (price < 2500000) score += 3;
        }
        if (normalizedMessage.includes('dat') || normalizedMessage.includes('cao cap')) {
            if (price > 2500000) score += 5;
        }
        
        // 3. Location preference
        if (normalizedMessage.includes('gan fpt') || normalizedMessage.includes('gan truong')) {
            if (propertyText.includes('fpt') || propertyText.includes('truong')) score += 5;
        }
        
        // 4. Amenities
        if (normalizedMessage.includes('dieu hoa') && propertyText.includes('dieu hoa')) score += 3;
        if (normalizedMessage.includes('wifi') && propertyText.includes('wifi')) score += 2;
        if (normalizedMessage.includes('gac') && propertyText.includes('gac')) score += 3;
        if (normalizedMessage.includes('ban cong') && propertyText.includes('ban cong')) score += 2;
        
        // 5. Rating and popularity boost
        score += avgRating * 2; // Max +10 for 5-star rating
        score += Math.min(commentCount * 0.5, 5); // Max +5 from comments
        
        // 6. Property type
        if (normalizedMessage.includes('ktx') && property.loai === 'Ký túc xá') score += 5;
        if (normalizedMessage.includes('nha tro') && property.loai === 'Nhà trọ') score += 5;
        
        return {
            ...property,
            score: score,
            avgRating: avgRating,
            commentCount: commentCount,
            price: price
        };
    });
    
    // Sort by score (descending) and return top N
    scoredProperties.sort((a, b) => b.score - a.score);
    
    const topResults = scoredProperties.slice(0, topN);
    console.log(`✅ Found ${topResults.length} suggestions:`);
    topResults.forEach((prop, i) => {
        console.log(`   ${i+1}. ${prop.title} (Score: ${prop.score.toFixed(1)})`);
    });
    
    return topResults;
}

/**
 * Get average rating for a property
 */
function getAverageRating(propertyId) {
    const ratings = ratingsData[propertyId];
    if (!ratings || ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / ratings.length;
}

/**
 * Get comment count for a property
 */
function getCommentCount(propertyId) {
    const comments = commentsData[propertyId];
    return comments ? comments.length : 0;
}

/**
 * Display room suggestions in chat
 */
function displayRoomSuggestions(message) {
    console.log('🏠 displayRoomSuggestions called');
    
    // Check if propertyData is available
    if (!propertyData || propertyData.length === 0) {
        console.warn('propertyData not loaded yet');
        addMessageToChat('Xin lỗi, dữ liệu trọ đang được tải. Vui lòng thử lại sau! 🏠', 'bot');
        return;
    }
    
    const suggestions = getRoomSuggestions(message, 5);
    
    console.log(`📋 Displaying ${suggestions.length} room cards`);
    
    if (suggestions.length === 0) {
        addMessageToChat('Xin lỗi, hiện tại không tìm thấy trọ phù hợp. Bạn thử mô tả yêu cầu cụ thể hơn nhé! 🏠', 'bot');
        return;
    }
    
    const chatBody = document.querySelector('.chatBody');
    
    suggestions.forEach((property, index) => {
        console.log(`   Creating card ${index+1}:`, property.title);
        const cardDiv = document.createElement('div');
        cardDiv.className = 'roomSuggestionCard';
        cardDiv.onclick = () => openPropertyFromChat(property.id);
        
        // Get first image
        const imgSrc = property.img && property.img.length > 0 ? property.img[0] : 'images/placeholder.jpg';
        
        // Extract price text safely (handle both string and non-string)
        let priceText = 'Liên hệ';
        if (property.price) {
            priceText = String(property.price).replace(/<[^>]*>/g, '').replace('Giá:', '').trim();
        }
        
        // Create rating stars
        const stars = '⭐'.repeat(Math.round(property.avgRating || 0));
        const ratingText = property.avgRating > 0 ? `${stars} (${property.avgRating.toFixed(1)})` : 'Chưa có đánh giá';
        
        cardDiv.innerHTML = `
            <div class="roomSuggestionImage">
                <img src="${imgSrc}" alt="${property.title}">
            </div>
            <div class="roomSuggestionInfo">
                <div class="roomSuggestionTitle">${property.title}</div>
                <div class="roomSuggestionPrice">${priceText}</div>
                <div class="roomSuggestionRating">${ratingText}</div>
            </div>
        `;
        
        chatBody.appendChild(cardDiv);
        console.log(`   ✅ Card ${index+1} appended to chatBody`);
    });
    
    console.log(`✅ All ${suggestions.length} cards added to chat`);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

/**
 * Open property modal from chat suggestion
 */
function openPropertyFromChat(propertyId) {
    // Find property in global data
    const property = propertyData.find(p => p.id === propertyId);
    if (!property) return;
    
    // Call the existing openPropertyModal function from script_backend.js
    if (typeof openPropertyModal === 'function') {
        openPropertyModal(property);
    }
}
