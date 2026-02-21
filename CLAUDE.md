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

## 参考ドキュメント

- [詳細な学び](./docs/encoder-tuning-learnings.md) - 試行錯誤の過程と深い理解
- [ZMK Documentation](https://zmk.dev/)
