"use client";

import { motion, Variants } from "framer-motion";
import React from "react";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
}

// Define the animation variants
const scrollVariants: Variants = {
  // The state before the element is in view
  hidden: { 
    opacity: 0, 
    y: 50, // Start 50px below its final position
  },
  // The state when the element is in view
  visible: { 
    opacity: 1, 
    y: 0, // Animate to its final position
    transition: { 
      duration: 1.5, 
      ease: "easeOut" 
    } 
  },
};

export default function AnimateOnScroll({ children, className }: AnimateOnScrollProps) {
  return (
    <motion.div
      className={className}
      // Set the initial state to 'hidden'
      initial="hidden"
      // Animate to 'visible' when the element is in the viewport
      whileInView="visible"
      // Ensure the animation only happens once
      viewport={{ once: true }}
      // Apply our defined variants
      variants={scrollVariants}
    >
      {children}
    </motion.div>
  );
}

//push
