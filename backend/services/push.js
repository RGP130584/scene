let admin = null;
let firebaseInitialized = false;

try {
  admin = require('firebase-admin');
  const serviceAccount = require('../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  firebaseInitialized = true;
  console.log('✅ Firebase Admin inicializado com sucesso.');
} catch (err) {
  console.log('⚠️ Firebase Admin não configurado, não instalado ou chave ausente. Usando apenas modo simulado.');
}

/**
 * Envia uma notificação push
 * @param {Object} params
 * @param {string} params.fcmToken - Token FCM do destinatário
 * @param {string} params.title - Título da notificação
 * @param {string} params.body - Corpo da notificação
 * @param {Object} [params.data] - Dados extras para a notificação
 * @param {Object} [params.io] - Instância do Socket.io para envio em tempo real simulado
 */
async function sendPushNotification({ fcmToken, title, body, data = {}, io = null }) {
  console.log(`\n========================================`);
  console.log(`[PUSH NOTIFICATION DETECTED]`);
  console.log(`Token: ${fcmToken || 'Nenhum token (simulação)'}`);
  console.log(`Título: ${title}`);
  console.log(`Mensagem: ${body}`);
  console.log(`Dados: ${JSON.stringify(data)}`);
  console.log(`========================================\n`);

  // 1. Envio Real (se Firebase estiver configurado e o token existir)
  if (firebaseInitialized && fcmToken) {
    try {
      const message = {
        notification: { title, body },
        data: data,
        token: fcmToken,
      };
      const response = await admin.messaging().send(message);
      console.log('✅ Push enviado via FCM real:', response);
    } catch (error) {
      console.error('❌ Erro ao enviar push FCM real:', error);
    }
  }

  // 2. Envio Simulado via Socket.io (para exibição no app em tempo real)
  if (io) {
    io.emit('simulatedPush', {
      title,
      body,
      data,
      fcmToken,
      timestamp: new Date()
    });
  }
}

module.exports = {
  sendPushNotification
};
