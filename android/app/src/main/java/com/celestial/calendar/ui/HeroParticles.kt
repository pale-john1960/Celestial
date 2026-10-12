package com.celestial.calendar.ui

/*
 * Celestial — animated hero particle overlay (round 15).
 *
 * Compose Canvas port of the web's theme-aware particle system:
 *  - theme → (variant, tone) mapping: web src/components/celestial/HeroHeader.tsx
 *    heroParticles() (lines ~340-360) + PARTICLE_BY_SEASON (lines ~333-338):
 *      seasonal → petals/fireflies/leaves/snow by season (default tone)
 *      celestial → stars · magical → sparkles · shahanshahi → goldDust
 *      japanese → petals(subdued) · korean → fireflies(cool)
 *      chinese → goldDust(redGold)
 *  - per-variant palettes, seeds, counts, sizes, durations + the per-particle
 *    parameter builders: web src/components/celestial/SeasonalParticles.tsx
 *    (BASE_PALETTE ~48-56, TONE_PALETTE ~59-68, VARIANT_SPECS ~86-94,
 *    petalStyle/leafStyle/snowStyle/wanderStyle/starStyle/dustStyle ~114-250)
 *  - motion math: the CSS keyframes in src/app/globals.css
 *    (.celestial-petal / -leaf / -leaf-blow / -snow / -firefly / -sparkle /
 *    -star / -dust, lines ~209-450), re-expressed as pure functions of
 *    elapsed time (piecewise keyframe interpolation with smoothstep easing —
 *    CSS ease-in-out — or linear interpolation where the web uses `linear`).
 *
 * Determinism: the particle layout comes from a mulberry32 PRNG seeded per
 * variant/tone (web SeasonalParticles.tsx ~30-39, seed + 7919 for non-default
 * tones) — particles never reshuffle on recomposition. Positions are pure
 * functions of (t, canvas size); the frame clock only advances t.
 *
 * Density: ~2× the web desktop counts (petals 24, fireflies 22, leaves 24,
 * snow 28, stars 28, sparkles 20, gold dust 28) — the web also layers a
 * 3-layer dark-mode starfield under these on desktop, and Android's banner is
 * shorter; effective density stays close to the web. Particle alpha never
 * exceeds ~0.85 so the date text keeps its contrast.
 *
 * Accessibility/battery: when the system "remove animations" setting is on
 * (animator duration scale = 0) nothing is drawn at all — the web hides the
 * overlay entirely under prefers-reduced-motion. The frame loop only runs
 * while the header is composed; each frame is ~28 trivial draw calls.
 */

import android.provider.Settings
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.celestial.calendar.data.HeaderTheme
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.min

/** degrees → radians as a Float (avoid Double mixing in draw math) */
private const val DEG_TO_RAD = 0.017453292f

/** Particle motion variants (web SeasonalParticles.tsx lines 17-24). */
enum class ParticleVariant { PETALS, FIREFLIES, LEAVES, SNOW, STARS, SPARKLES, GOLD_DUST }

/** Tone tweaks for variants shared between several header themes
 *  (web SeasonalParticles.tsx line 27). */
enum class ParticleTone { DEFAULT, COOL, RED_GOLD, SUBDUED }

/** Active (variant, tone) pair — the web heroParticles() return shape. */
data class HeroParticles(val variant: ParticleVariant, val tone: ParticleTone)

/**
 * Theme → particle system — exact port of the web's heroParticles() switch
 * (HeroHeader.tsx lines 340-360) + PARTICLE_BY_SEASON (lines 333-338).
 */
fun heroParticlesFor(headerTheme: HeaderTheme, season: Season): HeroParticles =
    when (headerTheme) {
        HeaderTheme.SEASONAL -> when (season) {
            Season.SPRING -> HeroParticles(ParticleVariant.PETALS, ParticleTone.DEFAULT)
            Season.SUMMER -> HeroParticles(ParticleVariant.FIREFLIES, ParticleTone.DEFAULT)
            Season.AUTUMN -> HeroParticles(ParticleVariant.LEAVES, ParticleTone.DEFAULT)
            Season.WINTER -> HeroParticles(ParticleVariant.SNOW, ParticleTone.DEFAULT)
        }
        HeaderTheme.CELESTIAL -> HeroParticles(ParticleVariant.STARS, ParticleTone.DEFAULT)
        HeaderTheme.MAGICAL -> HeroParticles(ParticleVariant.SPARKLES, ParticleTone.DEFAULT)
        HeaderTheme.SHAHANSHAHI -> HeroParticles(ParticleVariant.GOLD_DUST, ParticleTone.DEFAULT)
        HeaderTheme.JAPANESE -> HeroParticles(ParticleVariant.PETALS, ParticleTone.SUBDUED)
        HeaderTheme.KOREAN -> HeroParticles(ParticleVariant.FIREFLIES, ParticleTone.COOL)
        HeaderTheme.CHINESE -> HeroParticles(ParticleVariant.GOLD_DUST, ParticleTone.RED_GOLD)
    }

/**
 * The animated particle layer of the hero banner. Caller places it over the
 * scrim (web DOM order: image → tint → scrim → particles → text) — the web
 * mounts SeasonalParticles after the gradient scrim, before the text.
 * Decorative only (no semantics — matches the web's aria-hidden).
 */
@Composable
fun HeroParticlesOverlay(variant: ParticleVariant, tone: ParticleTone, modifier: Modifier = Modifier) {
    val particles = remember(variant, tone) { buildParticles(variant, tone) }

    // prefers-reduced-motion parity: the web hides the overlay entirely
    // (motion-reduce:hidden). Android's closest signal is the "remove
    // animations" accessibility switch (animator duration scale = 0).
    val context = LocalContext.current
    val animationsEnabled = remember(context) {
        try {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f,
            ) != 0f
        } catch (_: Exception) {
            true
        }
    }
    if (!animationsEnabled) return

    // frame clock → elapsed seconds; restarts when the variant changes so a
    // new season's system begins its loop from a clean state
    var elapsed by remember(variant) { mutableFloatStateOf(0f) }
    LaunchedEffect(variant) {
        var last = 0L
        while (true) {
            withFrameNanos { now ->
                if (last != 0L) elapsed += (now - last) / 1_000_000_000f
                last = now
            }
        }
    }

    Canvas(modifier = modifier) {
        val t = elapsed
        for (particle in particles) particle.draw(this, t)
    }
}

/* ---------------- deterministic PRNG (web mulberry32, lines 30-39) ---------------- */

private class Mulberry32(seed: Int) {
    private var a = seed

    /** next float in [0, 1) — bit-exact port of the web PRNG */
    fun next(): Float {
        a += 0x6D2B79F5
        var t = (a xor (a ushr 15)) * (a or 1)
        t = (t + ((t xor (t ushr 7)) * (t or 61))) xor t
        return ((t xor (t ushr 14)).toLong() and 0xFFFF_FFFFL) / 4294967296f
    }
}

/* ---------------- palettes (web BASE_PALETTE + TONE_PALETTE, lines 48-68) ---------------- */

private val BASE_PALETTE: Map<ParticleVariant, List<Color>> = mapOf(
    ParticleVariant.PETALS to listOf(Color(0xFFF9A8C9), Color(0xFFFAD0E0), Color(0xFFFFF6FA)),
    ParticleVariant.FIREFLIES to listOf(Color(0xFFFFD98A), Color(0xFFFFE9B8)),
    ParticleVariant.LEAVES to listOf(Color(0xFFE8A15A), Color(0xFFC96F35), Color(0xFFD98A3D), Color(0xFFB35C2A)),
    ParticleVariant.SNOW to listOf(Color(0xFFFFFFFF), Color(0xFFF5F2EC)),
    ParticleVariant.STARS to listOf(Color(0xFFF5F2EC)),
    ParticleVariant.SPARKLES to listOf(Color(0xFFE0559C), Color(0xFF4ECDC4), Color(0xFFFFD98A)),
    ParticleVariant.GOLD_DUST to listOf(Color(0xFFE8C468), Color(0xFFF5DEA8)),
)

/** per-tone palette overrides (variant × tone → colors, web lines 59-68) */
private val TONE_PALETTE: Map<ParticleVariant, Map<ParticleTone, List<Color>>> = mapOf(
    // japanese — softer, whiter sakura pinks
    ParticleVariant.PETALS to mapOf(
        ParticleTone.SUBDUED to listOf(Color(0xFFF6C9D8), Color(0xFFFBE9EF), Color(0xFFFFFDF8)),
    ),
    // korean — cool pale-gold / moon-green lanterns instead of warm amber
    ParticleVariant.FIREFLIES to mapOf(
        ParticleTone.COOL to listOf(Color(0xFFF0ECC8), Color(0xFFD8E6DA)),
    ),
    // chinese — festive red-gold (lantern festival) instead of plain gold
    ParticleVariant.GOLD_DUST to mapOf(
        ParticleTone.RED_GOLD to listOf(Color(0xFFE8C468), Color(0xFFE09552), Color(0xFFD25F4A)),
    ),
)

private fun paletteOf(variant: ParticleVariant, tone: ParticleTone): List<Color> =
    TONE_PALETTE[variant]?.get(tone) ?: BASE_PALETTE.getValue(variant)

/* ---------------- variant specs (web VARIANT_SPECS lines 86-94; counts
   roughly doubled — see the file header; sizes in dp keep the web px ranges) ---------------- */

private class VariantSpec(
    val count: Int,
    val subduedCount: Int, // subdued (japanese) tone: visibly sparser (web 8 vs 12)
    val sizeMin: Float,
    val sizeMax: Float, // dp
    val durMin: Float,
    val durMax: Float, // seconds
    val seed: Int,
)

private val VARIANT_SPECS: Map<ParticleVariant, VariantSpec> = mapOf(
    ParticleVariant.PETALS to VariantSpec(count = 24, subduedCount = 14, sizeMin = 6f, sizeMax = 11f, durMin = 10f, durMax = 16f, seed = 42),
    ParticleVariant.FIREFLIES to VariantSpec(count = 22, subduedCount = 14, sizeMin = 4f, sizeMax = 7f, durMin = 13f, durMax = 20f, seed = 1337),
    ParticleVariant.LEAVES to VariantSpec(count = 24, subduedCount = 14, sizeMin = 7f, sizeMax = 12f, durMin = 8f, durMax = 13f, seed = 777),
    ParticleVariant.SNOW to VariantSpec(count = 28, subduedCount = 16, sizeMin = 3f, sizeMax = 6f, durMin = 9f, durMax = 15f, seed = 2026),
    ParticleVariant.STARS to VariantSpec(count = 28, subduedCount = 16, sizeMin = 1f, sizeMax = 2.5f, durMin = 3.5f, durMax = 7f, seed = 555),
    ParticleVariant.SPARKLES to VariantSpec(count = 20, subduedCount = 12, sizeMin = 3f, sizeMax = 6f, durMin = 14f, durMax = 22f, seed = 909),
    ParticleVariant.GOLD_DUST to VariantSpec(count = 28, subduedCount = 16, sizeMin = 2f, sizeMax = 4f, durMin = 16f, durMax = 28f, seed = 626),
)

/** alpha ceiling — the web lets particles reach opacity 1; Android caps at
 *  0.85 so the white date text keeps contrast over the smaller banner. */
private const val ALPHA_CAP = 0.85f

/* ---------------- keyframe math (globals.css keyframes, lines 209-450) ---------------- */

/** progress through a particle's loop, in [0, 1) — negative-safe modulo */
private fun cycle(t: Float, dur: Float, phase: Float): Float {
    val p = (t / dur + phase) % 1f
    return if (p < 0f) p + 1f else p
}

/**
 * Piecewise keyframe interpolation. [eased] = CSS ease-in-out between stops
 * (≈ smoothstep); false = CSS `linear` (the snow fall + dust drift timing).
 * [values] may be per-particle (wander waypoints) — precomputed at build
 * time so the draw loop allocates nothing.
 */
private fun kf(p: Float, stops: FloatArray, values: FloatArray, eased: Boolean): Float {
    if (p <= stops[0]) return values[0]
    val last = stops.size - 1
    for (i in 0 until last) {
        if (p <= stops[i + 1]) {
            val span = stops[i + 1] - stops[i]
            if (span <= 0f) return values[i + 1]
            var f = (p - stops[i]) / span
            if (eased) f = f * f * (3f - 2f * f)
            return values[i] + (values[i + 1] - values[i]) * f
        }
    }
    return values[last]
}

// shared keyframe stops (globals.css)
private val K5 = floatArrayOf(0f, 0.25f, 0.5f, 0.75f, 1f)
private val K4 = floatArrayOf(0f, 0.3f, 0.55f, 1f)
private val FADE_STOPS = floatArrayOf(0f, 0.08f, 0.9f, 1f) // petal/leaf fade in/out
private val BLOW_FADE_STOPS = floatArrayOf(0f, 0.08f, 0.85f, 1f) // gust leaves
private val SNOW_FADE_STOPS = floatArrayOf(0f, 0.06f, 0.94f, 1f)
private val FADE_VALS = floatArrayOf(0f, 1f, 1f, 0f)
private val PULSE_STOPS = floatArrayOf(0f, 0.5f, 1f)
private val FIREFLY_PULSE_VALS = floatArrayOf(0.13f, ALPHA_CAP, 0.13f) // web 0.15→1→0.15, capped
private val STAR_PULSE_VALS = floatArrayOf(0.21f, ALPHA_CAP, 0.21f) // web 0.25→1→0.25, capped
private val SHIMMER_VALS = floatArrayOf(0.06f, 1f, 0.06f) // web dust-shimmer 0.05→pOpacity→0.05

// petal-fall (globals.css @keyframes petal-fall)
private val PETAL_X_VALS = floatArrayOf(0f, -1f, 1f, -0.6f, 0f)
private val PETAL_ROT_VALS = floatArrayOf(0f, 0.3f, 0.6f, 0.85f, 1f)

// leaf-fall (@keyframes leaf-fall)
private val LEAF_X_VALS = floatArrayOf(0f, -1.2f, 1f, -0.8f, 0f)
private val LEAF_ROT_VALS = floatArrayOf(0f, 0.25f, 0.55f, 0.82f, 1f)

// shared vertical fall: starts above the top edge (web: -40px), then the
// 0.25/0.5/0.75/1 fractions of --fall-y
private val FALL_Y_VALS = floatArrayOf(-0.12f, 0.25f, 0.5f, 0.75f, 1f)

// leaf-blow (@keyframes leaf-blow): -12vw → 28vw → 58vw → 118vw across
private val BLOW_X_VALS = floatArrayOf(-0.12f, 0.28f, 0.58f, 1.18f)
private val BLOW_Y_VALS = floatArrayOf(0f, -1f, 0.4f, -0.2f) // × --blow-rise around --blow-y
private val BLOW_ROT_VALS = floatArrayOf(0f, 0.35f, 0.6f, 1f)

// snow-fall (@keyframes snow-fall): near-linear descent, ±jitter wiggle
private val SNOW_STOPS = floatArrayOf(0f, 0.2f, 0.4f, 0.6f, 0.8f, 1f)
private val SNOW_X_VALS = floatArrayOf(0f, 1f, -0.7f, 1f, -0.7f, 0f)
private val SNOW_Y_STOPS = floatArrayOf(0f, 1f)
private val SNOW_Y_VALS = floatArrayOf(-0.08f, 1f)

/** indices (mod 12) of the gust-rider leaves — web Set([2, 7, 10]) */
private val GUST_RIDERS = intArrayOf(2, 7, 10)

/* ---------------- particle model ---------------- */

private sealed interface Particle {
    /** draw at elapsed time [t] seconds — a pure function of (t, canvas size) */
    fun draw(scope: DrawScope, t: Float)
}

/** Petals — multi-phase sway while falling + tumble (rotate + rotateY).
 *  The 3D rotateY tumble is rendered as a horizontal squash (cos of the
 *  rotateY angle — the orthographic projection of rotateY). */
private class Petal(
    val left: Float, // 0..1 across the width
    val sizeDp: Float,
    val color: Color,
    val alpha: Float,
    val dur: Float,
    val phase: Float,
    val sway: Float, // amplitude, fraction of width (web --sway 24-70px)
    val fall: Float, // fall distance, fraction of height (web --fall-y 300-380px)
    val rot: Float, // total tumble degrees over the loop (web --rot 140-460)
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase)
        val w = size.width
        val h = size.height
        val x = left * w + kf(p, K5, PETAL_X_VALS, true) * sway * w
        val y = kf(p, K5, FALL_Y_VALS, true) * fall * h
        val rotDeg = kf(p, K5, PETAL_ROT_VALS, true) * rot
        // rotateY 0 → 720deg across the loop (petal-fall keyframes)
        val rotY = kf(p, K5, FALL_Y_VALS, true) * 720f
        val a = kf(p, FADE_STOPS, FADE_VALS, true) * alpha
        val s = sizeDp.dp.toPx()
        val sx = maxOf(abs(cos(rotY * DEG_TO_RAD)), 0.08f)
        rotate(rotDeg, pivot = Offset(x, y)) {
            drawRoundRect(
                color = color.copy(alpha = a),
                topLeft = Offset(x - (s * sx) / 2f, y - (s * 0.8f) / 2f),
                size = Size(s * sx, s * 0.8f),
                cornerRadius = CornerRadius(s * 0.45f),
            )
        }
    }
}

/** Leaves — like petals but sharper spin; some ride the gust instead
 *  (translateX-dominant blow-across with a slight rise/dip — leaf-blow). */
private class Leaf(
    val left: Float,
    val sizeDp: Float,
    val color: Color,
    val alpha: Float,
    val dur: Float,
    val phase: Float,
    val sway: Float,
    val fall: Float,
    val rot: Float, // web --rot 320-740
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase)
        val w = size.width
        val h = size.height
        val x = left * w + kf(p, K5, LEAF_X_VALS, true) * sway * w
        val y = kf(p, K5, FALL_Y_VALS, true) * fall * h
        val rotDeg = kf(p, K5, LEAF_ROT_VALS, true) * rot
        // rotateY 0 → 840deg across the loop (leaf-fall keyframes)
        val rotY = kf(p, K5, FALL_Y_VALS, true) * 840f
        val a = kf(p, FADE_STOPS, FADE_VALS, true) * alpha
        val s = sizeDp.dp.toPx()
        val sx = maxOf(abs(cos(rotY * DEG_TO_RAD)), 0.08f)
        rotate(rotDeg, pivot = Offset(x, y)) {
            drawRoundRect(
                color = color.copy(alpha = a),
                topLeft = Offset(x - (s * sx) / 2f, y - (s * 0.75f) / 2f),
                size = Size(s * sx, s * 0.75f),
                cornerRadius = CornerRadius(s * 0.3f), // sharper than petals
            )
        }
    }
}

/** Gust-rider leaves — blow across the header (leaf-blow keyframes). */
private class LeafBlow(
    val sizeDp: Float,
    val color: Color,
    val alpha: Float,
    val dur: Float,
    val phase: Float,
    val blowY: Float, // vertical band, fraction of height (web --blow-y 30-210px)
    val rise: Float, // rise/dip amplitude, fraction of height (web --blow-rise 24-60px)
    val rot: Float,
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase)
        val w = size.width
        val h = size.height
        val x = kf(p, K4, BLOW_X_VALS, true) * w
        val y = (blowY + kf(p, K4, BLOW_Y_VALS, true) * rise) * h
        val rotDeg = kf(p, K4, BLOW_ROT_VALS, true) * rot
        val a = kf(p, BLOW_FADE_STOPS, FADE_VALS, true) * alpha
        val s = sizeDp.dp.toPx()
        rotate(rotDeg, pivot = Offset(x, y)) {
            drawRoundRect(
                color = color.copy(alpha = a),
                topLeft = Offset(x - s / 2f, y - (s * 0.75f) / 2f),
                size = Size(s, s * 0.75f),
                cornerRadius = CornerRadius(s * 0.3f),
            )
        }
    }
}

/** Snow — near-linear fall with a gentle horizontal jitter (linear timing). */
private class Snow(
    val left: Float,
    val sizeDp: Float,
    val color: Color,
    val alpha: Float,
    val dur: Float,
    val phase: Float,
    val jitter: Float, // fraction of width (web --jit 8-22px)
    val fall: Float,
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase)
        val w = size.width
        val h = size.height
        val x = left * w + kf(p, SNOW_STOPS, SNOW_X_VALS, false) * jitter * w
        val y = kf(p, SNOW_Y_STOPS, SNOW_Y_VALS, false) * fall * h
        val a = kf(p, SNOW_FADE_STOPS, FADE_VALS, false) * alpha
        val s = sizeDp.dp.toPx()
        drawCircle(color = color.copy(alpha = a), radius = s / 2f, center = Offset(x, y))
    }
}

/** Fireflies / sparkles — closed-loop wander through per-particle waypoints
 *  with an independent glow pulse on its own clock. Waypoint value arrays
 *  are precomputed (wx1/wy1/wx2/wy2 → the 5-stop wander path, web
 *  firefly-wander keyframes + wanderStyle lines 182-211). */
private class Wanderer(
    val left: Float, // 0..1
    val top: Float, // 0..1 (web: 10-82% down the banner)
    val sizeDp: Float,
    val color: Color,
    val dur: Float,
    val phase: Float,
    val wxVals: FloatArray, // [0, wx1, wx1+wx2, wx2, 0] — fractions of width
    val wyVals: FloatArray, // [0, wy1, wy1+wy2, wy2, 0] — fractions of height
    val glowDur: Float,
    val glowPhase: Float,
    val sparkle: Boolean, // sparkles draw as 45° rotated diamonds (web rotate: 45deg)
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase)
        val gp = cycle(t, glowDur, glowPhase)
        val w = size.width
        val h = size.height
        val x = left * w + kf(p, K5, wxVals, true) * w
        val y = top * h + kf(p, K5, wyVals, true) * h
        // glow-pulse 0.15 → 1 → 0.15, capped at 0.85 (fireflies 6px glow @0.75,
        // sparkles 5px @0.85 in the web box-shadows)
        val a = kf(gp, PULSE_STOPS, FIREFLY_PULSE_VALS, true)
        val s = sizeDp.dp.toPx()
        val center = Offset(x, y)
        glowCircle(center, s * (if (sparkle) 2f else 2.2f), color, a * (if (sparkle) 0.6f else 0.55f))
        if (sparkle) {
            rotate(45f, pivot = center) {
                drawRoundRect(
                    color = color.copy(alpha = a),
                    topLeft = Offset(x - s / 2f, y - s / 2f),
                    size = Size(s, s),
                    cornerRadius = CornerRadius(s * 0.25f),
                )
            }
        } else {
            drawCircle(color = color.copy(alpha = a), radius = s / 2f, center = center)
        }
    }
}

/** Stars — fixed positions, opacity twinkle only (star-twinkle keyframes). */
private class Star(
    val left: Float, // 0..1
    val top: Float, // web keeps them in the top 54% (clear-sky area)
    val sizeDp: Float,
    val color: Color,
    val dur: Float,
    val phase: Float,
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase)
        val a = kf(p, PULSE_STOPS, STAR_PULSE_VALS, true) // 0.25 → 1 → 0.25, capped
        val x = left * size.width
        val y = top * size.height
        val s = sizeDp.dp.toPx()
        val center = Offset(x, y)
        glowCircle(center, s * 1.8f, color, a * 0.5f) // web box-shadow 3px @0.6
        drawCircle(color = color.copy(alpha = a), radius = s / 2f, center = center)
    }
}

/** Gold dust — slow diagonal drift (linear) + shimmering opacity on its own
 *  clock (dust-drift + dust-shimmer keyframes, dustStyle lines 231-249). */
private class Dust(
    val left: Float,
    val top: Float,
    val sizeDp: Float,
    val color: Color,
    val alpha: Float,
    val dur: Float,
    val phase: Float,
    val dx: Float, // horizontal drift, fraction of width (web --dx (r-0.35)×130px)
    val dy: Float, // downward drift, fraction of height (web --dy 70-220px)
    val shimDur: Float,
    val shimPhase: Float,
) : Particle {
    override fun draw(scope: DrawScope, t: Float) = with(scope) {
        val p = cycle(t, dur, phase) // drift is linear in time (CSS linear)
        val sp = cycle(t, shimDur, shimPhase)
        val x = (left + p * dx) * size.width
        val y = (top + p * dy) * size.height
        // shimmer 0.05 → pOpacity → 0.05; the edge fade masks the loop wrap
        val a = kf(sp, PULSE_STOPS, SHIMMER_VALS, true) * alpha *
            min(1f, min(p, 1f - p) * 10f)
        val s = sizeDp.dp.toPx()
        val center = Offset(x, y)
        glowCircle(center, s * 1.6f, color, a * 0.45f) // web box-shadow 4px @0.55
        drawCircle(color = color.copy(alpha = a), radius = s / 2f, center = center)
    }
}

/** soft radial glow — the web's box-shadow halo */
private fun DrawScope.glowCircle(center: Offset, radius: Float, color: Color, alpha: Float) {
    if (alpha <= 0.01f) return
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(color.copy(alpha = alpha), Color.Transparent),
            center = center,
            radius = radius,
        ),
        center = center,
        radius = radius,
    )
}

/* ---------------- builder (web buildParticles, lines 252-302) ---------------- */

private fun buildParticles(variant: ParticleVariant, tone: ParticleTone): List<Particle> {
    val spec = VARIANT_SPECS.getValue(variant)
    val colors = paletteOf(variant, tone)
    // subdued (japanese): slower + visibly sparser (web lines 255-259)
    val subdued = tone == ParticleTone.SUBDUED
    val pace = if (subdued) 1.35f else 1f
    val count = if (subdued) spec.subduedCount else spec.count
    val rand = Mulberry32(spec.seed + if (tone == ParticleTone.DEFAULT) 0 else 7919)

    // 3 of every 12 leaves ride the gust (web: Set([2, 7, 10]) of 12)
    fun isBlower(i: Int) = variant == ParticleVariant.LEAVES && (i % 12) in GUST_RIDERS

    return (0 until count).map { i ->
        val color = colors[i % colors.size]
        when (variant) {
            ParticleVariant.PETALS -> {
                // petalStyle (web lines 114-130): size, left, dur×pace, delay,
                // sway, fall-y, rot, opacity
                val size = spec.sizeMin + rand.next() * (spec.sizeMax - spec.sizeMin)
                Petal(
                    left = 0.03f + rand.next() * 0.94f,
                    sizeDp = size,
                    color = color,
                    alpha = (0.7f + rand.next() * 0.3f) * ALPHA_CAP,
                    dur = (10f + rand.next() * 6f) * pace,
                    phase = rand.next(),
                    sway = 0.04f + rand.next() * 0.08f,
                    fall = 1.05f + rand.next() * 0.25f,
                    rot = 140f + rand.next() * 320f,
                )
            }
            ParticleVariant.LEAVES -> {
                // leafStyle (web lines 133-162)
                val size = spec.sizeMin + rand.next() * (spec.sizeMax - spec.sizeMin)
                val phase = rand.next()
                val rot = 320f + rand.next() * 420f
                val alpha = (0.75f + rand.next() * 0.25f) * ALPHA_CAP
                if (isBlower(i)) {
                    LeafBlow(
                        sizeDp = size,
                        color = color,
                        alpha = alpha,
                        dur = 6.5f + rand.next() * 3f,
                        phase = phase,
                        blowY = 0.12f + rand.next() * 0.45f,
                        rise = 0.08f + rand.next() * 0.12f,
                        rot = rot,
                    )
                } else {
                    Leaf(
                        left = 0.02f + rand.next() * 0.96f,
                        sizeDp = size,
                        color = color,
                        alpha = alpha,
                        dur = 8f + rand.next() * 5f,
                        phase = phase,
                        sway = 0.04f + rand.next() * 0.08f,
                        fall = 1.05f + rand.next() * 0.3f,
                        rot = rot,
                    )
                }
            }
            ParticleVariant.SNOW -> {
                // snowStyle (web lines 165-179)
                Snow(
                    sizeDp = spec.sizeMin + rand.next() * (spec.sizeMax - spec.sizeMin),
                    left = 0.03f + rand.next() * 0.94f,
                    color = color,
                    alpha = (0.8f + rand.next() * 0.2f) * ALPHA_CAP,
                    dur = 9f + rand.next() * 6f,
                    phase = rand.next(),
                    jitter = 0.02f + rand.next() * 0.045f,
                    fall = 1.05f + rand.next() * 0.25f,
                )
            }
            ParticleVariant.FIREFLIES,
            ParticleVariant.SPARKLES -> {
                // wanderStyle (web lines 182-211): hard-coded 13 + r×8s wander
                // duration for BOTH wander variants (the web spec dur is unused
                // there); waypoints ±8% width / ±6% height; glow 2.6-4.8s
                val wx1 = (rand.next() - 0.5f) * 0.16f
                val wy1 = (rand.next() - 0.5f) * 0.12f
                val wx2 = (rand.next() - 0.5f) * 0.16f
                val wy2 = (rand.next() - 0.5f) * 0.12f
                Wanderer(
                    left = 0.04f + rand.next() * 0.92f,
                    top = 0.10f + rand.next() * 0.72f,
                    sizeDp = 4f + rand.next() * 3f,
                    color = color,
                    dur = 13f + rand.next() * 8f,
                    phase = rand.next(),
                    wxVals = floatArrayOf(0f, wx1, wx1 + wx2, wx2, 0f),
                    wyVals = floatArrayOf(0f, wy1, wy1 + wy2, wy2, 0f),
                    glowDur = 2.6f + rand.next() * 2.2f,
                    glowPhase = rand.next(),
                    sparkle = variant == ParticleVariant.SPARKLES,
                )
            }
            ParticleVariant.STARS -> {
                // starStyle (web lines 214-228)
                Star(
                    left = 0.02f + rand.next() * 0.96f,
                    top = 0.02f + rand.next() * 0.52f,
                    sizeDp = 1f + rand.next() * 1.6f,
                    color = color,
                    dur = 3.5f + rand.next() * 3.5f,
                    phase = rand.next(),
                )
            }
            ParticleVariant.GOLD_DUST -> {
                // dustStyle (web lines 231-249)
                Dust(
                    left = 0.03f + rand.next() * 0.94f,
                    top = 0.05f + rand.next() * 0.80f,
                    sizeDp = 2f + rand.next() * 2.5f,
                    color = color,
                    alpha = (0.6f + rand.next() * 0.4f) * ALPHA_CAP,
                    dur = 16f + rand.next() * 12f,
                    phase = rand.next(),
                    dx = (rand.next() - 0.35f) * 0.35f,
                    dy = 0.45f + rand.next() * 0.85f,
                    shimDur = 3.2f + rand.next() * 2.8f,
                    shimPhase = rand.next(),
                )
            }
        }
    }
}
