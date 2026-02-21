# dax3 ZMK設定開発ガイド

## ビルド手順

ビルドコマンドは `nix develop --command` 経由で実行する。対話型シェルに入る必要はない。

```bash
# 初回セットアップ（westワークスペース初期化）
nix develop --command just setup

# 全ターゲットビルド
nix develop --command just build

# 特定ターゲットのみビルド
nix develop --command just build-target dax3_R
nix develop --command just build-target dax3_L

# ビルド成果物の削除
nix develop --command just clean
```

ビルド成果物は `build/` に出力される:
- `build/dax3_R.uf2` - 右手側（トラックボール + ZMK Studio）
- `build/dax3_L.uf2` - 左手側
- `build/settings_reset.uf2` - 設定リセット用

## ハードウェア仕様

### PMW3610 トラックボール

#### scroll-layers の挙動（重要）

PMW3610 ドライバは `zmk_keymap_highest_layer_active()` で `scroll-layers` を判定する。
Scroll(5) + Android(7) が同時 active な場合、最高レイヤーは 7 → Layer 5 は判定されない。

**解決策**: `conditional_layers` で専用レイヤーを作り `scroll-layers` に追加する:

```dts
// scroll-layers = <5 10 11>;  // 5=Scroll, 10=ScrollAndroid, 11=ScrollWindows
```

#### per-layer スクロール方向の反転

`input-listener` に per-layer override で実現する。`transform.dtsi` のインクルードが**必須**（auto-include されない）:

```dts
#include <input/processors/transform.dtsi>

non_macos_scroll_override {
  layers = <7 8>;
  input-processors = <&zip_scroll_transform (INPUT_TRANSFORM_X_INVERT | INPUT_TRANSFORM_Y_INVERT)>;
};
```

### ロータリーエンコーダ
- **型番**: EC11
- **steps**: 80 (1回転あたりのパルス数)
- **デテント数**: 24 (1回転あたりのクリック数)

## ZMKロータリーエンコーダ設定の絶対ルール

### ⚠️ 重大な制約

#### 1. `tap-ms`は16ms以上必須

```c
enc_scroll: encoder_scroll {
  tap-ms = <20>;  // ✅ OK: 16ms以上
  // tap-ms = <10>;  // ❌ NG: スクロールが一切動かなくなる
};
```

**理由:**
- `&msc`（スクロール）の内部イベント周期は**16ms**
- `tap-ms < 16ms`だと押している間に**1回もイベントが出ずゼロ**になる
- 結果として**スクロールが完全に無反応**になる

**症状:**
- エンコーダ自体は動作する（音量調整などは反応する）
- スクロールだけが一切反応しない
- ビルドエラーは出ない（実行時の問題）

### 2. `triggers-per-rotation`はデテント数に合わせる

```dts
sensors: sensors {
  triggers-per-rotation = <24>;  // デテント数に合わせる
};
```

**理由:**
- 1デテント = 1発火 に最も近い設定になる
- 非整数比（80÷24=3.33）でも正常に動作する
- 小さくしすぎると複数デテント回さないと反応しない

**誤解しやすいポイント:**
- 小さくすれば敏感になると思いがち（実際は逆）
- 整数比でないと動作しないと思いがち（実際は動作する）

### 3. スクロール速度は`SCRL_VAL`で調整

```c
#define ZMK_POINTING_DEFAULT_SCRL_VAL 120
```

**理由:**
- 反応性は`triggers-per-rotation`で決まる
- スクロール量は`SCRL_VAL`で決まる
- **役割を分けて調整する**

**macOS環境の注意:**
- 60だと小さすぎてmacOSが認識しない
- 120以上が安全圏

## パラメータの役割分担

| パラメータ | 役割 | 調整方法 |
|----------|------|---------|
| `triggers-per-rotation` | **いつ発火するか**（反応性） | デテント数に合わせる（24） |
| `SCRL_VAL` | **どれだけスクロールするか**（速度） | 速い→140-160、遅い→80-100 |
| `tap-ms` | **バースト防止** | 16ms以上、基本は20ms |

## 現在の設定（動作確認済み）

```dts
// boards/shields/dax3/dax3.dtsi
sensors: sensors {
  compatible = "zmk,keymap-sensors";
  sensors = <&left_encoder &right_encoder>;
  triggers-per-rotation = <24>;  // デテント数に合わせる
};
```

```c
// config/dax3.keymap
#define ZMK_POINTING_DEFAULT_SCRL_VAL 120  // 適度な速度

enc_scroll: encoder_scroll {
  compatible = "zmk,behavior-sensor-rotate-var";
  #sensor-binding-cells = <2>;
  bindings = <&msc>, <&msc>;
  tap-ms = <20>;  // 16ms以上必須
};
```

## トラブルシューティング

### CI が `led_red alias not found` で失敗する

`zmk-rgbled-widget` の `revision: main` が更新され ZMK v0.3 互換性が壊れた可能性。
`config/west.yml` のリビジョンを ZMK v0.3 互換の commit hash にピン留めすること。

### zmk-rgbled-widget の互換性

ZMK v0.3 は `seeeduino_xiao_ble` ボード名を使用する。`zmk-rgbled-widget` は
2026-02-16 に ZMK main 用の `xiao_ble_zmk` に移行し、v0.3 互換性を削除した。
`revision: main` で CI が壊れるため、`config/west.yml` でピン留めする:

```yaml
- name: zmk-rgbled-widget
  remote: caksoylar
  revision: a3510c9d  # Last version compatible with ZMK v0.3 (seeeduino_xiao_ble)
```

ZMK を v0.3 から main に移行する際は、ボード名も `xiao_ble//zmk` に変更が必要。

### スクロールが一切反応しない

**チェック項目:**
1. `tap-ms`が16ms以上か？
   - → 20msに設定
2. `SCRL_VAL`が大きすぎないか？
   - → macOSでは120以上推奨
3. ファームウェアは左右両方フラッシュしたか？
   - → 両方フラッシュ必須

### ゆっくり回転すると反応しない

**原因:**
- `triggers-per-rotation`が小さすぎる
- → デテント数（24）に設定

### 速く回転するとバースト的にスクロール

**原因:**
- `tap-ms`が長すぎる（100msなど）
- → 20msに設定

## 現在のレイヤー構成

| 番号 | 名前 | 説明 |
|------|------|------|
| 0 | default_layer | デフォルト（macOS） |
| 1 | Symbol | 記号 |
| 2 | Num | 数字 |
| 3 | Function | ファンクション・矢印 |
| 4 | Mouse | マウスボタン |
| 5 | Scroll | スクロールモード |
| 6 | Device | BLE設定 |
| 7 | Android | Androidオーバーレイ（BLE profile 3） |
| 8 | Windows | Windowsオーバーレイ（BLE profile 4） |
| 9 | EmacsNav | Emacs風ナビゲーション |
| 10 | ScrollAndroid | if-layers=\<5 7\> の conditional |
| 11 | ScrollWindows | if-layers=\<5 8\> の conditional |
| 12 | FuncAndroid | if-layers=\<3 7\> の conditional |
| 13 | MouseAndroid | if-layers=\<4 7\> の conditional |

BLE profile マッピング: 0-2 = macOS（overlay なし）、3 = Android（Layer 7）、4 = Windows（Layer 8）

## テスター (tools/tester)

### GitHub Pages デプロイ
- main ブランチへのプッシュで自動デプロイ（`.github/workflows/deploy-tester.yml`）
- URL: `https://wadackel.github.io/zmk-config-dax3/`
- node/pnpm バージョンは `.mise.toml` で管理（source of truth）
- `tools/tester/package.json` の `packageManager` は corepack 互換のため同期して更新すること

## 参考ドキュメント

- [詳細な学び](./docs/encoder-tuning-learnings.md) - 試行錯誤の過程と深い理解
- [ZMK Documentation](https://zmk.dev/)
