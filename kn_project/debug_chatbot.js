// TEST FILE - Add to browser console to debug chatbot

// Test 1: Check if all variables are loaded
console.log('=== CHATBOT DEBUG ===');
console.log('propertyData:', propertyData ? `${propertyData.length} items` : 'NOT LOADED');
console.log('commentsData:', commentsData ? 'Loaded' : 'NOT LOADED');
console.log('ratingsData:', ratingsData ? 'Loaded' : 'NOT LOADED');
console.log('faqData:', faqData ? `${faqData.length} items` : 'NOT LOADED');

// Test 2: Check if functions exist
console.log('\n=== FUNCTIONS ===');
console.log('openPropertyModal:', typeof openPropertyModal);
console.log('isAskingForRoomSuggestions:', typeof isAskingForRoomSuggestions);
console.log('getRoomSuggestions:', typeof getRoomSuggestions);
console.log('displayRoomSuggestions:', typeof displayRoomSuggestions);

// Test 3: Test room suggestion detection
console.log('\n=== TEST DETECTION ===');
const testMessages = [
    'Gợi ý trọ giá rẻ',
    'Tìm phòng gần FPT',
    'Có trọ nào tốt không?',
    'Giá phòng bao nhiêu?' // Should NOT trigger
];

testMessages.forEach(msg => {
    const isRoomRequest = isAskingForRoomSuggestions ? isAskingForRoomSuggestions(msg) : false;
    console.log(`"${msg}" -> ${isRoomRequest ? 'YES (room suggestion)' : 'NO (FAQ)'}`);
});

// Test 4: Get sample suggestions
if (typeof getRoomSuggestions === 'function' && propertyData && propertyData.length > 0) {
    console.log('\n=== SAMPLE SUGGESTIONS ===');
    const suggestions = getRoomSuggestions('Tìm trọ giá rẻ', 3);
    suggestions.forEach((prop, i) => {
        console.log(`${i+1}. ${prop.title} - Score: ${prop.score.toFixed(2)} - Rating: ${prop.avgRating}`);
    });
}

// Test 5: Check DOM elements
console.log('\n=== DOM ELEMENTS ===');
console.log('.chatBody:', document.querySelector('.chatBody') ? 'Found' : 'NOT FOUND');
console.log('.chatInput:', document.querySelector('.chatInput') ? 'Found' : 'NOT FOUND');
console.log('#chatBox:', document.querySelector('#chatBox') ? 'Found' : 'NOT FOUND');

console.log('\n=== END DEBUG ===');
