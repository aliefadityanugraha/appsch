const { checkDatabaseConnection, closeDatabaseConnection } = require('../config/database');

async function testDatabaseConnection() {
    console.log('🧪 Testing database connection...');
    
    try {
        const result = await checkDatabaseConnection();
        
        if (result.success) {
            console.log('✅ Database connection test successful');
            console.log('Connection details:', result);
        } else {
            console.log('❌ Database connection test failed');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('💥 Unexpected error during database test:', error);
    } finally {
        await closeDatabaseConnection();
        console.log('🔌 Database connection closed');
    }
}

// Run the test
testDatabaseConnection(); 