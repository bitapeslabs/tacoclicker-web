import XXH from "xxhashjs";

export const xxHash64FromString = (input: string): string => {
  return XXH.h64().update(input).digest().toString(16);
};
