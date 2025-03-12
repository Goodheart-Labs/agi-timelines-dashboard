export function getNearestKalshiIndex(
  dateOfInterest: number,
  data: { date: string; value: number }[],
) {
  return data.reduce<number>((prev, curr, index) => {
    const kalshiDate = new Date(curr.date).getTime();
    const prevDate = new Date(data[prev].date).getTime();

    // Skip dates before dateOfInterest
    if (kalshiDate < dateOfInterest) return prev;

    // If prev is before dateOfInterest, take current
    if (prevDate < dateOfInterest) return index;

    return kalshiDate < prevDate ? index : prev;
  }, 0);
}
