// Leading + trailing throttle. Calls fn immediately, then at most once per
// `ms`, always firing a trailing call with the latest args.
export function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  let lastArgs = null;
  const invoke = (now, args) => { last = now; fn(...args); };
  const throttled = (...args) => {
    const now = Date.now();
    lastArgs = args;
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      invoke(now, args);
    } else if (!timer) {
      timer = setTimeout(() => { timer = null; invoke(Date.now(), lastArgs); }, remaining);
    }
  };
  throttled.cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  return throttled;
}
