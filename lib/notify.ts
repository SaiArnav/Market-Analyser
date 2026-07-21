import { prisma } from './db';

const SCORE_CHANGE_THRESHOLD = 10;

const SLACK_WEBHOOK_URL = () => process.env.SLACK_WEBHOOK_URL?.trim() || undefined;
const RESEND_API_KEY = () => process.env.RESEND_API_KEY?.trim() || undefined;
const NOTIFICATION_EMAIL = () => process.env.NOTIFICATION_EMAIL?.trim() || undefined;

type AlertPayload = {
  companyName: string;
  companyId: string;
  oldScore: number | null;
  newScore: number;
  direction: 'increased' | 'decreased' | 'first';
  signalsAdded: number;
  explanation: string;
};

async function sendSlack(payload: AlertPayload): Promise<boolean> {
  const url = SLACK_WEBHOOK_URL();
  if (!url) return false;

  const directionEmoji = payload.direction === 'increased' ? ':warning:' : payload.direction === 'decreased' ? ':chart_with_downwards_trend:' : ':new:';
  const oldText = payload.oldScore !== null ? `${payload.oldScore} → ` : '';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${directionEmoji} Risk Score Alert: ${payload.companyName}`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Company:* ${payload.companyName}\n*Risk Score:* ${oldText}**${payload.newScore}/100**\n*New Signals:* ${payload.signalsAdded}\n*Direction:* ${payload.direction}`,
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Summary:*\n${payload.explanation.slice(0, 500)}` },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
          url: `${process.env.APP_URL || 'http://localhost:3000'}/company/${payload.companyId}`,
          action_id: 'view_dashboard',
        },
      ],
    },
  ];

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
      cache: 'no-store',
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function sendEmail(payload: AlertPayload): Promise<boolean> {
  const apiKey = RESEND_API_KEY();
  const to = NOTIFICATION_EMAIL();
  if (!apiKey || !to) return false;

  const directionLabel = payload.direction === 'increased' ? 'increased (worsened)' : payload.direction === 'decreased' ? 'decreased (improved)' : 'initialized';
  const oldText = payload.oldScore !== null ? ` (was ${payload.oldScore})` : '';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MarketAnalyser <notifications@marketanalyser.ai>',
        to: [to],
        subject: `[MarketAnalyser] Risk Score Alert: ${payload.companyName} — ${payload.newScore}/100`,
        html: `
          <h2>Risk Score Change: ${payload.companyName}</h2>
          <p><strong>Score:</strong> ${payload.newScore}/100 ${oldText}</p>
          <p><strong>Direction:</strong> ${directionLabel}</p>
          <p><strong>New signals collected:</strong> ${payload.signalsAdded}</p>
          <p><strong>Summary:</strong> ${payload.explanation}</p>
          <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/company/${payload.companyId}">View in Dashboard →</a></p>
        `,
      }),
      cache: 'no-store',
    });
    return r.ok;
  } catch {
    return false;
  }
}

export type NotifyResult = { slack: boolean; email: boolean };

export async function maybeNotify(
  companyId: string,
  companyName: string,
  newScore: number,
  signalsAdded: number,
  explanation: string,
): Promise<NotifyResult> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { lastNotifiedScore: true, lastNotifiedAt: true },
  });

  const oldScore = company?.lastNotifiedScore ?? null;
  const lastNotifiedAt = company?.lastNotifiedAt ?? null;

  const isFirst = oldScore === null;
  const change = isFirst ? 0 : Math.abs(newScore - oldScore!);

  if (!isFirst && change < SCORE_CHANGE_THRESHOLD) {
    return { slack: false, email: false };
  }

  const direction: AlertPayload['direction'] = isFirst ? 'first' : newScore > oldScore! ? 'increased' : 'decreased';

  const payload: AlertPayload = { companyName, companyId, oldScore, newScore, direction, signalsAdded, explanation };

  const [slackOk, emailOk] = await Promise.all([sendSlack(payload), sendEmail(payload)]);

  if (slackOk || emailOk) {
    await prisma.company.update({
      where: { id: companyId },
      data: { lastNotifiedScore: newScore, lastNotifiedAt: new Date() },
    });
  }

  return { slack: slackOk, email: emailOk };
}
