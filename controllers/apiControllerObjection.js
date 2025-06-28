"use strict";

const Staff = require('../models/Staff');
const Records = require('../models/Records');

module.exports = {
    apiTest: async (req, res) => {
        try {
            // Equivalent to prisma.staff.findMany({include: {task: {include: {periode: true}}}, orderBy: {createdAt: "asc"}})
            const data = await Staff.query()
                .withGraphFetched('task.periode')
                .orderBy('createdAt', 'asc');
                
            res.json(data);
        } catch (error) {
            console.error('Error in apiTest:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    addRecords: (req, res) => {
        res.json(req.body);
    },

    records: async (req, res) => {
        try {
            // Equivalent to prisma.records.findMany({include: {staff: true, tasks: true}})
            const data = await Records.query()
                .withGraphFetched('[staff, tasks]');
                
            res.json(data);
        } catch (error) {
            console.error('Error fetching records:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}; 