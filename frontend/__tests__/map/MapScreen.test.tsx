import React from 'react';
import renderer from 'react-test-renderer';
import { MapScreen } from '../../src/screens/MapScreen';

describe('MapScreen', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<MapScreen navigation={{ navigate: jest.fn() }} />).toJSON();
    expect(tree).toBeTruthy();
  });
});
