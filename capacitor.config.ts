import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.starter",
  appName: "ionic-inventory",
  webDir: "dist",
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    BackgroundRunner: {
      label: "io.ionic.starter.task.sync",
      src: "task-sync.js",
      event: "networkStatusChange",
      repeat: true,
      interval: 1,
      autoStart: true,
    },
  },
};

export default config;
