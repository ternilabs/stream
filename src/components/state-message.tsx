import { AlertTriangle } from 'preact-feather';
import { ApiFailure } from '../lib/types';

export function StateMessage({ title, detail }: { title: string; detail?: string }) {
  return <div class="state-message" role="status"><strong>{title}</strong>{detail ? <p>{detail}</p> : null}</div>;
}

export function InvalidResponseState({ title, detail, className = '' }: { title: string; detail: string; className?: string }) {
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title`;
  return (
    <section class={`invalid-response-state ${className}`.trim()} role="status" aria-labelledby={titleId}>
      <span class="invalid-response-icon"><AlertTriangle aria-label={title} /></span>
      <h1 id={titleId}>{title}</h1>
      <p>{detail}</p>
    </section>
  );
}

export function FailedFetchState() {
  return <InvalidResponseState title="Something went wrong" detail="We couldn’t retrieve the data from the server. Please refresh the page or try again later." />;
}

export function InvalidWatchLinkState() {
  return <InvalidResponseState title="Invalid watch link" detail="This watch link doesn’t match a known movie or TV title. Please check the URL or search again." />;
}

export function NotFoundState() {
  return <InvalidResponseState title="Page not found" detail="This page does not exist or the link is no longer valid. Check the URL or search for the title again." />;
}

export function ServersUnavailableState({ compact = false }: { compact?: boolean }) {
  return <InvalidResponseState className={compact ? 'is-compact' : ''} title="Servers unavailable" detail="No streaming servers are available right now. Please try again later." />;
}

export function ApiErrorMessage({ error }: { error: unknown }) {
  if (error instanceof ApiFailure && error.kind === 'rate-limited') {
    return <InvalidResponseState title="Service temporarily limited" detail="The metadata API is currently limited. You can support the project at https://ko-fi.com/mkgpdev to help keep it available." />;
  }
  return <FailedFetchState />;
}
