let tail = Promise.resolve();

export function withProductMutationLock(operation) {
  const run = tail.then(operation, operation);
  tail = run.catch(() => undefined);
  return run;
}
