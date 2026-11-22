package com.amazecc.app;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native bits the web app asks for (src/lib/nativeAndroid.ts):
 * - biometricStatus / authenticate: the app lock (fingerprint, face or the
 *   phone's screen lock as a fallback);
 * - updateWidget: the data the home-screen widget shows (NextClassWidget).
 */
@CapacitorPlugin(name = "AmazeNative")
public class AmazeNativePlugin extends Plugin {

    // Weak biometrics or the device PIN/pattern: works on every phone that
    // has a screen lock, and BIOMETRIC_WEAK | DEVICE_CREDENTIAL is valid on
    // all API levels (STRONG | CREDENTIAL is not on API 28-29).
    private static final int AUTHENTICATORS =
            BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL;

    @PluginMethod
    public void biometricStatus(PluginCall call) {
        int status = BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);
        JSObject result = new JSObject();
        result.put("available", status == BiometricManager.BIOMETRIC_SUCCESS);
        result.put("status", status);
        call.resolve(result);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        final String title = call.getString("title", "Unlock AmazeCC");
        final String subtitle = call.getString("subtitle", "");
        getActivity().runOnUiThread(() -> {
            BiometricPrompt prompt = new BiometricPrompt(
                    (FragmentActivity) getActivity(),
                    ContextCompat.getMainExecutor(getContext()),
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            JSObject r = new JSObject();
                            r.put("ok", true);
                            call.resolve(r);
                        }

                        @Override
                        public void onAuthenticationError(int code, CharSequence message) {
                            JSObject r = new JSObject();
                            r.put("ok", false);
                            r.put("code", code);
                            r.put("error", message == null ? "" : message.toString());
                            call.resolve(r);
                        }
                    });
            BiometricPrompt.PromptInfo.Builder info = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setAllowedAuthenticators(AUTHENTICATORS);
            if (subtitle != null && !subtitle.isEmpty()) info.setSubtitle(subtitle);
            prompt.authenticate(info.build());
        });
    }

    /** Store the widget's data (JSON string from the web app) and redraw it. */
    @PluginMethod
    public void updateWidget(PluginCall call) {
        String data = call.getString("data", "{}");
        SharedPreferences prefs = getContext().getSharedPreferences(NextClassWidget.PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(NextClassWidget.KEY, data).apply();
        NextClassWidget.updateAll(getContext());
        call.resolve();
    }
}
