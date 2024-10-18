interface Window {
  WorldApp?: {
    world_app_version: number;
    device_os: "ios" | "android";

    supported_commands: Array<{
      name: import("./types/commands").Command;
      supported_versions: Array<number>;
    }>;
  };
}
