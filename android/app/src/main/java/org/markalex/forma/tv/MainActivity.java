package org.markalex.forma.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public final class MainActivity extends Activity {
    private WebView web;
    private FrameLayout frame;
    private LinearLayout errorPanel;
    private ProgressBar progress;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeout = () -> showError();
    private boolean failed;
    private String tvScript;
    private final String[] packages = {"com.google.android.youtube.tv", "com.google.android.youtube"};

    private String text(String ru, String he, String en) {
        String language = Locale.getDefault().getLanguage();
        return "he".equals(language) || "iw".equals(language) ? he : "en".equals(language) ? en : ru;
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        try (InputStream input = getAssets().open("tv.js")) {
            java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            tvScript = output.toString(StandardCharsets.UTF_8.name());
        } catch (java.io.IOException e) { tvScript = ""; }
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(246, 245, 240));
        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(18), 0, dp(12), 0);
        toolbar.setBackgroundColor(Color.rgb(37, 52, 45));
        TextView brand = new TextView(this);
        brand.setText("F O R M A  ·  TV  0.1");
        brand.setTextColor(Color.WHITE);
        brand.setTextSize(15);
        toolbar.addView(brand, new LinearLayout.LayoutParams(0, dp(48), 1));
        Button test = button(text("Проверить YouTube", "בדיקת YouTube", "Test YouTube"));
        test.setOnClickListener(v -> openVideo("v7AYKMP6rOE"));
        toolbar.addView(test);
        Button retry = button(text("Обновить", "רענון", "Reload"));
        retry.setOnClickListener(v -> loadStudio());
        toolbar.addView(retry);
        root.addView(toolbar);
        frame = new FrameLayout(this);
        root.addView(frame, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        createWebView();
        progress = new ProgressBar(this);
        FrameLayout.LayoutParams spinner = new FrameLayout.LayoutParams(dp(48), dp(48), Gravity.CENTER);
        frame.addView(progress, spinner);
        createErrorPanel();
        loadStudio();
    }

    private Button button(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(12);
        button.setAllCaps(false);
        button.setMinHeight(dp(44));
        return button;
    }

    @SuppressLint("SetJavaScriptEnabled") private void createWebView() {
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(246,245,240));
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String target = request.getUrl().toString();
                if (!request.isForMainFrame()) return true;
                if (VideoLinks.isStudio(target)) return false;
                String id = VideoLinks.videoId(target);
                if (id != null && VideoLinks.isStudio(view.getUrl())) openVideo(id);
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                if (progress != null) progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (!VideoLinks.isStudio(url) || failed) return;
                handler.removeCallbacks(timeout);
                progress.setVisibility(View.GONE);
                view.evaluateJavascript(tvScript, null);
                view.requestFocus();
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showError();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 400) showError();
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                frame.removeView(view);
                view.destroy();
                web = null;
                showError();
                return true;
            }
        });
        frame.addView(web, 0, new FrameLayout.LayoutParams(-1, -1));
    }

    private void createErrorPanel() {
        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(dp(35), dp(25), dp(35), dp(25));
        errorPanel.setBackgroundColor(Color.rgb(246,245,240));
        TextView message = new TextView(this);
        message.setText(text("Не удалось открыть студию.\nПроверьте подключение к интернету и попробуйте ещё раз.",
            "לא ניתן לפתוח את הסטודיו.\nבדקו את החיבור לאינטרנט ונסו שוב.",
            "Unable to open the studio.\nCheck your internet connection and try again."));
        message.setTextColor(Color.rgb(37,52,45));
        message.setTextSize(20);
        message.setGravity(Gravity.CENTER);
        errorPanel.addView(message);
        Button retry = button(text("Попробовать снова", "ניסיון נוסף", "Try again"));
        retry.setOnClickListener(v -> loadStudio());
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-2, -2);
        params.topMargin = dp(24);
        errorPanel.addView(retry, params);
        frame.addView(errorPanel, new FrameLayout.LayoutParams(-1,-1));
        errorPanel.setVisibility(View.GONE);
    }

    private void loadStudio() {
        failed = false;
        errorPanel.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
        if (web == null) createWebView();
        web.setVisibility(View.VISIBLE);
        handler.removeCallbacks(timeout);
        handler.postDelayed(timeout, 25000);
        web.loadUrl(VideoLinks.STUDIO + "?android=1&app=0.1.0");
    }

    private void showError() {
        failed = true;
        handler.removeCallbacks(timeout);
        if (progress != null) progress.setVisibility(View.GONE);
        if (web != null) web.setVisibility(View.GONE);
        if (errorPanel != null) {
            errorPanel.setVisibility(View.VISIBLE);
            errorPanel.getChildAt(1).requestFocus();
        }
    }

    private void openVideo(String id) {
        if (id == null || !id.matches("[A-Za-z0-9_-]{11}")) return;
        Uri uri = Uri.parse("https://www.youtube.com/watch?v=" + id);
        for (String packageName : packages) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri).setPackage(packageName));
                return;
            } catch (ActivityNotFoundException ignored) { /* Try the next supported player. */ }
        }
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException e) {
            Toast.makeText(this, text("Установите или включите YouTube на приставке.",
                "יש להתקין או להפעיל את YouTube במכשיר.",
                "Install or enable YouTube on the TV box."), Toast.LENGTH_LONG).show();
        }
    }

    @Override public void onBackPressed() {
        if (web != null && !failed) {
            web.evaluateJavascript("(function(){var d=document.querySelector('dialog[open]');if(d){d.close();return 'dialog';}return 'exit';})()", result -> {
                if (!"\"dialog\"".equals(result)) confirmExit();
            });
        } else confirmExit();
    }

    private void confirmExit() {
        new AlertDialog.Builder(this).setTitle(text("Выйти из FORMA?", "לצאת מ־FORMA?", "Exit FORMA?"))
            .setNegativeButton(text("Остаться", "להישאר", "Stay"), (dialog, which) -> dialog.dismiss())
            .setPositiveButton(text("Выйти", "יציאה", "Exit"), (dialog, which) -> finish()).show();
    }

    @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (web != null) { frame.removeView(web); web.destroy(); web = null; }
        super.onDestroy();
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
}
