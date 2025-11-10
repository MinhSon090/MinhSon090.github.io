/* 
 * DEBUG SCRIPT - Paste vào Console (F12) để test
 */

console.clear();
console.log('=== CHATBOT DEBUG TEST ===\n');

// Test 1: Check propertyData
console.log('1. Checking propertyData...');
if (typeof propertyData !== 'undefined') {
    console.log(`   ✅ propertyData exists: ${propertyData.length} items`);
    console.log('   Sample property:', propertyData[0]);
} else {
    console.log('   ❌ propertyData is undefined!');
}

// Test 2: Check if functions exist
console.log('\n2. Checking functions...');
const functions = [
    'isAskingForRoomSuggestions',
    'getRoomSuggestions', 
    'displayRoomSuggestions',
    'openPropertyFromChat',
    'openPropertyModal'
];

functions.forEach(fn => {
    const exists = typeof window[fn] !== 'undefined' || typeof eval(fn) !== 'undefined';
    console.log(`   ${exists ? '✅' : '❌'} ${fn}`);
});

// Test 3: Test detection
console.log('\n3. Testing room suggestion detection...');
const testMessage = 'Gợi ý trọ giá rẻ';
try {
    const isRoomReq = isAskingForRoomSuggestions(testMessage);
    console.log(`   "${testMessage}" -> ${isRoomReq ? '✅ Detected' : '❌ Not detected'}`);
} catch(e) {
    console.log('   ❌ Error:', e.message);
}

// Test 4: Test getRoomSuggestions
console.log('\n4. Testing getRoomSuggestions...');
try {
    if (propertyData && propertyData.length > 0) {
        const suggestions = getRoomSuggestions('Gợi ý trọ', 3);
        console.log(`   ✅ Got ${suggestions.length} suggestions`);
        suggestions.forEach((s, i) => {
            console.log(`      ${i+1}. ${s.title} - ${s.price}`);
        });
    } else {
        console.log('   ❌ propertyData not loaded');
    }
} catch(e) {
    console.log('   ❌ Error:', e.message);
}

// Test 5: Check DOM elements
console.log('\n5. Checking DOM elements...');
const elements = {
    '.chatBody': document.querySelector('.chatBody'),
    '.chatInput': document.querySelector('.chatInput'),
    '#chatBox': document.querySelector('#chatBox'),
    '.roomSuggestionCard': document.querySelectorAll('.roomSuggestionCard')
};

Object.entries(elements).forEach(([selector, el]) => {
    if (selector === '.roomSuggestionCard') {
        console.log(`   ${el.length > 0 ? '✅' : '⚠️'} ${selector}: ${el.length} cards found`);
    } else {
        console.log(`   ${el ? '✅' : '❌'} ${selector}`);
    }
});

// Test 6: Manual test displayRoomSuggestions
console.log('\n6. Testing displayRoomSuggestions manually...');
console.log('   Run this command to test:');
console.log('   displayRoomSuggestions("Gợi ý trọ giá rẻ")');

console.log('\n=== END DEBUG ===');
