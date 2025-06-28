const axios = require('axios');

async function testAddRecordsEndpoint() {
    console.log('🧪 Testing addRecords endpoint via HTTP...\n');

    try {
        // Get sample staff and tasks first
        console.log('1️⃣ Getting sample data...');
        
        // You can replace these with actual IDs from your database
        const sampleStaffId = '11ecde33-2614-441f-b265-4def642f6ab2'; // AGUNG WINARJI
        const sampleTaskIds = [
            '01a2a3ca-0927-42b1-934c-d8bb9f219fda',
            '0ef2d7ba-dcb5-41b3-a3b0-e681e8d4edb3'
        ];

        console.log('   Staff ID:', sampleStaffId);
        console.log('   Task IDs:', sampleTaskIds);

        // Simulate form data
        const formData = new URLSearchParams();
        sampleTaskIds.forEach(taskId => {
            formData.append('taskIds', taskId);
        });
        formData.append('date', new Date().toISOString().split('T')[0]);

        console.log('\n2️⃣ Sending POST request...');
        console.log('   URL: http://localhost:3333/records/' + sampleStaffId);
        console.log('   Data:', formData.toString());

        const response = await axios.post(
            `http://localhost:3333/records/${sampleStaffId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Accept redirects
                }
            }
        );

        console.log('\n✅ Request successful!');
        console.log('   Status:', response.status);
        console.log('   Status Text:', response.statusText);
        console.log('   Headers:', response.headers);
        
        if (response.status === 302 || response.status === 301) {
            console.log('   Redirect Location:', response.headers.location);
        }

        console.log('\n🎉 AddRecords endpoint test completed!');

    } catch (error) {
        console.error('❌ Request failed:');
        
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Status Text:', error.response.statusText);
            console.error('   Headers:', error.response.headers);
            console.error('   Data:', error.response.data);
        } else if (error.request) {
            console.error('   No response received');
            console.error('   Request:', error.request);
        } else {
            console.error('   Error:', error.message);
        }
        
        console.error('   Stack:', error.stack);
    }
}

// Check if axios is available
try {
    require('axios');
    testAddRecordsEndpoint();
} catch (error) {
    console.error('❌ Axios not found. Installing...');
    console.log('💡 Run: npm install axios');
    console.log('💡 Then run this script again');
} 