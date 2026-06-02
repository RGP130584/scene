import React from 'react';
import renderer from 'react-test-renderer';
import { LoginScreen } from '../../src/screens/LoginScreen';

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<LoginScreen navigation={{ navigate: jest.fn() }} />).toJSON();
    expect(tree).toBeTruthy();
  });
});
