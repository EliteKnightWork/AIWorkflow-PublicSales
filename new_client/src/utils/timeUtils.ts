export const formatTime = (hour: number) => {
  if (hour === 0) {
    return '午後12時';
  }
  if (hour < 12) {
    return `午前${hour}時`;
  }
  if (hour === 12) {
    return '午前12時';
  }
  return `午後${hour - 12}時`;
};
