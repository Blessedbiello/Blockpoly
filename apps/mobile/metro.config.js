const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the shared package source for live reloading
config.watchFolders = [
  path.resolve(monorepoRoot, "packages/shared"),
  monorepoRoot, // needed for hoisted node_modules
];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Ensure @blockpoly/shared resolves to source (not dist)
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
