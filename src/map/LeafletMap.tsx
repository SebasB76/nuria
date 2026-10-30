import { ComponentType, Ref, useEffect, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';

import { MAP_HTML } from './mapHtml';
import { MapEvent, MapScene } from './types';

// the published typings drop the ref, but the component forwards it with injectJavaScript
type WebViewHandle = { injectJavaScript: (js: string) => void };
const RefWebView = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewHandle> }>;

export function LeafletMap({ scene, onEvent, style }: { scene: MapScene; onEvent?: (e: MapEvent) => void; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<WebViewHandle>(null);
  const [ready, setReady] = useState(false);
  const json = JSON.stringify(scene);

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.setScene(${json});true;`);
  }, [json, ready]);

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#1b2229' }, style]}>
      <RefWebView
        ref={ref}
        source={{ html: MAP_HTML, baseUrl: 'https://nuria.local/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        nestedScrollEnabled
        // iOS pads the page for the notch and lets it bounce; Leaflet pans the map itself
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: '#1b2229' }}
        onMessage={(e: WebViewMessageEvent) => {
          const ev = JSON.parse(e.nativeEvent.data) as MapEvent;
          if (ev.type === 'ready') setReady(true);
          onEvent?.(ev);
        }}
      />
    </View>
  );
}
