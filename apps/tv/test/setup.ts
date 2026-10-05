// The Kepler jest preset's BackHandler mock has no `default` export (index.js reads `.default`)
// and its addEventListener returns undefined, so it can't be used (docs/friction-log.md F-015).
// Replace it for both the generic module and the `.kepler` platform file index.js resolves.
jest.mock('@amazon-devices/react-native-kepler/Libraries/Utilities/BackHandler', () => jest.requireActual('./mocks/BackHandler'));
jest.mock('@amazon-devices/react-native-kepler/Libraries/Utilities/BackHandler.kepler', () => jest.requireActual('./mocks/BackHandler'));
