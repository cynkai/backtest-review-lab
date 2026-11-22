# Backtest Review Lab

Would you trust this backtest? Read the author's claim, inspect the evidence, then **approve**, **request changes**, or **ask for more evidence**. Two short reviews, in English and Korean. Each comes with a runnable Python check and synthetic data.

**[Try the first case](https://cynkai.github.io/backtest-review-lab/?case=filter&lang=en)** · **[한국어로 시작하기](https://cynkai.github.io/backtest-review-lab/?case=filter&lang=ko)**

| Review | Evidence |
| --- | --- |
| [The higher win rate](https://cynkai.github.io/backtest-review-lab/?case=filter&lang=en) | Five trades before and after a change to the entry filter |
| [Two orders, one candle](https://cynkai.github.io/backtest-review-lab/?case=candle&lang=en) | An open position, two exit orders, and a five-minute bar |

## Try it with a colleague

Send the **unsolved case link** and let them make the first call. The answer and timeline stay in the current tab while it is open. Reloading starts a fresh review. The optional result-copy button puts the first verdict, elapsed seconds, and whether the evidence was opened on the clipboard. The puzzle sends no participant results to the project.

If you would use this in a study group or code review, [tell us how it went](https://github.com/cynkai/backtest-review-lab/issues/new?template=feedback.yml). GitHub issues are public. A star helps you find the cases again.

## Run locally

Open `docs/index.html` directly, or run `python3 -m http.server 8000 --directory docs` and open `http://localhost:8000`. The site uses HTML, CSS and vanilla JavaScript. There are no runtime dependencies or account requirements.

To verify the two reproducible answer keys with Node.js and Python 3, run:

```sh
node tests/check-cases.mjs
```

## 한국어

[첫 문제](https://cynkai.github.io/backtest-review-lab/?case=filter&lang=ko)와 [두 번째 문제](https://cynkai.github.io/backtest-review-lab/?case=candle&lang=ko)는 브라우저에서 바로 풀 수 있습니다. 근거를 열고 판정하면 해설과 검증 코드가 나옵니다. 동료에게 보낼 때는 **정답 없는 문제 링크 복사**를 쓰세요. 파일럿 결과는 본인이 복사해 전달할 때만 상대에게 공유됩니다. 사용 소감이나 다음 사례 제안은 [GitHub 이슈](https://github.com/cynkai/backtest-review-lab/issues/new?template=feedback.yml)에 남길 수 있습니다. 이슈의 계정명과 글은 공개됩니다.

[MIT License](LICENSE)
