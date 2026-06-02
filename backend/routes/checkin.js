const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Checkin = require('../models/Checkin');

// @route POST /api/checkin
// @desc  Registra um novo check-in de QR Code
// @access Private
router.post('/', auth, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'O conteúdo do QR Code é obrigatório.' });
    }

    const checkin = new Checkin({
      user: req.user.id,
      qrData,
    });

    await checkin.save();

    res.status(201).json({ message: 'Check-in realizado com sucesso!', checkin });
  } catch (error) {
    console.error('Check-in Error:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
