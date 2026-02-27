import "react-native-get-random-values";
import { Buffer } from "buffer";

// Polyfill Buffer globally for Solana libraries
global.Buffer = Buffer as unknown as typeof global.Buffer;
