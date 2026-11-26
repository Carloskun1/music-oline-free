declare module 'react-native-web-webview' {
  import type { Component } from 'react';
  export interface WebViewProps {
    [key: string]: unknown;
  }
  export default class WebView extends Component<WebViewProps> {}
}
