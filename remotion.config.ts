/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
// Standard BT.709 / yuv420p output so MP4s play on iPhone, Safari, QuickTime
// and social apps (without it, JPEG frames produce full-range yuvj420p).
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);
