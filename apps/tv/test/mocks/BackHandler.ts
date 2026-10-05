// Working BackHandler mock: keeps listeners and calls them like the real one (newest first,
// stop on `true`; exit if nobody handles it). See test/setup.ts.
const listeners: (() => boolean | void)[] = [];

const BackHandler = {
  addEventListener: jest.fn((_event: string, handler: () => boolean | void) => {
    listeners.push(handler);
    return {remove: () => listeners.splice(listeners.indexOf(handler), 1)};
  }),
  exitApp: jest.fn(),
  /** Test helper: simulate the remote's Back button. */
  mockPressBack: () => {
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i]()) {
        return;
      }
    }
    BackHandler.exitApp();
  },
};

export default BackHandler;
