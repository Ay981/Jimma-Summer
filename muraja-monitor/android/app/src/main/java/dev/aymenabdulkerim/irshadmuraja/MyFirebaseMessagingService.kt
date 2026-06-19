package dev.aymenabdulkerim.irshadmuraja

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Save token so MainActivity can inject it into the WebView on next load
        getSharedPreferences("fcm", Context.MODE_PRIVATE)
            .edit()
            .putString("token", token)
            .putBoolean("pending_sync", true)
            .apply()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title
            ?: message.data["title"]
            ?: "Irshad Muraja'a"
        val body  = message.notification?.body
            ?: message.data["body"]
            ?: ""
        val url   = message.data["url"]

        showNotification(title, body, url)
    }

    private fun showNotification(title: String, body: String, url: String?) {
        val channelId = "irshad_default"
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create channel (required on Android 8+)
        val channel = NotificationChannel(
            channelId,
            "Irshad Muraja'a",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Program notifications"
            enableVibration(true)
        }
        nm.createNotificationChannel(channel)

        // Tap intent — opens app and optionally deep-links to a URL
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            if (url != null) putExtra("shortcut_url", url)
        }
        val pi = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notif = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setSound(sound)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pi)
            .build()

        nm.notify(System.currentTimeMillis().toInt(), notif)
    }
}
