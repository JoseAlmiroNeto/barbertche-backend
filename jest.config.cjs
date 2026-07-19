module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }] },
  collectCoverageFrom: ["modules/notifications/**/*.ts", "!**/*.module.ts", "!**/*.controller.ts"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
