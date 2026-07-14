module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|standard-navigation|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)"
  ]
};
