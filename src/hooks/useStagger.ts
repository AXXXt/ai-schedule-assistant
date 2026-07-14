import { useEffect, useMemo } from "react";
import { Animated } from "react-native";

export function useStagger(
  count: number,
  options: { delay?: number; duration?: number } = {}
) {
  const { delay = 60, duration = 250 } = options;
  const animations = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        slide: new Animated.Value(12),
        opacity: new Animated.Value(0)
      })),
    [count]
  );

  useEffect(() => {
    const timers = animations.map((anim, i) =>
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.slide, { toValue: 0, duration, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 1, duration, useNativeDriver: true })
        ]).start();
      }, i * delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [animations, delay, duration]);

  return animations;
}