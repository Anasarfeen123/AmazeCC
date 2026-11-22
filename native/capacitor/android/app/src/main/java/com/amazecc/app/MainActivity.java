package com.amazecc.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-local plugin: app lock and home-screen widget data.
        registerPlugin(AmazeNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
