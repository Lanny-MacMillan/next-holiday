import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from '@/lib/sentryOptions';

Sentry.init(sentryOptions);
