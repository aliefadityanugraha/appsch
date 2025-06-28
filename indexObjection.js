"use strict";

const app = require("./appObjection");
const { checkObjectionConnection, closeDatabaseConnection } = require("./config/database");

async function startServer() {
    try {
        // Check Objection.js database connection before starting server
        console.log("🔍 Checking Objection.js database connection...");
        const dbCheck = await checkObjectionConnection();
        
        if (!dbCheck.success) {
            console.error("❌ Failed to connect to database during startup:");
            console.error(dbCheck.error);
            console.log("Server will start but will show database error page for all requests");
        } else {
            console.log("✅ Objection.js database connection verified during startup");
        }

        // Start the server
        const port = process.env.PORT || 5000;
        app.listen(port, (err) => {
            if (err) {
                console.log(err);
                console.log("Running server error. Check error information");
                process.exit(1);
            } else {
                console.log(`🚀 Server listening on port http://localhost:${port}`);
                console.log(`📊 Database status: ${dbCheck.success ? 'Connected (Objection.js)' : 'Disconnected'}`);
                console.log(`🔄 ORM: Objection.js`);
            }
        });

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down server...');
            await closeDatabaseConnection();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down server...');
            await closeDatabaseConnection();
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ Critical error during server startup:", error);
        process.exit(1);
    }
}

startServer(); 