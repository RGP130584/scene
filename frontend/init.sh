#!/bin/bash
set -e

echo "Inicializando projeto React Native 0.73..."
npx react-native@0.73.0 init SceneApp --directory /tmp/SceneApp --version 0.73.6 --skip-install

echo "Copiando arquivos gerados para /app..."
cd /tmp/SceneApp
tar cf - . | (cd /app && tar xf -)

cd /app
echo "Instalando dependências exigidas pelo teste..."
npm install --legacy-peer-deps \
  @react-navigation/native \
  @react-navigation/stack \
  react-native-maps \
  react-native-geolocation-service \
  @supabase/supabase-js \
  socket.io-client \
  zustand \
  react-native-push-notification \
  react-native-camera \
  react-native-qrcode-scanner

echo "Projeto inicializado com sucesso!"
