import { render } from 'preact';
import { App } from './app';
import '@fontsource-variable/red-hat-display/wght.css';
import '@fontsource-variable/red-hat-text/wght.css';
import '@fontsource-variable/red-hat-mono/wght.css';
import './styles.css';

render(<App />, document.getElementById('app') as HTMLElement);
