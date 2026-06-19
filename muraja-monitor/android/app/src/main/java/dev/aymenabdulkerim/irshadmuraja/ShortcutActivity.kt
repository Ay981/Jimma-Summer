package dev.aymenabdulkerim.irshadmuraja

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class ShortcutActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val destination = when (intent?.data?.host) {
            "dashboard" -> "https://irshad-muraja.aymenabdulkerim.dev/student/dashboard"
            "submit"    -> "https://irshad-muraja.aymenabdulkerim.dev/student/dashboard#submit"
            else        -> null
        }

        val main = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            if (destination != null) putExtra("shortcut_url", destination)
        }
        startActivity(main)
        finish()
    }
}
