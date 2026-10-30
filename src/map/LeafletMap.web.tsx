import { useEffect, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { MAP_HTML } from './mapHtml';
import { MapEvent, MapScene } from './types';

// web build for local testing: same page in a srcdoc iframe, which shares our origin
export function LeafletMap({ scene, onEvent, style }: { scene: MapScene; onEvent?: (e: MapEvent) => void; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });
  const json = JSON.stringify(scene);

  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || !e.data?.aguaje) return;
      const ev = e.data.aguaje as MapEvent;
      if (ev.type === 'ready') setReady(true);
      handler.current?.(ev);
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);

  useEffect(() => {
    if (ready) (ref.current?.contentWindow as any)?.setScene(JSON.parse(json));
  }, [json, ready]);

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#1b2229' }, style]}>
      <iframe ref={ref} srcDoc={MAP_HTML} style={{ border: 0, width: '100%', height: '100%' }} title="Mapa" />
    </View>
  );
}
