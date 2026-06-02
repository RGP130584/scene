import React from 'react';
import renderer from 'react-test-renderer';
import { RankingScreen } from '../../src/screens/RankingScreen';

describe('RankingScreen', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<RankingScreen />).toJSON();
    expect(tree).toBeTruthy();
  });
});
