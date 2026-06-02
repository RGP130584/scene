import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const MapView = (props: any) => React.createElement('MapView', props, props.children);
  MapView.Marker = (props: any) => React.createElement('Marker', props, props.children);
  return {
    __esModule: true,
    default: MapView,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      FlashMode: { auto: 'auto' },
    },
  },
}));

jest.mock('react-native-qrcode-scanner', () => {
  const React = require('react');
  return (props: any) => React.createElement('QRCodeScanner', props, props.children);
});

jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }));
});

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  onRegister: jest.fn(),
  onNotification: jest.fn(),
  addEventListener: jest.fn(),
  requestPermissions: jest.fn(),
}));

jest.mock('./src/services/api', () => ({
  api: {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: { baseURL: 'http://localhost' }
  },
  sendInvite: jest.fn(() => Promise.resolve({ success: true })),
  getInvites: jest.fn(() => Promise.resolve({ received: [], sent: [] })),
  respondInvite: jest.fn(() => Promise.resolve({ success: true })),
}));
