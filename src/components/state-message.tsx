import { ApiFailure } from '../lib/types';

export function StateMessage({ title, detail }: { title: string; detail?: string }) {
  return <div class="state-message" role="status"><strong>{title}</strong>{detail ? <p>{detail}</p> : null}</div>;
}

export function ApiErrorMessage({ error }: { error: unknown }) {
  if (error instanceof ApiFailure && error.kind === 'rate-limited') {
    return <StateMessage title="Service temporarily limited" detail="The metadata API is currently limited. You can support the project at https://ko-fi.com/mkgpdev to help keep it available." />;
  }
  return <StateMessage title="Metadata unavailable" detail="Try again in a moment." />;
}
