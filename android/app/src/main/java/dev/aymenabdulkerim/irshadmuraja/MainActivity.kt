package dev.aymenabdulkerim.irshadmuraja

import android.Manifest
import android.app.DownloadManager
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.URLUtil
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.getcapacitor.BridgeActivity
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : BridgeActivity() {

    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var loadingOverlay: View
    private lateinit var offlineOverlay: View

    private val notifPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* granted or denied — FCM still works either way for data messages */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupEdgeToEdge()
        setupWebViewEnhancements()
        setupFcm()

        // Handle shortcut deep-link
        intent?.getStringExtra("shortcut_url")?.let { url ->
            bridge.webView.loadUrl(url)
        }
    }

    // ── FCM token registration ─────────────────────────────────────────────────

    private fun setupFcm() {
        // Request POST_NOTIFICATIONS permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            getSharedPreferences("fcm", Context.MODE_PRIVATE)
                .edit()
                .putString("token", token)
                .putBoolean("pending_sync", true)
                .apply()
        }.addOnFailureListener { e ->
            android.util.Log.e("FCM", "Failed to get token", e)
        }
    }

    // Inject FCM token into WebView so the web app can register it with Laravel
    private fun injectFcmToken(view: WebView) {
        val token = getSharedPreferences("fcm", Context.MODE_PRIVATE)
            .getString("token", null) ?: return

        val escaped = token.replace("\\", "\\\\").replace("\"", "\\\"")

        // Always attempt on each page load — server uses updateOrCreate so safe to repeat.
        // JS guards with __fcmToken so it only fires once per page session, and only
        // after a successful 2xx response so it retries on next navigation if auth fails.
        view.evaluateJavascript("""
            (function() {
                if (window.__fcmToken === "$escaped") return;
                var csrfToken = decodeURIComponent(
                    (document.cookie.split(';').map(function(c){return c.trim();})
                        .find(function(c){return c.startsWith('XSRF-TOKEN=');}) || '').split('=')[1] || ''
                );
                if (!csrfToken) return; // not logged in yet — will retry on next page
                fetch('/push/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': csrfToken
                    },
                    credentials: 'include',
                    body: JSON.stringify({ token: "$escaped" })
                }).then(function(r) {
                    if (r.ok) window.__fcmToken = "$escaped";
                }).catch(function(){});
            })();
        """.trimIndent(), null)
    }

    // ── Edge-to-edge + status/nav bar colours ─────────────────────────────────

    private fun setupEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#1a3a2a")
        window.navigationBarColor = Color.parseColor("#1a3a2a")

        val insetsController = WindowInsetsControllerCompat(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = false
        insetsController.isAppearanceLightNavigationBars = false
    }

    // ── All WebView enhancements ───────────────────────────────────────────────

    private fun setupWebViewEnhancements() {
        val webView = bridge.webView
        val parent  = webView.parent as ViewGroup

        // ── Pull-to-refresh ───────────────────────────────────────────────────
        val index = parent.indexOfChild(webView)
        parent.removeView(webView)

        swipeRefresh = SwipeRefreshLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setColorSchemeColors(Color.parseColor("#c9a227"))
            setProgressBackgroundColorSchemeColor(Color.parseColor("#1a3a2a"))
            setOnRefreshListener { webView.reload() }
        }
        swipeRefresh.addView(
            webView,
            ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        )

        // ── Loading + offline overlays ────────────────────────────────────────
        val container = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        container.addView(swipeRefresh)

        loadingOverlay = buildLoadingOverlay()
        offlineOverlay = buildOfflineOverlay(webView)
        container.addView(loadingOverlay)
        container.addView(offlineOverlay)

        parent.addView(container, index)

        // Prevent white flash — match the app's light background
        webView.setBackgroundColor(Color.parseColor("#f9fafb"))

        // ── WebViewClient (wrap original for Capacitor compatibility) ─────────
        val original = webView.webViewClient
        webView.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) =
                original.shouldOverrideUrlLoading(view, request)

            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                original.onPageStarted(view, url, favicon)
                if (isOnline()) {
                    loadingOverlay.visibility = View.VISIBLE
                    offlineOverlay.visibility = View.GONE
                } else {
                    loadingOverlay.visibility = View.GONE
                    offlineOverlay.visibility = View.VISIBLE
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                original.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                injectHapticJS(view)
                injectFcmToken(view)
                // Delay hiding so the page paints before the overlay lifts — prevents white flash
                view.postDelayed({ loadingOverlay.visibility = View.GONE }, 120)
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                original.onReceivedError(view, request, error)
                if (request.isForMainFrame) {
                    loadingOverlay.visibility = View.GONE
                    offlineOverlay.visibility = View.VISIBLE
                }
            }
        }

        // ── Haptic JavascriptInterface ────────────────────────────────────────
        webView.addJavascriptInterface(HapticInterface(this), "_Haptic")

        // ── Download handler — passes session cookies so auth'd files work ──
        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val cookies  = CookieManager.getInstance().getCookie(url)

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                if (cookies != null) addRequestHeader("Cookie", cookies)
                addRequestHeader("User-Agent", userAgent)
                setTitle(fileName)
                setDescription("Downloading…")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            }

            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(this, "Downloading $fileName…", Toast.LENGTH_SHORT).show()
        })
    }

    // ── Loading overlay ───────────────────────────────────────────────────────

    private fun buildLoadingOverlay(): View {
        val layout = LinearLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity     = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#1a3a2a"))
            visibility  = View.GONE
        }

        val logo = ImageView(this).apply {
            setImageResource(R.drawable.app_logo)
            setBackgroundResource(R.drawable.logo_card)
            setPadding(12.dp, 12.dp, 12.dp, 12.dp)
            layoutParams = LinearLayout.LayoutParams(120.dp, 120.dp).also { it.bottomMargin = 20.dp }
        }

        val spinner = ProgressBar(this).apply {
            indeterminateTintList = android.content.res.ColorStateList.valueOf(Color.parseColor("#c9a227"))
            layoutParams = LinearLayout.LayoutParams(48.dp, 48.dp)
        }

        layout.addView(logo)
        layout.addView(spinner)
        return layout
    }

    // ── Offline overlay ───────────────────────────────────────────────────────

    private fun buildOfflineOverlay(webView: WebView): View {
        val layout = LinearLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity     = Gravity.CENTER
            setPadding(40.dp, 40.dp, 40.dp, 40.dp)
            setBackgroundColor(Color.parseColor("#1a3a2a"))
            visibility  = View.GONE
        }

        val logo = ImageView(this).apply {
            setImageResource(R.drawable.app_logo)
            alpha = 0.6f
            layoutParams = LinearLayout.LayoutParams(100.dp, 100.dp).also { it.bottomMargin = 20.dp }
        }

        val title = TextView(this).apply {
            text = "You're offline"
            setTextColor(Color.WHITE)
            textSize = 22f
            gravity  = Gravity.CENTER
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).also { it.bottomMargin = 8.dp }
        }

        val sub = TextView(this).apply {
            text = "Check your connection and try again"
            setTextColor(Color.parseColor("#9ca3af"))
            textSize = 14f
            gravity  = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).also { it.bottomMargin = 32.dp }
        }

        val retryBtn = android.widget.Button(this).apply {
            text = "Retry"
            setTextColor(Color.parseColor("#1a3a2a"))
            setBackgroundColor(Color.parseColor("#c9a227"))
            textSize = 15f
            setPadding(40.dp, 12.dp, 40.dp, 12.dp)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            setOnClickListener {
                if (isOnline()) {
                    offlineOverlay.visibility = View.GONE
                    webView.reload()
                } else {
                    vibrate()
                }
            }
        }

        layout.addView(logo)
        layout.addView(title)
        layout.addView(sub)
        layout.addView(retryBtn)
        return layout
    }

    // ── Haptic JS injection ───────────────────────────────────────────────────

    private fun injectHapticJS(view: WebView) {
        view.evaluateJavascript(
            """
            (function() {
                if (window.__hapticInjected) return;
                window.__hapticInjected = true;
                document.addEventListener('touchstart', function(e) {
                    var el = e.target;
                    while (el && el !== document.body) {
                        var tag = el.tagName;
                        if (tag === 'BUTTON' || tag === 'A' ||
                            el.getAttribute('role') === 'button' ||
                            el.style && el.style.cursor === 'pointer') {
                            if (window._Haptic) window._Haptic.tap();
                            return;
                        }
                        el = el.parentElement;
                    }
                }, { passive: true });
            })();
            """.trimIndent(),
            null
        )
    }

    // ── Back button — go back in history before exiting ───────────────────────

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val wv = bridge.webView
        if (wv.canGoBack()) wv.goBack() else super.onBackPressed()
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val net = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(net) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun vibrate() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vm.defaultVibrator.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            val v = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            @Suppress("DEPRECATION")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                v.vibrate(40)
            }
        }
    }

    private val Int.dp: Int get() = (this * resources.displayMetrics.density).toInt()

    // ── Inner class: haptic interface exposed to JS ───────────────────────────

    inner class HapticInterface(private val ctx: MainActivity) {
        @android.webkit.JavascriptInterface
        fun tap() = ctx.vibrate()
    }
}
