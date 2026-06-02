const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { sendPushNotification } = require('../services/push');

// @route   POST /api/invites/send
// @desc    Enviar um convite para outro usuário
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'ID do destinatário é obrigatório.' });
    }

    if (receiverId === senderId) {
      return res.status(400).json({ message: 'Você não pode enviar um convite para si mesmo.' });
    }

    // Verificar se o destinatário existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Destinatário não encontrado.' });
    }

    // Verificar se já existe um convite pendente ou aceito
    const existingInvite = await Invite.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: senderId, receiver: receiverId, status: 'accepted' }
      ]
    });

    if (existingInvite) {
      return res.status(400).json({ 
        message: existingInvite.status === 'pending' 
          ? 'Você já tem um convite pendente para este usuário.' 
          : 'Vocês já estão conectados nesta party.'
      });
    }

    // Criar o convite
    const invite = new Invite({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    await invite.save();

    // Obter dados do remetente
    const sender = await User.findById(senderId);

    // Disparar notificação Push (simulada ou real)
    const io = req.app.get('io');
    await sendPushNotification({
      fcmToken: receiver.fcmToken,
      title: 'Convite de Party!',
      body: `${sender.name} enviou um convite de party para você.`,
      data: {
        type: 'INVITE_RECEIVED',
        inviteId: invite._id.toString(),
        senderId: senderId,
        senderName: sender.name,
        receiverId: receiverId
      },
      io
    });

    res.status(201).json({
      message: 'Convite enviado com sucesso!',
      invite
    });
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    res.status(500).json({ message: 'Erro no servidor ao enviar convite.' });
  }
});

// @route   GET /api/invites
// @desc    Listar convites pendentes recebidos e enviados pelo usuário logado
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const received = await Invite.find({ receiver: userId })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });

    const sent = await Invite.find({ sender: userId })
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 });

    res.json({ received, sent });
  } catch (error) {
    console.error('Erro ao listar convites:', error);
    res.status(500).json({ message: 'Erro no servidor ao listar convites.' });
  }
});

// @route   PUT /api/invites/:id
// @desc    Aceitar ou recusar um convite de party
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const inviteId = req.params.id;
    const userId = req.user.id;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use accepted ou declined.' });
    }

    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ message: 'Convite não encontrado.' });
    }

    // Apenas o destinatário pode responder ao convite
    if (invite.receiver.toString() !== userId) {
      return res.status(403).json({ message: 'Não autorizado a responder a este convite.' });
    }

    invite.status = status;
    await invite.save();

    // Obter dados do destinatário (quem aceitou/recusou) e do remetente (quem vai receber a notificação)
    const receiver = await User.findById(userId);
    const sender = await User.findById(invite.sender);

    if (sender) {
      // Disparar notificação Push para o remetente informando a resposta
      const io = req.app.get('io');
      const actionText = status === 'accepted' ? 'aceitou' : 'recusou';
      
      await sendPushNotification({
        fcmToken: sender.fcmToken,
        title: 'Resposta do Convite',
        body: `${receiver.name} ${actionText} o seu convite de party.`,
        data: {
          type: 'INVITE_RESPONSE',
          inviteId: inviteId,
          status: status,
          receiverName: receiver.name,
          receiverId: invite.sender.toString()
        },
        io
      });
    }

    res.json({
      message: `Convite ${status === 'accepted' ? 'aceito' : 'recusado'} com sucesso!`,
      invite
    });
  } catch (error) {
    console.error('Erro ao responder convite:', error);
    res.status(500).json({ message: 'Erro no servidor ao responder convite.' });
  }
});

module.exports = router;
