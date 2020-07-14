import { Nullable } from '../types';

const last = <T>(arr: T[]): T | undefined => {
  const len = arr.length;
  return len > 0 ? arr[len - 1] : undefined;
};

const mapAsync = <TIn, TOut>(
  arr: TIn[],
  fn: (item: TIn) => Promise<TOut>
): Promise<TOut[]> => Promise.all(arr.map(async v => await fn(v)));

const reduceAsync = <TIn, TOut>(
  arr: TIn[],
  fn: (accumulator: Promise<TOut>, item: TIn) => TOut,
  initial: TOut
): Promise<TOut> =>
  arr.reduce(async (acc, v) => fn(acc, v), Promise.resolve(initial));

const toMap = <TItem, TId>({
  items,
  idFn
}: {
  items: Nullable<TItem[]>;
  idFn: (item: TItem) => TId;
}): Map<TId, TItem> =>
  (items || []).reduce(
    (map, item) => map.set(idFn(item), item),
    new Map<TId, TItem>()
  );

const identity = <T>(value: T) => value;

const equals = <T>(a: T[], b: T[]): boolean => equalsTransform(a, b, identity);

const equalsTransform = <T, TTransform>(
  a: T[],
  b: T[],
  transform: (item: T) => TTransform
): boolean => {
  if (a === b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((v, i) => transform(v) === transform(b[i]));
};

export { equals, equalsTransform, last, mapAsync, reduceAsync, toMap };
