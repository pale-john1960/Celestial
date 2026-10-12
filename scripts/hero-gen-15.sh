#!/bin/bash
# Celestial round 15 — 52 hero images (sequential! round-13 lesson: parallel z-ai
# image calls OOM the 4GB box). 48 fixed-theme month images ({theme}-5..12) +
# 4 seasonal (spring-5=May, summer-5=Aug, autumn-3=Nov, winter-3=Feb).
# Outputs → public/hero/<name>.jpg (web) + android/app/src/main/res/drawable-nodpi/hero_<underscored>.jpg
set -u
OUT=/tmp/hero15
WEB=/home/z/my-project/public/hero
DROID=/home/z/my-project/android/app/src/main/res/drawable-nodpi
mkdir -p "$OUT"

SUFFIX=", painterly digital art, main subject in the lower half of the frame, calm uncluttered upper third of the sky suitable for white text overlay, cohesive color palette, no text, no words, no letters, no numbers, no calligraphy, no watermark, no border"
SEASUFFIX=", soft flat illustration style, gentle gradients, main subject in the lower half of the frame, calm unclustered upper third suitable for white text overlay, no text, no words, no letters, no numbers, no calligraphy, no watermark, no border"

# name|prompt  (prompt already includes its suffix)
ITEMS=(
"celestial-5|Deep indigo night sky with a soft magenta and teal nebula, dense starfield, thin crescent moon low on the horizon, silhouetted lavender flower field in the foreground${SUFFIX}"
"celestial-6|Summer night sky with the bright core of the Milky Way rising over a silhouetted pine tree ridge, wisps of violet and teal nebula, dark calm upper sky${SUFFIX}"
"celestial-7|Calm summer sea at night under a deep indigo star-filled sky, a single shooting star, thin crescent moon, gentle dark waves in the lower third${SUFFIX}"
"celestial-8|Meteor shower over a dark mountain lake, several meteor streaks fanning across the upper sky, mirror-calm lake reflection in the bottom half, dense stars${SUFFIX}"
"celestial-9|Large golden harvest moon low over misty autumn fields at night, deep blue starry sky, distant tree silhouettes at the bottom edge${SUFFIX}"
"celestial-10|Cold autumn night sky with a faint rust-colored nebula, scattered bright stars over rolling dark hills with autumn woodland at the bottom${SUFFIX}"
"celestial-11|Late autumn night, bare tree silhouettes along a riverbank, a few meteor streaks crossing a deep indigo sky, faint stars${SUFFIX}"
"celestial-12|Winter night over snow-covered fir trees, brilliant crisp starfield, a subtle green aurora band in the upper sky, moonlit snow in the lower half${SUFFIX}"
"magical-5|Enchanted spring forest at twilight, an arch of glowing cherry blossom branches, drifting fireflies, mossy path winding into soft mist${SUFFIX}"
"magical-6|Magical summer glade at dusk, giant glowing foxglove flowers, golden pollen light floating in the air, tall ferns${SUFFIX}"
"magical-7|Enchanted lily pond at night, luminous water lilies glowing teal and gold, hanging willow branches, floating sparkles${SUFFIX}"
"magical-8|Mystic grove at twilight, a ring of glowing amber mushrooms, drifting golden dust motes, dark tree silhouettes${SUFFIX}"
"magical-9|Autumn enchanted forest, glowing amber toadstools among falling autumn leaves, soft mist, warm golden light${SUFFIX}"
"magical-10|Magical autumn path at dusk lined with softly glowing round paper lanterns, violet twilight, falling golden leaves sparkling${SUFFIX}"
"magical-11|Ancient enchanted oak tree at twilight, golden leaves swirling in a gentle spiral around it, low rolling fog${SUFFIX}"
"magical-12|Winter enchantment, snow-laden pine trees glowing with soft blue-violet light, gentle golden sparkles falling like snow${SUFFIX}"
"shahanshahi-5|Ancient Persepolis stone columns rising from a field of red poppies, spring golden hour light, warm sandstone reliefs${SUFFIX}"
"shahanshahi-6|Achaemenid palace terrace at summer noon, rows of cypress trees, deep turquoise sky, carved stone double-bull capitals${SUFFIX}"
"shahanshahi-7|Winged lamassu gateway of ancient Persia at warm sunset, long shadows, golden sandstone reliefs, deep amber sky${SUFFIX}"
"shahanshahi-8|Lotus pond reflecting an ancient Persian palace at dusk, golden light on carved columns, still water${SUFFIX}"
"shahanshahi-9|Bas-relief procession of ancient Persian guards carved in amber stone, soft early autumn light, warm golden tones${SUFFIX}"
"shahanshahi-10|Winged Faravahar relief glowing at golden dusk, copper and gold tones, weathered ancient stone${SUFFIX}"
"shahanshahi-11|Ancient cypress avenue leading to stone ruins at misty dusk in late autumn, muted gold light${SUFFIX}"
"shahanshahi-12|Snow dusting ancient Persepolis columns under an indigo winter sky, warm lantern glow at the base of the ruins${SUFFIX}"
"japanese-5|Mount Fuji with fresh green slopes at dawn, pink azalea blossoms in the foreground, soft pastel sky${SUFFIX}"
"japanese-6|Rainy season garden, blue and violet hydrangea flowers with a mossy stone lantern, soft mist, teal palette${SUFFIX}"
"japanese-7|Summer fireworks blooming over a dark river, silhouette of Mount Fuji, warm paper lantern glow at the water's edge${SUFFIX}"
"japanese-8|Silver pampas grass field at dusk swaying in the wind, low red sun disc, silhouette of Mount Fuji${SUFFIX}"
"japanese-9|Full harvest moon over a thatched roof cottage among pampas grass, deep indigo night, soft clouds${SUFFIX}"
"japanese-10|Autumn mountain canyon with a vermilion wooden bridge and a five-story pagoda, crimson maples, morning mist${SUFFIX}"
"japanese-11|Vermilion torii gate corridor under a crimson maple canopy, mossy stone path, soft late autumn light${SUFFIX}"
"japanese-12|Snow-capped Mount Fuji at dawn with a red winter sun, snow-covered stone lanterns, pale pink sky${SUFFIX}"
"korean-5|Korean hanok courtyard in spring, curved tiled roofs, cherry petals drifting in the air, forsythia in bloom${SUFFIX}"
"korean-6|Lotus pond with an arched stone bridge in early summer, lush green rolling hills, soft summer haze${SUFFIX}"
"korean-7|Monsoon rain on hanok eaves, warm paper lantern glow, wet stone courtyard with reflections${SUFFIX}"
"korean-8|Field of white buckwheat blossoms under a high summer sky, distant misty mountain ridges${SUFFIX}"
"korean-9|Full harvest moon over hanok village rooftops, golden rice fields in the foreground, deep blue night${SUFFIX}"
"korean-10|Ancient palace wall lined with golden ginkgo trees in autumn, fallen leaves carpeting the stone path${SUFFIX}"
"korean-11|Bare persimmon tree with bright orange fruit beside curved traditional giwa roofs, soft late autumn haze${SUFFIX}"
"korean-12|Korean hanok village under fresh snow, curved tiled roofs capped in white, bare branches, pale winter sun${SUFFIX}"
"chinese-5|Chinese ink-wash painting style lotus pond with dragonflies, mist over the water, delicate green lily pads${SUFFIX}"
"chinese-6|Li River karst mountains in summer rain mist, lone bamboo raft with a fisherman, ink-wash style, muted greens${SUFFIX}"
"chinese-7|Pink lotus blossoms in full bloom with golden koi fish below, a plain round vermilion red sun disc, ink-wash style${SUFFIX}"
"chinese-8|Willow trees shading a koi pond in high summer, red accents of swimming fish among green pads, ink-wash style${SUFFIX}"
"chinese-9|Round moon gate doorway in a garden wall with early autumn osmanthus blossoms, soft golden light${SUFFIX}"
"chinese-10|Ancient temple courtyard with a giant golden ginkgo tree, red lanterns hanging from above, late autumn${SUFFIX}"
"chinese-11|Red-crowned cranes flying over a misty reed marsh at dusk, ink-wash style, muted gold tones${SUFFIX}"
"chinese-12|Red plum blossoms blooming in snow, ink-wash style branches, plain round vermilion red sun disc, white snow ground${SUFFIX}"
"seasonal-spring-5|Late spring meadow with red poppies and blossoming trees, soft white clouds, gentle warm light${SEASUFFIX}"
"seasonal-summer-5|Late summer golden wheat field with sunflowers and dragonflies, warm hazy light${SEASUFFIX}"
"seasonal-autumn-3|Late autumn scene with bare trees, last golden leaves falling, pumpkins and harvest baskets, soft fog${SEASUFFIX}"
"seasonal-winter-3|Late winter with melting snow, snowdrop flowers blooming, pale sunshine, hints of coming spring${SEASUFFIX}"
)

TOTAL=${#ITEMS[@]}
DONE=0
FAILED=""

for item in "${ITEMS[@]}"; do
  name="${item%%|*}"
  prompt="${item#*|}"
  ok=0
  for attempt in 1 2; do
    echo "[$(date +%H:%M:%S)] ($((DONE+1))/$TOTAL) $name attempt $attempt"
    z-ai image -p "$prompt" -s 1344x768 -o "$OUT/$name.jpg" >> "$OUT/cli.log" 2>&1
    if [ -s "$OUT/$name.jpg" ] && file "$OUT/$name.jpg" | grep -q "JPEG image data" && [ "$(stat -c%s "$OUT/$name.jpg")" -gt 30000 ]; then
      cp "$OUT/$name.jpg" "$WEB/$name.jpg"
      cp "$OUT/$name.jpg" "$DROID/hero_$(echo "$name" | tr '-' '_').jpg"
      ok=1
      break
    else
      echo "  retry needed: $(file -b "$OUT/$name.jpg" 2>/dev/null) size=$(stat -c%s "$OUT/$name.jpg" 2>/dev/null || echo 0)"
      sleep 3
    fi
  done
  if [ "$ok" = 1 ]; then
    DONE=$((DONE+1))
    echo "[$(date +%H:%M:%S)] OK $name ($DONE/$TOTAL)"
  else
    FAILED="$FAILED $name"
    echo "[$(date +%H:%M:%S)] FAIL $name"
  fi
done

echo "=========================================="
echo "GENERATION COMPLETE: $DONE/$TOTAL succeeded"
if [ -n "$FAILED" ]; then echo "FAILED:$FAILED"; fi
echo "ALL_DONE_15IMG"
