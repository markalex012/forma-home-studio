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
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import java.io.OutputStream;
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
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingBackup;
    private boolean externalVideo;
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
        brand.setText("LK Studio");
        brand.setTextColor(Color.WHITE);
        brand.setTextSize(15);
        toolbar.addView(brand, new LinearLayout.LayoutParams(0, dp(48), 1));
        Button retry = button(text("Обновить", "רענון", "Reload"));
        retry.setOnClickListener(v -> loadStudio());
        toolbar.addView(retry);
        root.addView(toolbar);
        frame = new FrameLayout(this);
        root.addView(frame, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
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
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView source, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json")
                        .addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(picker, 101);
                } catch (ActivityNotFoundException error) {
                    fileCallback.onReceiveValue(null); fileCallback = null;
                }
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String target = request.getUrl().toString();
                if (!request.isForMainFrame()) return true;
                if (VideoLinks.isStudio(target)) return false;
                String id = VideoLinks.videoId(target);
                if (VideoLinks.isStudio(view.getUrl())) {
                    if (id != null) openVideo(id);
                    else { byte[] backup = VideoLinks.backup(target); if (backup != null) createBackup(backup); }
                }
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
        if (web == null) {
            try { createWebView(); } catch (RuntimeException error) { showError(); return; }
        }
        web.setVisibility(View.VISIBLE);
        handler.removeCallbacks(timeout);
        handler.postDelayed(timeout, 25000);
        web.loadUrl(VideoLinks.STUDIO + "?android=1&app=1.0.0");
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
                externalVideo = true;
                return;
            } catch (ActivityNotFoundException ignored) { /* Try the next supported player. */ }
        }
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); externalVideo = true; }
        catch (ActivityNotFoundException e) {
            Toast.makeText(this, text("Установите или включите YouTube на приставке.",
                "יש להתקין או להפעיל את YouTube במכשיר.",
                "Install or enable YouTube on the TV box."), Toast.LENGTH_LONG).show();
        }
    }

    @Override public void onBackPressed() {
        if (web != null && !failed) {
            web.evaluateJavascript("(function(){if(window.formaBack && window.formaBack())return 'dialog';var d=document.querySelector('dialog[open]');if(d){d.close();return 'dialog';}return 'exit';})()", result -> {
                if (!"\"dialog\"".equals(result)) confirmExit();
            });
        } else confirmExit();
    }

    private void confirmExit() {
        new AlertDialog.Builder(this).setTitle(text("Выйти из LK Studio?", "לצאת מ־LK Studio?", "Exit LK Studio?"))
            .setNegativeButton(text("Остаться", "להישאר", "Stay"), (dialog, which) -> dialog.dismiss())
            .setPositiveButton(text("Выйти", "יציאה", "Exit"), (dialog, which) -> finish()).show();
    }

    @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            if (externalVideo && VideoLinks.isStudio(web.getUrl())) {
                externalVideo = false;
                web.evaluateJavascript("window.dispatchEvent(new Event('forma:resume'))", null);
            }
        }
    }
    @Override protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (web != null) { frame.removeView(web); web.destroy(); web = null; }
        super.onDestroy();
    }
    private void createBackup(byte[] data) {
        try {
            org.json.JSONObject json = new org.json.JSONObject(new String(data, StandardCharsets.UTF_8));
            if (!"forma-studio".equals(json.optString("format")) || json.optInt("version") != 1) return;
            pendingBackup = data;
            Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json")
                .addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE, "LK Studio-backup.json");
            startActivityForResult(save, 102);
        } catch (org.json.JSONException | ActivityNotFoundException error) {
            pendingBackup = null;
            Toast.makeText(this, text("Не удалось открыть сохранение. Используйте «Копировать текст».",
                "לא ניתן לפתוח שמירה. השתמשו בהעתקת טקסט.", "Unable to save a file. Use Copy text instead."), Toast.LENGTH_LONG).show();
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == 101 && fileCallback != null) {
            Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
            fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri});
            fileCallback = null;
        }
        if (request == 102 && pendingBackup != null) {
            byte[] payload = pendingBackup;
            pendingBackup = null;
            if (result == RESULT_OK && data != null && data.getData() != null) {
                try (OutputStream output = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (output == null) throw new java.io.IOException("No destination");
                    output.write(payload);
                    Toast.makeText(this, text("Копия сохранена", "הגיבוי נשמר", "Backup saved"), Toast.LENGTH_SHORT).show();
                } catch (java.io.IOException error) {
                    Toast.makeText(this, text("Не удалось сохранить файл", "שמירת הקובץ נכשלה", "Unable to save backup"), Toast.LENGTH_LONG).show();
                }
            }
        }
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
}
