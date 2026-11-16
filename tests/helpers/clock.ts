export function clock(initial = "2026-11-04T12:00:00.000Z") {
  let value = new Date(initial);

  return {
    now: () => new Date(value),
    set: (next: string) => {
      value = new Date(next);
    },
  };
}
