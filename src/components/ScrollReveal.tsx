'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  once?: boolean;
  margin?: string;
  className?: string;
  staggerIndex?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.35,
  distance = 12,
  direction = 'up',
  once = true,
  margin = '0px',
  className = '',
  staggerIndex,
  ...props
}: ScrollRevealProps) {
  const getInitialDirection = () => {
    switch (direction) {
      case 'up': return { y: distance, x: 0 };
      case 'down': return { y: -distance, x: 0 };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      case 'none': return { x: 0, y: 0 };
      default: return { y: distance, x: 0 };
    }
  };

  const computedDelay = typeof staggerIndex === 'number' 
    ? Math.min(delay + (staggerIndex % 6) * 0.025, 0.12) 
    : delay;

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialDirection() }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: margin as any }}
      transition={{
        duration,
        delay: computedDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

