const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Checkin = require('../models/Checkin');

// @route GET /api/users/profile
// @desc  Retorna os dados do perfil logado e sua pontuação
// @access Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const checkinsCount = await Checkin.countDocuments({ user: req.user.id });

    res.json({
      user,
      points: checkinsCount * 10, // Exemplo: cada check-in vale 10 pontos
      totalCheckins: checkinsCount
    });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @route GET /api/users/ranking
// @desc  Retorna a tabela de líderes baseada em checkins
// @access Private
router.get('/ranking', auth, async (req, res) => {
  try {
    const ranking = await Checkin.aggregate([
      {
        $group: {
          _id: '$user',
          totalCheckins: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          name: '$userDetails.name',
          totalCheckins: 1,
          points: { $multiply: ['$totalCheckins', 10] }
        }
      },
      {
        $sort: { points: -1 } // Decrescente
      },
      {
        $limit: 50 // Top 50
      }
    ]);

    res.json(ranking);
  } catch (error) {
    console.error('Ranking Error:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @route POST /api/users/push-token
// @desc  Atualiza o token FCM do dispositivo do usuário
// @access Private
router.post('/push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token não fornecido' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    user.fcmToken = token;
    await user.save();

    res.json({ message: 'Token de push atualizado com sucesso' });
  } catch (error) {
    console.error('Push Token Error:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
