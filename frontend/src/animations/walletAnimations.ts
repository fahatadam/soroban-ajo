/**
 * Wallet Modal Animation Variants
 * Framer Motion variants for the wallet connection modal and its children.
 */

import { Variants } from 'framer-motion';

/** Backdrop overlay fade */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Modal panel scale and fade */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

/** Stagger container for wallet card list */
export const walletListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

/** Individual wallet card entrance */
export const walletCardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

/** Connection status indicator pulse */
export const statusPulseVariants: Variants = {
  connecting: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.6, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
  success: {
    scale: [0.8, 1.1, 1],
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  error: {
    x: [-3, 3, -3, 3, 0],
    transition: { duration: 0.3 },
  },
};

/** Checkmark draw animation for success state */
export const checkmarkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};
