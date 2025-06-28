"use strict";

const Records = require('../models/Records');
const Task = require('../models/Task');
const { knex } = require('../config/database');

module.exports = {

    records: async (req, res) => {
        console.log(`GET | http://localhost:3333${req.originalUrl}`);
        try {
            console.log('📊 Records endpoint called...');
            console.log('📝 Request path:', req.path);
            console.log('👤 User session:', req.session ? 'Exists' : 'Not found');
            
            try {
                console.log('1️⃣ Calculating date range...');
                const thisDate = new Date();
                const startDate = new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-01`);
                const endDate = new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-31`);
                
                console.log('   Current date:', thisDate);
                console.log('   Start date:', startDate);
                console.log('   End date:', endDate);
                console.log('   Start date ISO:', startDate.toISOString());
                console.log('   End date ISO:', endDate.toISOString());

                console.log('\n2️⃣ Testing basic Records query...');
                const allRecords = await Records.query();
                console.log(`   Total records in database: ${allRecords.length}`);
                
                if (allRecords.length > 0) {
                    console.log('   Sample record:');
                    console.log('     ID:', allRecords[0].id);
                    console.log('     Value:', allRecords[0].value);
                    console.log('     StaffId:', allRecords[0].staffId);
                    console.log('     CreatedAt:', allRecords[0].createdAt);
                    console.log('     UpdatedAt:', allRecords[0].updatedAt);
                }

                console.log('\n3️⃣ Testing Records with date filter...');
                const recordsWithDate = await Records.query()
                    .whereBetween('createdAt', [startDate, endDate]);
                console.log(`   Records in current month: ${recordsWithDate.length}`);

                console.log('\n4️⃣ Testing Records with staff relation...');
                const recordsWithStaff = await Records.query()
                    .withGraphFetched('staff');
                console.log(`   Records with staff relation: ${recordsWithStaff.length}`);
                
                if (recordsWithStaff.length > 0) {
                    console.log('   Sample record with staff:');
                    console.log('     Record ID:', recordsWithStaff[0].id);
                    console.log('     Staff:', recordsWithStaff[0].staff ? 'Found' : 'Not found');
                    if (recordsWithStaff[0].staff) {
                        console.log('     Staff Name:', recordsWithStaff[0].staff.name);
                        console.log('     Staff Jabatan:', recordsWithStaff[0].staff.jabatan);
                    }
                }

                console.log('\n5️⃣ Testing Records with tasks relation...');
                const recordsWithTasks = await Records.query()
                    .withGraphFetched('tasks');
                console.log(`   Records with tasks relation: ${recordsWithTasks.length}`);
                
                if (recordsWithTasks.length > 0) {
                    console.log('   Sample record with tasks:');
                    console.log('     Record ID:', recordsWithTasks[0].id);
                    console.log('     Tasks count:', recordsWithTasks[0].tasks ? recordsWithTasks[0].tasks.length : 0);
                }

                console.log('\n6️⃣ Executing full query (like in controller)...');
                // Equivalent to prisma.records.findMany({where: {createdAt: {gte, lte}}, include: {...}, orderBy: {...}})
                const records = await Records.query()
                    .whereBetween('createdAt', [startDate, endDate])
                    .withGraphFetched('[staff, tasks]')
                    .orderBy('createdAt', 'asc');

                console.log(`✅ Full query successful! Found ${records.length} records`);

                if (records.length > 0) {
                    console.log('   Sample full record:');
                    console.log('     ID:', records[0].id);
                    console.log('     Value:', records[0].value);
                    console.log('     Staff:', records[0].staff ? records[0].staff.name : 'Not found');
                    console.log('     Tasks count:', records[0].tasks ? records[0].tasks.length : 0);
                }

                console.log('\n7️⃣ Rendering view...');
                res.status(200).render("export", {
                    layout: "layouts/main-layouts",
                    title: "Data",
                    req: req.path,
                    records: records,
                });
                console.log('✅ View rendered successfully');

            } catch (error) {
                console.error('❌ Error in records endpoint:');
                console.error('   Error message:', error.message);
                console.error('   Error stack:', error.stack);
                console.error('   Error code:', error.code);
                console.error('   Error sql:', error.sql);
                console.error('   Error bindings:', error.bindings);
                
                // More specific error messages
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    console.error('   Issue: Table does not exist');
                    console.error('   Solution: Run npm run setup:tables');
                } else if (error.code === 'ECONNREFUSED') {
                    console.error('   Issue: Cannot connect to database');
                    console.error('   Solution: Check MySQL server');
                } else if (error.message.includes('datetime')) {
                    console.error('   Issue: Datetime format error');
                    console.error('   Solution: Check model datetime format');
                } else if (error.message.includes('relation')) {
                    console.error('   Issue: Relation error');
                    console.error('   Solution: Check model relations');
                }
                
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    },

    addRecords: async (req, res) => {
        console.log(`POST | http://localhost:3333${req.originalUrl}`);
        try {
            let taskIds = req.body["taskIds"] || [];
            if (typeof taskIds === "string") {
                taskIds = [taskIds];
            }
            const tasks = await Task.query().whereIn('id', taskIds);
            const totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
            let createdAtStr;
            if (req.body.date) {
                createdAtStr = req.body.date + ' 00:00:00';
            } else {
                const now = new Date();
                createdAtStr = now.toISOString().slice(0, 10) + ' 00:00:00';
            }
            const record = await Records.query().insert({
                staffId: req.params.id,
                value: totalTaskValue,
                createdAt: createdAtStr
            });
            if (taskIds.length > 0) {
                const junctionData = taskIds.map(taskId => ({
                    A: record.id,
                    B: taskId
                }));
                await knex('_RecordTasks').insert(junctionData);
            }
            res.status(200).redirect("/staff");
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    filterRecords: async (req, res) => {
        console.log(`POST | http://localhost:3333${req.originalUrl}`);
        try {
            const records = await Records.query()
                .whereBetween('createdAt', [new Date(req.body.gte), new Date(req.body.lte)])
                .withGraphFetched('[staff, tasks]')
                .orderBy('createdAt', 'asc');
            res.status(200).render("export", {
                layout: "layouts/main-layouts",
                title: "Data Filtered",
                req: req.path,
                records: records,
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    },

    getRecordsByStaffAndDate: async (req, res) => {
        console.log(`GET | http://localhost:3333${req.originalUrl}`);
        try {
            const staffId = req.params.staffId;
            const date = req.query.date;
            let query = Records.query().where('staffId', staffId);
            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                query = query.whereBetween('createdAt', [start, end]);
            }
            const records = await query.withGraphFetched('tasks');
            let recordId = null;
            let tasks = [];
            if (records.length > 0) {
                recordId = records[0].id;
                tasks = records[0].tasks || [];
            }
            res.json({ recordId, tasks });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    },

    updateRecord: async (req, res) => {
        console.log(`POST | http://localhost:3333${req.originalUrl}`);
        try {
            const recordId = req.params.id;
            let taskIds = req.body.taskIds;
            if (typeof taskIds === "string") {
                taskIds = [taskIds];
            }
            if (!Array.isArray(taskIds)) {
                taskIds = [];
            }
            const tasks = await Task.query().whereIn('id', taskIds);
            const totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
            await Records.query()
                .findById(recordId)
                .patch({
                    value: totalTaskValue,
                });
            await knex('_RecordTasks').where('A', recordId).delete();
            if (taskIds.length > 0) {
                const junctionData = taskIds.map(taskId => ({
                    A: recordId,
                    B: taskId
                }));
                await knex('_RecordTasks').insert(junctionData);
            }
            res.status(200).json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}; 