import type { Config } from "tailwindcss";

import { agentPrismTailwindColors } from "./src/components/agent-prism/theme";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: agentPrismTailwindColors } },
} satisfies Config;
