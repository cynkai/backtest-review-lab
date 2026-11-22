"""Regenerate the spoiler-free social cards. See README for fonts and build dependencies."""

import argparse
import json
import subprocess
from pathlib import Path

import segno
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://cynkai.github.io/backtest-review-lab/"
PAPER, INK, LIGHT, MUTED, ACCENT = "#faf9f4", "#24231e", "#c6c2b4", "#5e5c53", "#a83620"
HEADLINES = {
    "filter": {"en": ("The win rate went up.", "Did the profit?"), "ko": ("승률은 올랐다.", "순손익도 올랐을까?")},
    "candle": {"en": ("Two exits. One candle.", "Which order filled?"), "ko": ("익절과 손절,", "어느 쪽이 먼저였을까?")},
    "fees": {"en": ("Two commissions later,", "what did the trade earn?"), "ko": ("수수료를 두 번 내고,", "얼마가 남았을까?")},
}

def draw_card(case, index, language, fonts):
    image = Image.new("RGB", (1200, 630), PAPER)
    draw = ImageDraw.Draw(image)
    korean = language == "ko"
    serif, sans, hangul = fonts
    display = hangul if korean else serif
    label = hangul if korean else sans

    def text(x, y, value, font, size, color=INK):
        draw.text((x, y), value, font=ImageFont.truetype(font, size), fill=color, anchor="lt")

    def rule(x1, x2, y, color=LIGHT, width=2):
        draw.line((x1, y, x2, y), fill=color, width=width)

    # Use the same three candlesticks as the site masthead.
    draw.rectangle((58, 38, 113, 93), fill=ACCENT)
    for x, top, bottom, a, b in [(73,49,76,56,65), (85,56,76,63,69), (97,49,75,54,62)]:
        draw.line((x,top,x,bottom), fill=PAPER, width=2)
        draw.line((x,a,x,b), fill=PAPER, width=5)
    rule(67,104,81,PAPER)
    text(133, 46, "Backtest Review Lab", serif, 44)
    folio = f"CASE    {index:02d}" if case else "FIELD NOTES"
    text(961, 57, folio, sans, 23, ACCENT)
    rule(58,1142,116,INK,3)
    if case:
        lines = HEADLINES[case["id"]][language]
        facts = case["summary"][language]
        url = BASE + f'?case={case["id"]}&lang={language}'
        section = case["category"][language]
    else:
        lines = ("Would you sign off", "on this backtest?")
        facts = [("Review files", "3 cases"), ("Reproduce in", "Python / Rust / Go / Java")]
        url, section = BASE, "A collection of quant review puzzles"
    text(58, 148, section, label, 25, ACCENT)
    for y, line in zip((200, 298), lines):
        text(54, y, line, display, 83 if korean else 88)
    rule(58, 905, 435, INK)
    for x, (caption, number) in zip((60, 405), facts):
        text(x, 461, caption, label, 23, MUTED)
        text(x, 503, number, display, 43 if case else 36)
    code = segno.make_qr(url, error="m")
    width = code.symbol_size()[0]
    scale = 160 // width
    side = width * scale
    left, top = 1142 - side, 409
    draw.rectangle((left, top, left + side - 1, top + side - 1), fill="white")
    for row_index, row in enumerate(code.matrix_iter(border=4)):
        for col, filled in enumerate(row):
            if filled:
                x, y = left + col * scale, top + row_index * scale
                draw.rectangle((x,y,x+scale-1,y+scale-1), fill=INK)
    rule(58,1142,568)
    text(58, 586, "cynkai.github.io/backtest-review-lab", sans, 22, MUTED)
    caption = "QR로 문제 열기" if korean else "Scan to review"
    font = ImageFont.truetype(label, 22)
    draw.text((1142,586), caption, font=font, fill=INK, anchor="rt")
    return image

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serif", required=True, help="Latin display font file")
    parser.add_argument("--sans", required=True, help="Latin text font file")
    parser.add_argument("--korean", required=True, help="Font file with Hangul coverage")
    option = parser.parse_args()
    fonts = (option.serif, option.sans, option.korean)
    read_cases = "global.window={};require('./docs/cases.js');console.log(JSON.stringify(window.PILOT_CASES))"
    cases = json.loads(subprocess.check_output(["node", "-e", read_cases], cwd=ROOT))
    output = ROOT / "docs" / "cards"
    output.mkdir(exist_ok=True)
    for i, case in enumerate(cases, start=1):
        for lang in ("en", "ko"):
            draw_card(case, i, lang, fonts).save(output / f"{case['id']}-{lang}.png", optimize=True)
    draw_card(None, 0, "en", fonts).save(output / "cover.png", optimize=True)

if __name__ == "__main__":
    main()
