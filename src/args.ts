import { Colors } from "./constants";
import { usage } from "./utils";

export interface InstallOptions {
  requestedVersion: string;
  noModifyPath: boolean;
  binaryPath: string;
}

export function parseArgs(argv: string[]): InstallOptions {
  const options: InstallOptions = {
    requestedVersion: process.env.VERSION ?? "",
    noModifyPath: false,
    binaryPath: "",
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        usage();
        process.exit(0);
        break;

      case "-v":
      case "--version": {
        const next = argv[i + 1];
        if (!next) {
          console.error(
            `${Colors.RED}Error: --version requires a version argument${Colors.NC}`
          );
          process.exit(1);
        }
        options.requestedVersion = next;
        i += 2;
        continue;
      }

      case "-b":
      case "--binary": {
        const next = argv[i + 1];
        if (!next) {
          console.error(
            `${Colors.RED}Error: --binary requires a path argument${Colors.NC}`
          );
          process.exit(1);
        }
        options.binaryPath = next;
        i += 2;
        continue;
      }

      case "--no-modify-path":
        options.noModifyPath = true;
        i++;
        continue;

      default:
        console.error(
          `${Colors.ORANGE}Warning: Unknown option '${arg}'${Colors.NC}`
        );
        i++;
        continue;
    }
  }

  return options;
}
