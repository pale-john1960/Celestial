package com.celestial.calendar.ui

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap

/**
 * Celestial — downsampled artwork cache (round 15, YearView scroll perf).
 *
 * The hero jpgs in `res/drawable-nodpi/` are 1344×768; `painterResource`
 * decodes them at FULL resolution, and the YearView grid shows up to 13
 * month-card banners at once — decoding megapixel bitmaps per card made
 * the LazyVerticalGrid scroll lag (user round-15 report). This cache decodes
 * each resource ONCE, power-of-2 downsampled to the banner's real on-screen
 * size (~256 px wide: the banner is 44 dp tall at half-screen width), and
 * keeps the last 24 bitmaps (entry-count budget — a year grid never needs
 * more than 13, so the working set always stays resident).
 *
 * Used by YearView's mini month cards; the full-bleed HeroHeader keeps
 * `painterResource` (single image, worth the resolution).
 */
object ArtCache {

    /** resId@reqWidth → decoded ImageBitmap (entry-count budget: 24). */
    private val cache = object : LruCache<String, ImageBitmap>(24) {
        override fun sizeOf(key: String, value: ImageBitmap): Int = 1 // count entries
    }

    /**
     * Decode [resId] downsampled to ~[reqWidthPx] (power-of-2 inSampleSize,
     * two-pass: inJustDecodeBounds then the real decode) and cache it.
     * Thread-safe (LruCache synchronizes internally); falls back to a 1×1
     * bitmap if the resource cannot be decoded.
     */
    fun decode(context: Context, resId: Int, reqWidthPx: Int): ImageBitmap {
        val key = "$resId@$reqWidthPx"
        cache.get(key)?.let { return it }

        // pass 1: bounds only
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeResource(context.resources, resId, bounds)
        var sample = 1
        var width = bounds.outWidth
        while (width / 2 >= reqWidthPx) {
            sample *= 2
            width /= 2
        }

        // pass 2: real decode at the sampled size
        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        val bmp = BitmapFactory.decodeResource(context.resources, resId, opts)
            ?: Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888) // defensive: never null
        val image = bmp.asImageBitmap()
        cache.put(key, image)
        return image
    }
}
