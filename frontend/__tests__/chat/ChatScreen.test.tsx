import React from 'react';
import renderer from 'react-test-renderer';
import { ChatScreen } from '../../src/screens/ChatScreen';

describe('ChatScreen', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<ChatScreen />).toJSON();
    expect(tree).toBeTruthy();
  });
});
