# Interview

Interview the human relentlessly, until you both understand what to build and nothing is left silently assumed. Adapted from Matt Pocock's `grilling` skill ([mattpocock/skills](https://github.com/mattpocock/skills), MIT, notice below).

## Rounds

- Each round → ask every question you can ask now, numbered, each with your recommended answer, in this format. Then wait for the human's answers.

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

- A question whose answer depends on another answer still open → ask it in a later round.
- End each round with one line on how to answer in plain words: `ok` takes every recommendation, `ok except Q3: <answer>` changes one, and `Q1 b, Q2 yes` answers by number. A question left out of the reply keeps its recommendation.
- An answer you can't read for sure → ask it again in the next round, never guess.
- A question needs a fact → look it up yourself, or with a sub-agent while you ask the rest. Ask the human only for decisions.
- No question is left and nothing is silently assumed → the interview is done.

---

MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
