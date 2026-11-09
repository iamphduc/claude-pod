// Homepage copy for Open AFlow. Every variant renders exactly this text.
// Source: alvionlabs/openaflow README.md and docs/install.md.

export const REPO_URL = "https://github.com/alvionlabs/openaflow";
// docs/install.md links to alvionlabs/open-aflow (hyphen); the repo is openaflow.
export const RELEASE_URL = "https://github.com/alvionlabs/openaflow/releases/latest";
export const POD_URL = "https://github.com/iamphduc/claude-pod";

export const hero = {
  name: "Open AFlow",
  tagline: "Every pod run, in one window.",
  lead:
    "Open AFlow is a Windows desktop app for pod runs. It shows every run across your repos, and tells you when a run needs you.",
  primaryCta: { label: "Download for Windows", href: RELEASE_URL },
  secondaryCta: { label: "View on GitHub", href: REPO_URL },
  note: "Free and open source (MIT). Linux and macOS come later.",
};

export const demo = {
  title: "See a run as it happens",
  lead: "A pod run builds a plan wave by wave. Open AFlow shows the stage, the slices of the current wave, and what each agent is doing right now.",
};

export const features = [
  {
    title: "Shows each run",
    body: "Its stage, the current wave's slices, and each agent's live activity.",
  },
  {
    title: "Tells you what needs you",
    body: "A blocked agent, a PR to merge, or a question to answer. A toast appears, and the tray icon shows a dot, even when the window is closed.",
  },
  {
    title: "Lets you act from the app",
    body: "Merge a PR, answer a question, or send continue to the run's Claude session.",
  },
  {
    title: "Can continue for you",
    body: "Turn on Auto-continue for a run, and the app sends continue when pod waits for it.",
  },
];

export const privacy = {
  title: "Runs on your computer only",
  body: "Open AFlow reads your repos and Claude's session files. It never writes inside a repo.",
};

export const install = {
  title: "Get started",
  steps: [
    { title: "Install the tools", body: "git, gh (run gh auth login once), and Claude Code." },
    {
      title: "Add pod to Claude Code",
      body: "Without pod, the board stays empty, because pod makes the runs it shows.",
      code: "/plugin marketplace add iamphduc/claude-pod\n/plugin install pod@pod",
    },
    {
      title: "Install Open AFlow",
      body: "Download open-aflow-setup.exe. It installs for your user only, with no admin rights. The build is unsigned, so SmartScreen may ask: choose More info, then Run anyway.",
    },
  ],
};

export const footer = {
  text: "Open AFlow is MIT licensed. Built for pod, a Claude Code plugin.",
  links: [
    { label: "GitHub", href: REPO_URL },
    { label: "pod", href: POD_URL },
    { label: "Releases", href: RELEASE_URL },
  ],
};
