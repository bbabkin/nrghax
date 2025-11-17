import { Variants, Transition, TargetAndTransition } from 'framer-motion';

// Easing functions
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  elastic: [0.175, 0.885, 0.32, 1.275],
} as const;

// Spring presets
export const springs = {
  wobbly: { type: 'spring', damping: 10, stiffness: 100 },
  stiff: { type: 'spring', damping: 30, stiffness: 500 },
  smooth: { type: 'spring', damping: 30, stiffness: 200, mass: 0.8 },
  bouncy: { type: 'spring', damping: 15, stiffness: 300, mass: 0.5 },
  slow: { type: 'spring', damping: 40, stiffness: 100, mass: 1.5 },
} as const;

// Canvas view transitions
export const canvasTransitions = {
  slide: {
    type: 'spring',
    damping: 30,
    stiffness: 200,
    mass: 0.8,
  },
  fade: {
    duration: 0.3,
    ease: easings.easeInOut,
  },
  zoom: {
    duration: 0.4,
    ease: easings.elastic,
  },
  instant: {
    duration: 0,
  },
} as const;

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: easings.easeIn,
    },
  },
};

// Card animation variants
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easings.easeOut,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: easings.easeInOut,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: easings.easeInOut,
    },
  },
};

// Stagger container variants
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Stagger item variants
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.easeOut,
    },
  },
};

// Skill tree animation variants
export const skillTreeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Hack card animation variants
export const hackCardVariants: Variants = {
  locked: {
    opacity: 0.5,
    scale: 0.95,
    filter: 'grayscale(100%)',
  },
  unlocked: {
    opacity: 1,
    scale: 1,
    filter: 'grayscale(0%)',
    transition: {
      duration: 0.4,
      ease: easings.easeOut,
    },
  },
  completed: {
    opacity: 1,
    scale: 1,
    filter: 'grayscale(0%)',
    boxShadow: '0 0 20px rgba(255, 187, 0, 0.5)',
    transition: {
      duration: 0.5,
      ease: easings.elastic,
    },
  },
};

// Navigation bar animation variants
export const navBarVariants: Variants = {
  hidden: {
    y: -100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easings.easeOut,
    },
  },
};

// Loading skeleton animation
export const skeletonVariants: Variants = {
  initial: {
    background: 'linear-gradient(90deg, #27272a 0%, #3f3f46 50%, #27272a 100%)',
    backgroundSize: '200% 100%',
    backgroundPosition: '100% 0',
  },
  animate: {
    backgroundPosition: '-100% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// Progress indicator variants
export const progressVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: {
      duration: 0.2,
      ease: easings.easeOut,
    },
  }),
};

// Modal/Overlay variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

// Backdrop variants
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

// Floating action button variants
export const fabVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: springs.bouncy,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.2,
      ease: easings.easeInOut,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: {
      duration: 0.1,
      ease: easings.easeInOut,
    },
  },
};

// Swipe gesture animation config
export const swipeAnimation = {
  drag: 'y' as const,
  dragElastic: 0.2,
  dragConstraints: { top: -100, bottom: 100 },
  onDragEnd: (_: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.y) * velocity.y;
    if (swipe < -10000) {
      // Swipe up
      return 'up';
    } else if (swipe > 10000) {
      // Swipe down
      return 'down';
    }
    return null;
  },
};

// Parallax effect config
export const parallaxConfig = {
  initial: { y: 0 },
  animate: (scrollProgress: number) => ({
    y: scrollProgress * -50,
    transition: {
      type: 'tween',
      ease: 'linear',
      duration: 0,
    },
  }),
};

// 3D rotation effect
export const rotateIn3D: Variants = {
  initial: {
    rotateX: 90,
    opacity: 0,
  },
  animate: {
    rotateX: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: easings.easeOut,
    },
  },
  exit: {
    rotateX: -90,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: easings.easeIn,
    },
  },
};

// Morphing shape animation
export const morphVariants: Variants = {
  initial: {
    borderRadius: '20px',
    scale: 1,
  },
  morph: {
    borderRadius: ['20px', '50%', '20px'],
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      ease: easings.easeInOut,
      repeat: Infinity,
    },
  },
};

// Path drawing animation
export const pathVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 2,
        ease: easings.easeInOut,
      },
      opacity: {
        duration: 0.5,
        ease: easings.easeOut,
      },
    },
  },
};

// Glow effect animation
export const glowVariants: Variants = {
  initial: {
    boxShadow: '0 0 0 rgba(255, 187, 0, 0)',
  },
  glow: {
    boxShadow: [
      '0 0 0 rgba(255, 187, 0, 0)',
      '0 0 20px rgba(255, 187, 0, 0.5)',
      '0 0 40px rgba(255, 187, 0, 0.3)',
      '0 0 0 rgba(255, 187, 0, 0)',
    ],
    transition: {
      duration: 2,
      ease: easings.easeInOut,
      repeat: Infinity,
    },
  },
};

// Typewriter effect config
export const typewriterVariants: Variants = {
  hidden: {
    width: 0,
  },
  visible: (text: string) => ({
    width: `${text.length}ch`,
    transition: {
      duration: text.length * 0.05,
      ease: 'linear',
    },
  }),
};

// Utility function to create custom spring
export function createSpring(
  damping: number = 30,
  stiffness: number = 200,
  mass: number = 0.8
): Transition {
  return {
    type: 'spring',
    damping,
    stiffness,
    mass,
  };
}

// Utility function to create custom tween
export function createTween(
  duration: number = 0.3,
  ease: number[] | string = easings.easeInOut
): Transition {
  return {
    type: 'tween',
    duration,
    ease,
  };
}

// Gesture animation helpers
export const gestureAnimations = {
  whileTap: { scale: 0.98 },
  whileHover: { scale: 1.02 },
  whileDrag: { scale: 1.05 },
} as const;

// Complex orchestrated animation
export function createOrchestration(
  animations: Array<{
    target: string;
    animation: TargetAndTransition;
    delay?: number;
  }>
) {
  return {
    animate: animations.reduce((acc, { target, animation, delay = 0 }) => {
      acc[target] = {
        ...animation,
        transition: {
          ...animation.transition,
          delay,
        },
      };
      return acc;
    }, {} as Record<string, TargetAndTransition>),
  };
}

// Responsive animation config based on device capabilities
export function getResponsiveAnimation(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      transition: { duration: 0 },
      animate: { opacity: 1 },
      initial: { opacity: 0 },
      exit: { opacity: 0 },
    };
  }

  return {
    transition: springs.smooth,
    animate: { opacity: 1, scale: 1, y: 0 },
    initial: { opacity: 0, scale: 0.95, y: 20 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  };
}

// Performance-optimized animation config
export const performanceConfig = {
  // Use transform and opacity for best performance
  transform: true,
  // Avoid animating properties that trigger layout
  layout: false,
  // Use will-change for optimization hint
  style: { willChange: 'transform, opacity' },
};