# Yo-kai Watch 3 IV Reverse Calculator

妖怪ウォッチ3の実機ステータスから、成立し得る個体値候補を逆算する非公式Webツールです。

YW2版 `AlexanderGG-0520/yw2-iv-calculator` のUI・Web Worker・GitOps構成をベースにしつつ、計算エンジンはYW3仕様へ切り替えています。

## YW3の個体値

通常のIVはYW2と同じ加重40ポイントです。

```text
HP_IV / 2 + ちから_IV + ようりょく_IV + まもり_IV + すばやさ_IV = 40
```

HP IVは0〜80の偶数、その他は0〜40として探索します。

YW3では性格EVは廃止されています。代わりにアゲランクの秘宝でBase A / Base Bの両方が1回につき元値の約6%上昇します。スポーツクラブは別枠で合計5回までです。

## 使い方

1. 対象妖怪とレベルを選択します。
2. アゲランクの秘宝を実際に使用した回数を入力します。
3. 実機の5ステータスを入力します。
4. スポーツクラブの実施回数を入力します。
5. 装備を外せない場合だけ装備補正を入力します。
6. 「逆算」を押します。
7. 加重40ポイント制約を満たす候補だけが表示されます。

アゲランクは入力上0〜5ですが、開始ランクによって実際の上限が異なります。このリポジトリの種族値表には開始ランクを持たせていないため、種族ごとの上限は自動判定しません。

## スポーツクラブ

| トレーニング | 加算 | 減算 |
| --- | ---: | ---: |
| ちから | ちから +5 | まもり -2 |
| ようりょく | ようりょく +5 | すばやさ -2 |
| まもり | まもり +5 | すばやさ -2 |
| すばやさ | すばやさ +5 | まもり -2 |

## 計算式と出典

- とげにゃんWeb「妖怪ウォッチ3 妖怪一覧」
  - https://togenyanweb.appspot.com/Yokai/yw3/YOKAI_latest.html
- とげにゃんWeb「個体値チェッカー」
  - https://togenyanweb.appspot.com/Yokai/yw3/ivChecker.html
- Yo-kai Watch Character Database「YW3 stat guide」
  - https://yokaiwatch.github.io/characters/stat-guide-ykw3.html

公開ガイドで示されているfloat32の計算順序、アゲランク補正、性格EV廃止、40点IV制約を実装しています。

回帰テストでは、同ガイドのジバニャン Lv50・IV `16/8/8/8/8` の公開例を固定しています。

## 妖怪データ

`scripts/sync-yokai-data.mjs` が、とげにゃんWebのYW3 v4.0最新表からBase A / Base Bを取り込みます。

```sh
npm run sync:yokai
```

`npm run dev` と `npm run build` では同期を試行し、取得できない場合はチェックイン済みの小規模フォールバックデータを使います。

## ローカル実行

```sh
npm install
npm run dev
```

テストとビルド:

```sh
npm test
npm run build
```

Docker:

```sh
docker compose --profile local up --build
```

## GitOps / Argo CD

本番用manifestは `infra/kubernetes`、Argo CD Application定義は `infra/argocd/application.yaml` に置いています。

mainへpushされたコミットでは次の順に更新されます。

1. テストとproduction build
2. `ghcr.io/alexandergg-0520/yw3-iv-calculator:<commit SHA>` をpublish
3. `infra/kubernetes/app.yaml` のimage tagを同じcommit SHAへ自動更新
4. GitHub Actions botがdeployment revisionをmainへcommit
5. Argo CDがmainの `infra/kubernetes` を検知して自動sync

Argo CD側は `automated.prune=true` と `automated.selfHeal=true` です。

Application自体はclusterへ一度bootstrapする必要があります。その後のアプリ更新にはclusterへの直接操作は不要です。

## Dependabot

`.github/dependabot.yml` でnpm・GitHub Actions・Dockerを毎週月曜09:00 JSTに確認し、同一ecosystemの更新をまとめてPR化します。

## 非公式ツール

このプロジェクトはファン制作の非公式ツールです。ゲームROM、実行コード、画像・音声などの公式ゲームアセットは配布しません。

## License

プロジェクト独自のコードは [MIT License](LICENSE) です。外部資料・データの出典は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) と [docs/source-notes.md](docs/source-notes.md) を参照してください。
