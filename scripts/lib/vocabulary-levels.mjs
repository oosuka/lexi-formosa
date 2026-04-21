export const determineLevel = (length) => {
  if (length <= 1) {
    return 1;
  }

  if (length === 2) {
    return 2;
  }

  return 3;
};

export const levelLengthMap = {
  1: [1, 1],
  2: [2, 2],
  3: [3, Number.POSITIVE_INFINITY],
};

export const isLengthAllowedForLevel = (level, length) => {
  const [minLength, maxLength] = levelLengthMap[level];

  return length >= minLength && length <= maxLength;
};
