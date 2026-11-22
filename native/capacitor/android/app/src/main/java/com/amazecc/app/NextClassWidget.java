package com.amazecc.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget: the next class (time, course, room) and attendance.
 *
 * The web app stores today's and tomorrow's classes with their start times
 * (AmazeNativePlugin.updateWidget); the widget picks "next" against the
 * clock each time it draws, so it stays right between syncs. Android redraws
 * it every 30 minutes (next_class_widget_info.xml) and whenever the app
 * sends new data. Tapping it opens the app.
 */
public class NextClassWidget extends AppWidgetProvider {
    static final String PREFS = "amazecc_widget";
    static final String KEY = "data";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, views(context));
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, NextClassWidget.class));
        for (int id : ids) manager.updateAppWidget(id, views(context));
    }

    static RemoteViews views(Context context) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_next_class);
        String label = "Next class";
        String main = "Open AmazeCC to sync";
        String sub = "";
        String footer = "";
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONObject data = new JSONObject(prefs.getString(KEY, "{}"));
            footer = data.optString("attendance", "");
            JSONArray classes = data.optJSONArray("classes");
            long now = System.currentTimeMillis();
            JSONObject next = null;
            if (classes != null) {
                for (int i = 0; i < classes.length(); i++) {
                    JSONObject c = classes.getJSONObject(i);
                    // Keep showing a class until 10 minutes after it starts.
                    if (c.optLong("start") + 10 * 60_000L > now) {
                        next = c;
                        break;
                    }
                }
            }
            if (next != null) {
                boolean now_ = next.optLong("start") <= now;
                label = now_ ? "Now" : next.optString("when", "Next");
                main = next.optString("title", "Class");
                sub = next.optString("detail", "");
            } else if (classes != null && classes.length() > 0) {
                label = "No more classes";
                main = "You are free";
                sub = "Until the next synced day";
            }
        } catch (Exception ignored) {
            // Fall back to the defaults above.
        }
        v.setTextViewText(R.id.widget_label, label);
        v.setTextViewText(R.id.widget_title, main);
        v.setTextViewText(R.id.widget_detail, sub);
        v.setTextViewText(R.id.widget_footer, footer);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        v.setOnClickPendingIntent(R.id.widget_root, pi);
        return v;
    }
}
