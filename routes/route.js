const express = require("express");
const router = express.Router();

const mainController = require("../controllers/mainController");

router.get('/', mainController.main);
router.get('/staff', mainController.staff);
router.post('/addStaff', mainController.addStaff);
router.get('/deleteStaff/:id', mainController.deleteStaff);

router.get('/addTugas/:id', mainController.tugas);
router.post('/addTugas', mainController.addTugas);
router.get('/editTugas/:id', mainController.editTugas);
router.post('/updateTugas', mainController.updateTugas);
router.get('/deleteTugas/:id/:staffId', mainController.deleteTugas);

router.get('/periode', mainController.periode);
router.post('/addPeriode', mainController.addPeriode);
router.get('/editPeriode/:id', mainController.editPeriode);
router.post('/updatePeriode', mainController.updatePeriode);
router.get('/deletePeriode/:id', mainController.deletePeriode);

router.get('/data', mainController.data);
router.post('/addRecordTugas/:id', mainController.addData);

module.exports = router;

