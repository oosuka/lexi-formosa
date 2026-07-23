# Design QA

## 比較対象

- source visual truth path: `/Users/oosuka/.codex/generated_images/019f5ae3-04fa-71a1-88f5-d1ce66f31e7e/exec-dd442081-efdc-4e57-aaf7-c0b0f2900a89.png`
- implementation URL: `http://127.0.0.1:3000/`
- implementation screenshot path: `/Users/oosuka/.codex/visualizations/2026/07/13/019f5ae3-04fa-71a1-88f5-d1ce66f31e7e/lexi-formosa-design-qa/implementation-mobile-390x844-final.png`
- full-view comparison evidence: `/Users/oosuka/.codex/visualizations/2026/07/13/019f5ae3-04fa-71a1-88f5-d1ce66f31e7e/lexi-formosa-design-qa/comparison-pass-2.png`
- viewport: `390 × 844`
- state: Level 2、復習語、回答前、10問ルートの1問目

## Findings

- P0 / P1 / P2 の未解決事項はありません。
- フォントとタイポグラフィ: 参照の太い繁体字見出し、強い日本語選択肢、抑えた補助情報の階層を、Avenir Next / Hiragino Sans 系フォールバックで再現しています。長い実語でも破綻しにくい上限を優先したため、参照より出題語がわずかに小さく見える場合がありますが P3 の許容差です。
- 余白とレイアウト: ヘッダー、10分割進行、HUD、単語、4択、コンボ切符の順序と一画面内の密度を再現しました。実装は操作領域を44px以上に保ち、コンボ切符の下に余白を残しています。
- 色とトークン: オフホワイト、翡翠色、黒、淡い灰、琥珀色を既存のフラットデザイン用トークンへ統合しました。グラデーションとフルピル形状は使っていません。
- 画像品質とアセット: 参照・実装とも主要な画像素材はありません。音声とコンボのアイコンは同一系統の Phosphor Icons を使い、絵文字・手描きSVG・代替CSSアートは使っていません。
- コピーと内容: 「今日の10語」「復習語」「あとn問でボーナス」「終了」を維持し、実データに合わせてLevel・単語・点数・進行数を動的表示します。
- 意図した差分: スマホの選択肢番号はリポジトリ仕様に従って非表示です。PCでは数字キーとの対応番号を表示します。参照の切符端の装飾は、既存のフラットデザイン制約と装飾CSSアート禁止を優先して省略しました。

## Focused Region Comparison

別の拡大クロップは不要と判断しました。最終の横並び比較では390px幅の両画面を同じ大きさで表示しており、出題語、復習ラベル、音声アイコン、選択肢、コンボ切符の文字・境界・余白を判読できました。

## Comparison History

1. 初回比較
   - [P2] 単語面を枠と影で囲ったため、参照より主要領域がカード化され、縦の呼吸が弱くなっていました。
   - [P2] 復習ラベルが単語の左上にあり、参照の「単語直下」の関係と異なっていました。
   - [P2] コンボ帯に `COMBO` の識別がなく、報酬のまとまりが弱くなっていました。
2. 修正
   - スマホの単語面から外枠・影を外し、余白で主要領域を作りました。
   - 復習ラベルを出題語の直下へ移動しました。
   - コンボ帯へ星アイコン、`COMBO`、区切り、次のボーナス条件をまとめました。
3. 修正後比較
   - `comparison-pass-2.png` で同一アスペクト比・同一Level・復習語状態を再比較しました。
   - 主要領域の順序、色、タイポグラフィ、余白、操作密度に未解決の P0 / P1 / P2 はありません。

## Browser Verification

- browser-rendered implementation screenshot: `implementation-mobile-390x844-final.png`
- primary interactions tested: レベル選択、10問ルート開始、回答、正誤表示、不要選択肢の非表示、復習リスト反映、次の問題、トップ復帰
- responsive checks: 320px、390px、PC幅で横方向のオーバーフローなし。PCでは4択を2列表示
- console errors checked: error / warning なし
- automated flow: Playwright E2E 15件通過

## Follow-up Polish

- [P3] 実データの文字数に応じて出題語サイズをさらに細分化すると、2文字語で参照へより近い迫力を出せます。ただし3文字以上の長語との一貫性を優先し、今回は見送りました。

final result: passed
