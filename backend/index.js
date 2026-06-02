require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Disponibiliza o Socket.io nos controllers
app.set('io', io);

const cors = require('cors');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/invites', require('./routes/invites'));

// Rotas do Chat (Histórico)
app.get('/api/chat/history', async (req, res) => {
  try {
    const Message = require('./models/Message');
    const messages = await Message.find().sort({ createdAt: -1 }).limit(50).populate('sender', 'name');
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Configuração do Socket.io
io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  socket.on('sendMessage', async (data) => {
    try {
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      const newMessage = new Message({
        sender: data.userId,
        text: data.text
      });
      await newMessage.save();

      const user = await User.findById(data.userId).select('name');
      
      const msgObj = {
        _id: newMessage._id,
        text: newMessage.text,
        createdAt: newMessage.createdAt,
        sender: {
          _id: user._id,
          name: user.name
        }
      };

      // Emite para todos os conectados
      io.emit('newMessage', msgObj);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.id}`);
  });
});

// Rota de Health Check (útil para os testes de integração)
app.get('/health', (req, res) => {
  // 1 = conectado
  const isConnected = mongoose.connection.readyState === 1;
  if (isConnected) {
    res.status(200).json({ status: 'ok', database: 'connected' });
  } else {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Scene!' });
});

// Conectar ao MongoDB
console.log('Tentando conectar ao MongoDB Atlas...');
server.listen(PORT, () => {
  console.log(`\n🚀 Servidor backend rodando na porta ${PORT}`);
  
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    })
    .catch((err) => {
      console.error('❌ Erro ao conectar no MongoDB:', err.message);
    });
});
