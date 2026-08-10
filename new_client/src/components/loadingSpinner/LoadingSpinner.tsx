'use client';
import type React from 'react';
import styled, { keyframes } from 'styled-components';

type LoadingSpinnerProps = {
  size?: number;
  color?: string;
  speed?: number;
};

const bounce = keyframes`
  0%, 100% { transform: scale(0); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
`;

const LoaderWrapper = styled.div<{ size: number }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => props.size * 0.1}px;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  position: relative;
`;

const Dot = styled.div<{ color: string; speed: number; delay: number }>`
  width: 40%;
  height: 40%;
  background-color: ${(props) => props.color};
  border-radius: 50%;
  animation: ${bounce} ${(props) => props.speed}s infinite ease-in-out;
  animation-delay: ${(props) => props.delay}s;
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 60,
  color = 'var(--app-orange-tertiary)',
  speed = 1.6,
}) => {
  const delays = [0, 0.15, 0.3, 0.15, 0.3, 0.45, 0.3, 0.45, 0.6];

  return (
    <LoaderWrapper size={size}>
      {delays.map((delay) => (
        <Dot key={crypto.randomUUID()} color={color} speed={speed} delay={delay} />
      ))}
    </LoaderWrapper>
  );
};

export default LoadingSpinner;
