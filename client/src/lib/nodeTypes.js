import {
  Zap,
  Mail,
  MessageSquare,
  MessageCircle,
  Table,
  GitBranch,
  Clock,
} from 'lucide-react';

export const NODE_CATEGORIES = [
  {
    type: 'trigger',
    label: 'Manual Trigger',
    icon: Zap,
    color: '#6366f1',
    fields: [],
  },
  {
    type: 'gmail_send',
    label: 'Send Email (Gmail)',
    icon: Mail,
    color: '#ef4444',
    fields: [
      { key: 'to', label: 'To', type: 'text', placeholder: 'someone@example.com' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
    ],
  },
  {
    type: 'gmail_read',
    label: 'Read Email (Gmail)',
    icon: Mail,
    color: '#ef4444',
    fields: [{ key: 'query', label: 'Search query', type: 'text', placeholder: 'is:unread from:someone' }],
  },
  {
    type: 'slack_post',
    label: 'Post to Slack',
    icon: MessageSquare,
    color: '#a855f7',
    fields: [
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
      { key: 'message', label: 'Message', type: 'textarea' },
    ],
  },
  {
    type: 'discord_post',
    label: 'Post to Discord',
    icon: MessageCircle,
    color: '#818cf8',
    fields: [
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
      { key: 'message', label: 'Message', type: 'textarea' },
    ],
  },
  {
    type: 'sheets_append',
    label: 'Append Row (Sheets)',
    icon: Table,
    color: '#22c55e',
    fields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text' },
      { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A1' },
      { key: 'values', label: 'Values (comma-separated)', type: 'text' },
    ],
  },
  {
    type: 'sheets_read',
    label: 'Read Range (Sheets)',
    icon: Table,
    color: '#22c55e',
    fields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text' },
      { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A1:D10' },
    ],
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: '#f59e0b',
    fields: [{ key: 'expression', label: 'Expression', type: 'text', placeholder: 'output.status === "ok"' }],
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: Clock,
    color: '#64748b',
    fields: [{ key: 'seconds', label: 'Seconds', type: 'number' }],
  },
];

export function getNodeCategory(type) {
  return NODE_CATEGORIES.find((c) => c.type === type) || NODE_CATEGORIES[0];
}
