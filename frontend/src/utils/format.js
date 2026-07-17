export const formatBytes = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  // Clamp negative/zero values — storage accounting bugs upstream can push
  // this below zero, and Math.log() of a negative number returns NaN,
  // which is what produces "NaN undefined" in the UI.
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Calculates storage usage statistics safely.
 * @param {number} usedBytes - The amount of storage currently used.
 * @param {number} totalBytes - The total storage limit.
 * @returns {object} Object containing formatted strings and calculated percentages.
 */
export const calculateStorageStats = (usedBytes = 0, totalBytes = 5000000000) => {
  // Guard against negative, non-numeric, or non-finite usedBytes from bad
  // upstream data (e.g. a storage-accounting bug pushing the DB value negative).
  const safeUsedBytes = (typeof usedBytes === 'number' && isFinite(usedBytes) && usedBytes > 0) ? usedBytes : 0;

  let percentage = 0;

  if (totalBytes > 0) {
    percentage = (safeUsedBytes / totalBytes) * 100;
  }

  // Cap at 100% just in case of overflow
  if (percentage > 100) percentage = 100;

  let displayPercentage = '';

  if (safeUsedBytes === 0) {
    displayPercentage = '0%';
  } else if (percentage === 100) {
    displayPercentage = '100%';
  } else if (percentage < 1 && percentage > 0) {
    // If it's less than 0.01%, show <0.01% or just <1%
    // The user requested <1% if extremely small, or 2 decimal places.
    // Let's use 2 decimal places if it's >= 0.01, otherwise <1%.
    if (percentage < 0.01) {
      displayPercentage = '<1%';
    } else {
      displayPercentage = `${percentage.toFixed(2)}%`;
      // strip trailing zeros if any (e.g. 0.50 -> 0.5)
      displayPercentage = parseFloat(percentage.toFixed(2)) + '%';
    }
  } else {
    // Round to nearest integer for standard values
    displayPercentage = `${Math.round(percentage)}%`;
  }

  // To ensure the progress bar shows a tiny sliver if there's any usage at all,
  // we force a minimum of 1% visual width, but only for the progress bar.
  const visualPercentage = (safeUsedBytes > 0 && percentage < 1) ? 1 : Math.round(percentage);

  return {
    usedFormatted: formatBytes(safeUsedBytes),
    totalFormatted: formatBytes(totalBytes),
    percentageString: displayPercentage,
    visualPercentage: visualPercentage,
  };
};