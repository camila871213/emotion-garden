#!/bin/bash
# 把注音字型裁成只含 App 用到的字（先執行 node tools/zhuyin/build.mjs 產生 .out/chars.txt）
# 需要：python3 + fonttools + brotli（pip3 install fonttools brotli）、gh（GitHub CLI）
# 字型來源：https://github.com/ButTaiwan/bpmfvs （SIL Open Font License 1.1，授權文件放在 assets/fonts/）
set -e
cd "$(dirname "$0")"
SRC=.cache/fonts
OUT=../../assets/fonts
mkdir -p "$SRC" "$OUT"
for z in BpmfGenSenRounded BpmfSpecial; do
  if [ ! -d "$SRC/$z" ]; then
    gh release download v1.500 -R ButTaiwan/bpmfvs -p "$z.zip" -D "$SRC" --clobber
    unzip -o -q "$SRC/$z.zip" -d "$SRC/$z"
  fi
done
subset() { # 來源 ttf, 輸出 woff2
  # E0100-E01EF 是「讀音選擇碼」，一定要保留，不然多音字就切不了讀音
  python3 -m fontTools.subset "$1" --text-file=.out/chars.txt --unicodes='E0100-E01EF' \
    --flavor=woff2 --layout-features='*' --notdef-outline --output-file="$2"
}
subset "$SRC/BpmfGenSenRounded/BpmfGenSenRounded-M.ttf" "$OUT/BpmfGenSenRounded-M.woff2"
subset "$SRC/BpmfGenSenRounded/BpmfGenSenRounded-B.ttf" "$OUT/BpmfGenSenRounded-B.woff2"
subset "$SRC/BpmfSpecial/BpmfZihiOnly-R.ttf" "$OUT/BpmfZihiOnly-R.woff2"
cp "$SRC/BpmfGenSenRounded/LICENSE-Gen.txt" "$SRC/BpmfGenSenRounded/NOTICE.txt" "$OUT/"
ls -la "$OUT"
