function mergeUsersRandomly<T1>(arr1: T1[], arr2: T1[]): T1[] {
  const mergedArr = [...arr1, ...arr2];
  const shuffledArr = mergedArr.sort(() => Math.random() - 0.5);
  return shuffledArr;
}

export { mergeUsersRandomly };
