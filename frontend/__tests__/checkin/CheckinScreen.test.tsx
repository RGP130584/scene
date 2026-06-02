import React from 'react';
import renderer from 'react-test-renderer';
import { CheckinScreen } from '../../src/screens/CheckinScreen';

describe('CheckinScreen', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<CheckinScreen navigation={{ goBack: jest.fn() }} />).toJSON();
    expect(tree).toBeTruthy();
  });
});
