package dev.aymenabdulkerim.irshadmuraja

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.animation.doOnEnd

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val logo     = findViewById<ImageView>(R.id.splash_logo)
        val welcome  = findViewById<TextView>(R.id.splash_welcome)
        val title    = findViewById<TextView>(R.id.splash_title)

        // ── 1. Logo fades in ──────────────────────────────────────────────
        val logoFade = ObjectAnimator.ofFloat(logo, View.ALPHA, 0f, 1f).apply {
            duration     = 500
            interpolator = DecelerateInterpolator()
        }

        // ── 2. Logo pulses (scale breathe) ────────────────────────────────
        val pulseX = ObjectAnimator.ofFloat(logo, View.SCALE_X, 1f, 1.10f, 1f).apply {
            duration      = 900
            repeatCount   = 2
            repeatMode    = ValueAnimator.RESTART
            interpolator  = AccelerateDecelerateInterpolator()
        }
        val pulseY = ObjectAnimator.ofFloat(logo, View.SCALE_Y, 1f, 1.10f, 1f).apply {
            duration      = 900
            repeatCount   = 2
            repeatMode    = ValueAnimator.RESTART
            interpolator  = AccelerateDecelerateInterpolator()
        }

        // ── 3. "Welcome to" slides up and fades in ────────────────────────
        welcome.translationY = 20f
        val welcomeFade = ObjectAnimator.ofFloat(welcome, View.ALPHA, 0f, 1f).apply {
            duration     = 500
            startDelay   = 600
            interpolator = DecelerateInterpolator()
        }
        val welcomeSlide = ObjectAnimator.ofFloat(welcome, View.TRANSLATION_Y, 20f, 0f).apply {
            duration     = 500
            startDelay   = 600
            interpolator = DecelerateInterpolator()
        }

        // ── 4. Title slides up and fades in ───────────────────────────────
        title.translationY = 24f
        val titleFade = ObjectAnimator.ofFloat(title, View.ALPHA, 0f, 1f).apply {
            duration     = 600
            startDelay   = 900
            interpolator = DecelerateInterpolator()
        }
        val titleSlide = ObjectAnimator.ofFloat(title, View.TRANSLATION_Y, 24f, 0f).apply {
            duration     = 600
            startDelay   = 900
            interpolator = DecelerateInterpolator()
        }

        // ── 5. Everything fades out, then launch MainActivity ─────────────
        val fadeOut = ObjectAnimator.ofFloat(
            window.decorView, View.ALPHA, 1f, 0f
        ).apply {
            duration   = 350
            startDelay = 2600
            interpolator = AccelerateDecelerateInterpolator()
            doOnEnd {
                startActivity(Intent(this@SplashActivity, MainActivity::class.java))
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
            }
        }

        AnimatorSet().apply {
            playTogether(
                logoFade,
                pulseX, pulseY,
                welcomeFade, welcomeSlide,
                titleFade, titleSlide,
                fadeOut,
            )
            start()
        }
    }
}
