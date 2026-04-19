export const isMobilePlaybackEnvironment = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches)
  ) {
    return true;
  }

  return (
    typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && window.innerWidth <= 960
  );
};
