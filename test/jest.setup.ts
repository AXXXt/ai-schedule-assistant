const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
    useLocalSearchParams: () => ({}),
    useRouter: () => mockRouter,
  };
});
