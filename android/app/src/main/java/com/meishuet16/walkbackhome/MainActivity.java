package com.meishuet16.walkbackhome;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ExternalBrowserPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
