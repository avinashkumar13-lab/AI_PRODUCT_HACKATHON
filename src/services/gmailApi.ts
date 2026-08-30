import { GmailMessageSummary, GmailUserProfile, GmailSendPayload, GmailDraftPayload } from '../types';

const GMAIL_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * Base64 URL safe decoding supporting Unicode UTF-8
 */
export function decodeBase64Url(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    try {
      return atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Base64 URL safe encoding supporting Unicode UTF-8
 */
export function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Extract body text and HTML from a Gmail message payload
 */
function extractBodyFromPayload(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (!payload) return { text, html };

  if (payload.body && payload.body.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html += decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const nested = extractBodyFromPayload(part);
        if (nested.text) text += nested.text;
        if (nested.html) html += nested.html;
      }
    }
  }

  return { text, html };
}

/**
 * Fetch Gmail user profile
 */
export async function fetchGmailProfile(accessToken: string): Promise<GmailUserProfile> {
  const res = await fetch(`${GMAIL_BASE_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Gmail profile: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * List messages from Gmail with query or label filtering
 */
export async function listGmailMessages(
  accessToken: string,
  options: {
    q?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string; resultSizeEstimate?: number }> {
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.maxResults) params.set('maxResults', String(options.maxResults));
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((lbl) => params.append('labelIds', lbl));
  }

  const url = `${GMAIL_BASE_URL}/messages?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const rawList: Array<{ id: string; threadId: string }> = data.messages || [];

  if (rawList.length === 0) {
    return { messages: [], nextPageToken: data.nextPageToken, resultSizeEstimate: data.resultSizeEstimate };
  }

  // Fetch message details in parallel (capped at 20 for responsive UI)
  const detailPromises = rawList.slice(0, 20).map((msg) =>
    fetchGmailMessageDetail(accessToken, msg.id).catch((err) => {
      console.warn(`Failed to fetch message detail for ${msg.id}:`, err);
      return null;
    })
  );

  const resolved = await Promise.all(detailPromises);
  const messages = resolved.filter((m): m is GmailMessageSummary => m !== null);

  return {
    messages,
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate
  };
}

/**
 * Fetch a single Gmail message detail
 */
export async function fetchGmailMessageDetail(
  accessToken: string,
  messageId: string
): Promise<GmailMessageSummary> {
  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}?format=full`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch email (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const headers: Array<{ name: string; value: string }> = data.payload?.headers || [];

  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = getHeader('Subject') || '(No Subject)';
  const from = getHeader('From') || 'Unknown Sender';
  const to = getHeader('To') || '';
  const date = getHeader('Date') || (data.internalDate ? new Date(parseInt(data.internalDate)).toLocaleString() : '');

  const labelIds: string[] = data.labelIds || [];
  const isUnread = labelIds.includes('UNREAD');
  const isStarred = labelIds.includes('STARRED');

  const { text, html } = extractBodyFromPayload(data.payload);

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    subject,
    from,
    to,
    date,
    isUnread,
    isStarred,
    labelIds,
    bodyHtml: html || (text ? `<p class="whitespace-pre-wrap">${text}</p>` : ''),
    bodyText: text || data.snippet || ''
  };
}

/**
 * Send an email via Gmail API (Constructs RFC 2822 format)
 */
export async function sendGmailMessage(
  accessToken: string,
  payload: GmailSendPayload
): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  let emailLines: string[] = [
    `To: ${payload.to}`,
    `Subject: =?utf-8?B?${encodeBase64Url(payload.subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8'
  ];

  if (payload.inReplyTo) {
    emailLines.push(`In-Reply-To: ${payload.inReplyTo}`);
  }
  if (payload.references) {
    emailLines.push(`References: ${payload.references}`);
  }

  emailLines.push('');
  const content = payload.bodyHtml || payload.body.replace(/\n/g, '<br/>');
  emailLines.push(content);

  const rawMessage = emailLines.join('\r\n');
  const encodedRaw = encodeBase64Url(rawMessage);

  const requestBody: any = {
    raw: encodedRaw
  };
  if (payload.threadId) {
    requestBody.threadId = payload.threadId;
  }

  const res = await fetch(`${GMAIL_BASE_URL}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send email: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Create an email draft in Gmail
 */
export async function createGmailDraft(
  accessToken: string,
  payload: GmailDraftPayload
): Promise<any> {
  const emailLines = [
    `To: ${payload.to}`,
    `Subject: =?utf-8?B?${encodeBase64Url(payload.subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    payload.body.replace(/\n/g, '<br/>')
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedRaw = encodeBase64Url(rawMessage);

  const res = await fetch(`${GMAIL_BASE_URL}/drafts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        raw: encodedRaw,
        threadId: payload.threadId
      }
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create draft: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Modify message labels (e.g., mark as read/unread, star/unstar, archive)
 */
export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<any> {
  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addLabelIds,
      removeLabelIds
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to modify email labels: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Trash a message in Gmail (Must be preceded by user confirmation dialog)
 */
export async function trashGmailMessage(
  accessToken: string,
  messageId: string
): Promise<any> {
  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}/trash`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to move email to trash: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Fetch list of Gmail labels
 */
export async function fetchGmailLabels(accessToken: string): Promise<Array<{ id: string; name: string; type: string }>> {
  const res = await fetch(`${GMAIL_BASE_URL}/labels`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch labels: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.labels || [];
}
