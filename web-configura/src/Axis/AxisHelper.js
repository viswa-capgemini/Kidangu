import React from 'react';
import { AxesHelper } from 'three';
import { useThree } from '@react-three/fiber';

const AxisHelper = ({ size = 1 }) => {
  const { scene } = useThree();
  const axesHelper = new AxesHelper(size);
  scene.add(axesHelper);

  return null;
};

export default AxisHelper;