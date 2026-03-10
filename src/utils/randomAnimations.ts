/**
 * Random Animation Generator for Bouncing Shapes
 * Creates completely unpredictable, chaotic animations for each shape instance
 */

export interface RandomAnimationConfig {
  duration: number;
  delay: number;
  timingFunction: string;
  keyframes: string;
  animationName: string;
}

/**
 * Generate a random timing function
 */
function getRandomTimingFunction(): string {
  const timingFunctions = [
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    // Custom cubic-bezier functions for more chaos
    'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Back easing
    'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ease-out-quad
    'cubic-bezier(0.55, 0.085, 0.68, 0.53)', // Ease-in-quad
    'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bounce-like
    'cubic-bezier(0.6, -0.28, 0.735, 0.045)', // Ease-in-back
    'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // Elastic-like
    'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth
    'cubic-bezier(0.19, 1, 0.22, 1)', // Expo-out
    'cubic-bezier(0.47, 0, 0.745, 0.715)', // Sine-in-out
  ];

  return timingFunctions[Math.floor(Math.random() * timingFunctions.length)];
}

/**
 * Generate random transform values for gentle, bouncing movement that stays within card boundaries
 */
function getRandomTransform(baseScale: number = 1): string {
  // Use rem units for responsive scaling that adapts to different screen sizes
  // Conservative ranges that work well across mobile and desktop
  const translateX = (Math.random() - 0.5) * 3.75; // -1.875rem to +1.875rem (responsive equivalent of ±30px)
  const translateY = (Math.random() - 0.5) * 2.5; // -1.25rem to +1.25rem (responsive equivalent of ±20px)
  const rotate = Math.random() * 360; // 0deg to 360deg (rotation is safe)
  const scale = baseScale; // Keep original scale, no random scaling

  return `translate(${translateX}rem, ${translateY}rem) rotate(${rotate}deg) scale(${scale})`;
}

/**
 * Generate random keyframes with gentle bouncing movement (like original but randomized)
 */
function generateRandomKeyframes(animationName: string, baseScale: number): string {
  // Generate 4-6 keyframes like the original animations
  const numKeyframes = 4 + Math.floor(Math.random() * 3);
  const keyframePoints: string[] = [];

  // Always start at 0% with base position (like original)
  keyframePoints.push(`0% { 
    transform: scale(${baseScale}); 
  }`);

  // Generate random intermediate keyframes (similar style to original)
  for (let i = 1; i < numKeyframes - 1; i++) {
    const percentage = Math.floor((i / (numKeyframes - 1)) * 100);
    const transform = getRandomTransform(baseScale);

    keyframePoints.push(`${percentage}% { 
      transform: ${transform}; 
    }`);
  }

  // End back at start position for smooth looping (like original)
  keyframePoints.push(`100% { 
    transform: scale(${baseScale}); 
  }`);

  return `@keyframes ${animationName} {
    ${keyframePoints.join('\n    ')}
  }`;
}

/**
 * Generate a random animation configuration with original-like timing
 */
export function generateRandomAnimation(
  instanceId: string,
  baseScale: number = 1,
): RandomAnimationConfig {
  const animationName = `random-bounce-${instanceId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Use duration similar to original (3.5s to 6s like the original patterns)
  const duration = 3.5 + Math.random() * 2.5;

  // Random delay up to 2 seconds (like original)
  const delay = Math.random() * 2;

  // Use mostly ease-in-out like original, with some variation
  const timingFunctions = [
    'ease-in-out',
    'ease-in-out',
    'ease-in-out', // Weight toward original timing
    'ease',
    'ease-out',
  ];
  const timingFunction =
    timingFunctions[Math.floor(Math.random() * timingFunctions.length)];

  // Generate gentle bouncing keyframes
  const keyframes = generateRandomKeyframes(animationName, baseScale);

  return {
    duration,
    delay,
    timingFunction,
    keyframes,
    animationName,
  };
}

/**
 * Inject random keyframes into the document's stylesheet
 */
export function injectRandomKeyframes(keyframes: string): void {
  // Find or create a style element for random animations
  let styleElement = document.getElementById(
    'random-animations-style',
  ) as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = document.createElement('style') as HTMLStyleElement;
    styleElement.id = 'random-animations-style';
    styleElement.type = 'text/css';
    document.head.appendChild(styleElement);
  }

  // Append the new keyframes
  if (styleElement.sheet) {
    try {
      styleElement.sheet.insertRule(keyframes, styleElement.sheet.cssRules.length);
    } catch (error) {
      // Fallback: append to textContent
      styleElement.textContent += '\n' + keyframes;
    }
  } else {
    styleElement.textContent += '\n' + keyframes;
  }
}

/**
 * Generate gentle random animation with original-like movement
 * This replaces the old predictable patterns with randomized but gentle bouncing
 */
export function generateRandomBouncingAnimation(baseScale: number = 1): {
  animationName: string;
  duration: number;
  delay: number;
  timingFunction: string;
  setupKeyframes: () => void;
} {
  const instanceId = Math.random().toString(36).substr(2, 9);
  const config = generateRandomAnimation(instanceId, baseScale);

  return {
    animationName: config.animationName,
    duration: config.duration,
    delay: config.delay,
    timingFunction: config.timingFunction,
    setupKeyframes: () => injectRandomKeyframes(config.keyframes),
  };
}

/**
 * Clean up old animation styles to prevent memory leaks
 */
export function cleanupOldAnimations(): void {
  const styleElement = document.getElementById(
    'random-animations-style',
  ) as HTMLStyleElement | null;
  if (styleElement && styleElement.sheet) {
    const rules = styleElement.sheet.cssRules;
    // Keep only the last 100 animation rules to prevent memory bloat
    if (rules.length > 100) {
      for (let i = 0; i < rules.length - 100; i++) {
        styleElement.sheet.deleteRule(0);
      }
    }
  }
}
