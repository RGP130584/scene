import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { InviteScreen } from '../../src/screens/InviteScreen';

describe('InviteScreen', () => {
  it('renders correctly', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<InviteScreen />);
    });
    expect(tree.toJSON()).toBeTruthy();
  });
});
