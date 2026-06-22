# No Loadwaiting V2

Removes Carrd's loading delay so the page appears immediately.

## What You Do in Carrd

No extra Carrd setup is required after you install the plugin embed.

## How It Works in Carrd

- The page becomes ready immediately instead of waiting on Carrd's default loading delay.
- Entry animations still work.
- The plugin keeps watching briefly for late changes, then stops.
- It also sends initial and follow-up resize pulses so layout-sensitive plugins can wake up.

## How To Check That It Works

1. Publish and open the page.
2. Confirm content appears without the usual wait.
3. If the loader still shows, check that the plugin code is present.

## Configuration

Use this only if you want to change timing behavior.

```html
<script>
window.CarrdPluginOptionsV2 = {
    noLoadwaiting: {
        animationDuration: 750,
        observerTimeout: 5000,
        scrollPulseInterval: 120,
        scrollPulseCount: 2,
        rafPulseCount: 2
    }
};
</script>
```

### Options

| Option | Default | What it changes |
|--------|---------|-----------------|
| `animationDuration` | `750` | Duration for the `is-playing` class in ms |
| `observerTimeout` | `5000` | How long the plugin watches for changes |
| `scrollPulseInterval` | `120` | Interval between follow-up resize pulses in ms |
| `scrollPulseCount` | `2` | Number of delayed resize pulses |
| `rafPulseCount` | `2` | Number of animation frame resize pulses |
