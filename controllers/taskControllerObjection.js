"use strict";

const Task = require('../models/Task');
const Staff = require('../models/Staff');
const Periode = require('../models/Periode');
const Records = require('../models/Records');
const { knex } = require('../config/database');

module.exports = {

    task: async (req, res) => {
        try {
            const staffId = req.params.id;

            // Equivalent to prisma.staff.findMany({where: {id: staffId}})
            const staff = await Staff.query().where('id', staffId);

            // Equivalent to prisma.task.findMany({where: {staffId}, include: {periode: true}})
            const tasks = await Task.query()
                .where('staffId', staffId)
                .withGraphFetched('periode');

            // Equivalent to prisma.periode.findMany({orderBy: {createdAt: "asc"}})
            const periodeData = await Periode.query().orderBy('createdAt', 'asc');

            res.status(200).render("task", {
                layout: "layouts/main-layouts",
                title: staff[0].name,
                data: tasks,
                staff,
                id: req.params.id,
                periodeData,
                req: req.path,
            });
        } catch (error) {
            console.error('Error fetching task:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    addTask: async (req, res) => {
        try {
            const { description, value, id, periode } = req.body;

            // Equivalent to prisma.task.create({data: {...}})
            await Task.query().insert({
                description: description,
                value: parseInt(value),
                staffId: id,
                periodeId: periode,
            });
            
            res.status(200).redirect(`/addTask/${id}`);
        } catch (error) {
            console.error('Error adding task:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    updateTask: async (req, res) => {
        try {
            const { description, periode, value } = req.body;
            const taskId = req.params.id;
            
            // Equivalent to prisma.task.update({where: {id: taskId}, data: {...}})
            await Task.query()
                .findById(taskId)
                .patch({
                    description,
                    value: parseFloat(value),
                    periodeId: periode,
                });
                
            res.status(200).redirect(`/addTask/${req.body.id}`);
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteTask: async (req, res) => {
        try {
            const taskId = req.params.id;
            const staffId = req.params.staffId;

            // Equivalent to prisma.task.delete({where: {id: taskId}})
            await Task.query().deleteById(taskId);
            
            res.status(200).redirect(`/addTask/${staffId}`);
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getTasksByStaffId: async (req, res) => {
        try {
            const staffId = req.params.id;
            const date = req.query.date;
            let query = Task.query().where('staffId', staffId);
            
            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                
                query = query.whereBetween('createdAt', [start, end]);
            }

            // Equivalent to prisma.task.findMany({where: whereClause, select: {...}})
            const tasks = await query.select('id', 'description', 'value', 'periodeId');
            
            res.json(tasks);
        } catch (error) {
            console.error('Error getting tasks by staff ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    createRecord: async (req, res) => {
        try {
            const { value, staffId, taskIds } = req.body;
            
            // Equivalent to prisma.records.create({data: {value, staffId}})
            const record = await Records.query().insert({
                value,
                staffId,
            });

            // For many-to-many relation, we need to handle the junction table manually
            if (taskIds && taskIds.length > 0) {
                const junctionData = taskIds.map(taskId => ({
                    recordId: record.id,
                    taskId: taskId
                }));
                
                await knex('RecordTasks').insert(junctionData);
            }

            res.status(200).redirect(`/addTask/${staffId}`);
        } catch (error) {
            console.error('Error creating record:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}; 