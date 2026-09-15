import { render } from 'preact';
import { App } from './app';
import '@fontsource-variable/red-hat-display/wght.css';
import '@fontsource-variable/red-hat-text/wght.css';
import '@fontsource-variable/red-hat-mono/wght.css';
// claude-opus-5: Was a single 51-line styles.css; split into src/styles/* for editability.
import './styles/index.css';

render(<App />, document.getElementById('app') as HTMLElement);
