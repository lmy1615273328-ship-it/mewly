import type { CapacitorConfig } from "@capacitor/cli";
import { APP_NAME } from "./src/types";

const config: CapacitorConfig = {
  appId: "app.mewly.beta",
  appName: APP_NAME,
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
};

export default config;
