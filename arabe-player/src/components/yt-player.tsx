// Reproductor propio del IFrame oficial de YouTube sobre react-native-webview.
// (Reemplaza a react-native-youtube-iframe, que rompía el empaquetado de Android.)
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

export type YoutubeIframeRef = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
};

type Props = {
  width: number;
  height: number;
  videoId: string;
  play: boolean;
  onChangeState?: (state: string) => void;
  onError?: (error: string) => void;
};

function buildHtml(videoId: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}#p{width:100%;height:100%}</style>
</head><body><div id="p"></div>
<script>
var player=null, ready=false, queue=[];
var NAMES={'-1':'unstarted','0':'ended','1':'playing','2':'paused','3':'buffering','5':'cued'};
function send(o){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }
function run(c){
  try{
    if(c.a==='play') player.playVideo();
    else if(c.a==='pause') player.pauseVideo();
    else if(c.a==='seek') player.seekTo(c.s,true);
    else if(c.a==='load') player.loadVideoById(c.id);
  }catch(e){ send({t:'error',c:'cmd:'+String(e)}); }
}
window.__cmd=function(c){ if(!ready){ queue.push(c); return; } run(c); };
var tag=document.createElement('script'); tag.src='https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
function onYouTubeIframeAPIReady(){
  player=new YT.Player('p',{
    width:'100%', height:'100%', videoId:${JSON.stringify(videoId)},
    playerVars:{autoplay:1,playsinline:1,controls:1,rel:0,modestbranding:1,origin:'https://www.youtube.com'},
    events:{
      onReady:function(){ ready=true; send({t:'ready'}); while(queue.length){ run(queue.shift()); } },
      onStateChange:function(e){ send({t:'state',s:NAMES[e.data]||String(e.data),d:player.getDuration()}); },
      onError:function(e){ send({t:'error',c:String(e.data)}); }
    }
  });
}
setInterval(function(){ if(ready&&player&&player.getCurrentTime){ send({t:'time',c:player.getCurrentTime(),d:player.getDuration()}); } },500);
</script></body></html>`;
}

export const YoutubePlayer = forwardRef<YoutubeIframeRef, Props>(function YoutubePlayer(props, ref) {
  const web = useRef<WebView>(null);
  const cur = useRef(0);
  const dur = useRef(0);
  const latest = useRef(props);
  latest.current = props;
  const initialId = useRef(props.videoId);
  const html = useMemo(() => buildHtml(initialId.current), []);

  const run = (c: object) => {
    web.current?.injectJavaScript(`window.__cmd&&window.__cmd(${JSON.stringify(c)});true;`);
  };

  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds: number) => run({ a: 'seek', s: seconds }),
      getCurrentTime: async () => cur.current,
      getDuration: async () => dur.current,
    }),
    [],
  );

  const firstId = useRef(true);
  useEffect(() => {
    if (firstId.current) {
      firstId.current = false;
      return;
    }
    cur.current = 0;
    dur.current = 0;
    run({ a: 'load', id: props.videoId });
  }, [props.videoId]);

  const firstPlay = useRef(true);
  useEffect(() => {
    if (firstPlay.current) {
      firstPlay.current = false;
      return;
    }
    run({ a: props.play ? 'play' : 'pause' });
  }, [props.play]);

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { t?: string; s?: string; c?: number | string; d?: number };
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.t === 'time') {
      cur.current = Number(m.c) || 0;
      if (m.d) dur.current = Number(m.d);
    } else if (m.t === 'state') {
      if (m.d) dur.current = Number(m.d);
      latest.current.onChangeState?.(m.s ?? '');
    } else if (m.t === 'error') {
      latest.current.onError?.(String(m.c));
    }
  };

  return (
    <View style={{ width: props.width, height: props.height, backgroundColor: '#000' }}>
      <WebView
        ref={web}
        source={{ html, baseUrl: 'https://www.youtube.com' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        androidLayerType="hardware"
        onMessage={onMessage}
        style={{ backgroundColor: '#000' }}
      />
    </View>
  );
});
