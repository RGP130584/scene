import { configurePushNotifications } from '../../src/services/pushNotification';
import PushNotification from 'react-native-push-notification';

describe('Notifications Module', () => {
  it('calls PushNotification.configure on startup', () => {
    configurePushNotifications();
    expect(PushNotification.configure).toHaveBeenCalled();
  });
});
