# pod config

Settings pod reads on every run. Edit a value to change it for good; a command-line flag changes it for one run only. An empty value uses the default.

| Key | Values | Default |
|---|---|---|
| `merge-target` | a branch name | origin's default branch |
| `browser` | `agent-browser`, `axi`, or `none` | pod checks the browser, and asks if it fails |
| `ci` | `on` or `off` | `/pod:init` offers CI once |

merge-target:
browser:
ci:
