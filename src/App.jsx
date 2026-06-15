import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MoreVertical, Smile, Mic, Check, CheckCheck, User, Phone, Video,
  ArrowLeft, Camera, IndianRupee, Image as ImageIcon, FileText, Headphones,
  MapPin, Contact, BarChart2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// ✅ FIX 1: Production webhook URL (no "-test")
const WEBHOOK_URL = "https://jithin1151.app.n8n.cloud/webhook/webhook/rag-chat";

// ✅ FIX 2: Session ID — one per browser tab, persists for the session
if (!window.chatSessionId) {
  window.chatSessionId = "session_" + Math.random().toString(36).substring(2, 15);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatBoldText = (text) => {
  if (!text) return null;
  // Split by text wrapped in double asterisks
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};


const splitMessageTextIntoBubbles = (text) => {
  if (!text) return [''];

  const MAX_CHARS = 280;
  const LIST_CHUNK_SIZE = 3;
  const MIN_BUBBLE_LEN = 40;

  const isListItem = (line) => /^\s*(\d+[.)]\s|[-*•+]\s)/.test(line);
  const isListHeader = (line) => /\*\*.*:\*\*/.test(line.trim());
  const isListRelated = (line) => isListItem(line) || isListHeader(line);

  // ── Step 0: Split by double line breaks into paragraphs first ──
  // Each \n\n boundary = guaranteed separate bubble
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

  // If only one paragraph and it's short, return as-is
  if (paragraphs.length <= 1) {
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim() !== '');
    if (nonEmptyLines.length <= 3 && text.length <= MAX_CHARS) return [text];
  }

  // ── Process each paragraph independently ──
  const allBubbles = [];

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim() !== '');

    // Short paragraph with no complex structure → single bubble
    if (nonEmptyLines.length <= 3 && paragraph.length <= MAX_CHARS) {
      allBubbles.push(paragraph);
      continue;
    }

    // Parse lines into logical blocks (list vs text)
    const blocks = [];
    let idx = 0;

    while (idx < lines.length) {
      const trimmed = lines[idx].trim();
      if (trimmed === '') { idx++; continue; }

      if (isListRelated(trimmed)) {
        const listLines = [];
        while (idx < lines.length) {
          const t = lines[idx].trim();
          if (isListRelated(t)) {
            listLines.push(lines[idx]);
            idx++;
          } else if (t === '' && idx + 1 < lines.length && isListRelated(lines[idx + 1].trim())) {
            listLines.push(lines[idx]);
            idx++;
          } else {
            break;
          }
        }
        blocks.push({ type: 'list', lines: listLines });
      } else {
        const textLines = [];
        while (idx < lines.length) {
          const t = lines[idx].trim();
          if (isListRelated(t)) break;
          if (t === '' && idx + 1 < lines.length && isListRelated(lines[idx + 1].trim())) break;
          textLines.push(lines[idx]);
          idx++;
        }
        if (textLines.some(l => l.trim() !== '')) {
          blocks.push({ type: 'text', lines: textLines });
        }
      }
    }

    // Convert blocks into bubbles
    for (const block of blocks) {
      if (block.type === 'list') {
        const headerLines = [];
        const itemLines = [];
        for (const line of block.lines) {
          if (isListHeader(line.trim()) && itemLines.length === 0) {
            headerLines.push(line);
          } else {
            itemLines.push(line);
          }
        }

        const actualItems = itemLines.filter(l => isListItem(l.trim()));
        if (actualItems.length <= LIST_CHUNK_SIZE) {
          const content = block.lines.join('\n').trim();
          if (content) allBubbles.push(content);
        } else {
          let chunk = [...headerLines];
          let itemCount = 0;
          for (const line of itemLines) {
            chunk.push(line);
            if (isListItem(line.trim())) itemCount++;
            if (itemCount >= LIST_CHUNK_SIZE) {
              const content = chunk.join('\n').trim();
              if (content) allBubbles.push(content);
              chunk = [];
              itemCount = 0;
            }
          }
          if (chunk.length > 0) {
            const content = chunk.join('\n').trim();
            if (content) {
              if (itemCount <= 1 && allBubbles.length > 0) {
                allBubbles[allBubbles.length - 1] += '\n' + content;
              } else {
                allBubbles.push(content);
              }
            }
          }
        }
      } else {
        const fullText = block.lines.join('\n').trim();

        if (fullText.length <= MAX_CHARS) {
          allBubbles.push(fullText);
        } else {
          const sentences = fullText.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^\n]+?\n|[^.!?]+$/g) || [fullText];
          let currentBubble = '';

          for (const sentence of sentences) {
            const candidate = currentBubble + sentence;
            if (currentBubble && candidate.length > MAX_CHARS) {
              allBubbles.push(currentBubble.trim());
              currentBubble = sentence;
            } else {
              currentBubble = candidate;
            }
          }
          if (currentBubble.trim()) {
            if (currentBubble.trim().length < MIN_BUBBLE_LEN && allBubbles.length > 0) {
              allBubbles[allBubbles.length - 1] += ' ' + currentBubble.trim();
            } else {
              allBubbles.push(currentBubble.trim());
            }
          }
        }
      }
    }
  }

  // ── Final cleanup — merge tiny orphan fragments ──
  const finalBubbles = [];
  for (const bubble of allBubbles) {
    if (finalBubbles.length > 0 && bubble.length < MIN_BUBBLE_LEN && !isListRelated(bubble.trim())) {
      finalBubbles[finalBubbles.length - 1] += '\n' + bubble;
    } else {
      finalBubbles.push(bubble);
    }
  }

  return finalBubbles.length > 0 ? finalBubbles : [text];
};

// ✅ FIX 3: Robust response parser — handles all n8n output formats
const parseN8nResponse = (textData) => {
  if (!textData || textData.trim() === '' || textData.trim() === '{}') return null;
  try {
    const data = JSON.parse(textData);
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      const first = data[0];
      if (!first) return null;
      if (typeof first === 'string') return first;
      const b = first.body || first;
      return b.output || b.response || b.text || b.message || b.msg || b.reply || null;
    }
    if (typeof data === 'object') {
      const b = data.body || data;
      return b.output || b.response || b.text || b.message || b.msg || b.reply || null;
    }
  } catch {
    return textData.trim() || null;
  }
  return null;
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const INITIAL_CHATS = [
  {
    id: 1,
    name: 'Naikmei Support',
    avatar: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=150&h=150',
    lastMessage: 'Welcome! How can I assist you with your skin journey today?',
    time: '10:05 AM',
    unread: 1,
    isTyping: false,
    messages: []
  },
  {
    id: 2,
    name: 'Jessica T.',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=faces&q=80',
    lastMessage: 'I need a routine for acne-prone skin.',
    time: '09:45 AM',
    unread: 1,
    isTyping: false,
    messages: []
  },
  {
    id: 3,
    name: 'Order #GLW98234',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces&q=80',
    lastMessage: 'Can I change my delivery address? I ordered the clay mask.',
    time: 'Yesterday',
    unread: 0,
    isTyping: false,
    messages: []
  },
  {
    id: 4,
    name: 'Marketing Team',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces&q=80',
    lastMessage: 'The new summer SPF campaign is ready to launch.',
    time: 'Yesterday',
    unread: 0,
    isTyping: false,
    messages: []
  },
  {
    id: 5,
    name: 'Anna',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces&q=80',
    lastMessage: 'Thanks! The moisturizer feels amazing.',
    time: 'Monday',
    unread: 0,
    isTyping: false,
    messages: []
  },
  {
    id: 6,
    name: 'Packaging Supplier',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces&q=80',
    lastMessage: 'The new glass dropper bottles are shipped.',
    time: 'Sunday',
    unread: 0,
    isTyping: false,
    messages: []
  },
  {
    id: 7,
    name: 'Inventory Alerts',
    avatar: null,
    lastMessage: 'Low stock warning for Retinol Night Cream',
    time: 'Saturday',
    unread: 0,
    isTyping: false,
    messages: []
  }
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const Avatar = ({ src, text, icon: Icon = User, className, bgColor = "bg-gray-600" }) => (
  <div className={cn("rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-[#e9edef] font-medium", bgColor, className)}>
    {src ? <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      : text ? <span className="text-[20px] text-[#ffd279]">{text}</span>
        : <Icon className="text-[#e9edef] w-3/4 h-3/4" />}
  </div>
);

const MessageStatus = ({ status, isSent }) => {
  if (!isSent) return null;
  if (status === 'sent') return <Check className="w-[14px] h-[14px] text-gray-500" />;
  if (status === 'delivered') return <CheckCheck className="w-[14px] h-[14px] text-gray-500" />;
  if (status === 'read') return <CheckCheck className="w-[14px] h-[14px] text-[#53bdeb]" />;
  return <Check className="w-[14px] h-[14px] text-gray-500" />;
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const NavChatIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M5 4.5l3.5 1.5H18A3.5 3.5 0 0 1 21.5 9.5v7a3.5 3.5 0 0 1-3.5 3.5H8a3.5 3.5 0 0 1-3.5-3.5v-12z" fill="currentColor" />
    <rect x="8" y="10.5" width="9" height="2" rx="1" fill="#0a332c" />
    <rect x="8" y="14.5" width="6" height="2" rx="1" fill="#0a332c" />
  </svg>
);
const NavUpdatesIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M9 4.6 A 8 8 0 0 1 15 4.6" /><path d="M19.4 9 A 8 8 0 0 1 19.4 15" />
    <path d="M15 19.4 A 8 8 0 0 1 9 19.4" /><path d="M5.5 16.5 L 3 20 L 4.6 15 A 8 8 0 0 1 4.6 9" />
  </svg>
);
const NavMetaAIIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="translate(12,12)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <g key={i} transform={`rotate(${angle})`}><ellipse cx="0" cy="-5.5" rx="2.3" ry="3.8" transform="rotate(30)" /></g>
      ))}
    </g>
  </svg>
);
const NavCallsIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.6 6.8c.2-1.5 1.5-2.6 3-2.6h1.7c1.3 0 2.4 1 2.6 2.3l.3 2c.2 1.3-.3 2.5-1.2 3.3L9.6 13c1.5 2.6 3.8 4.9 6.4 6.4l1.2-1.4c.8-.9 2-1.4 3.3-1.2l2 .3c1.3.2 2.3 1.3 2.3 2.6v1.7c0 1.5-1.1 2.8-2.6 3A18 18 0 0 1 4.6 6.8z" />
  </svg>
);
const FabIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#0b141a">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 4.5A2.5 2.5 0 0 1 5.5 2h13A2.5 2.5 0 0 1 21 4.5v11a2.5 2.5 0 0 1-2.5 2.5H7.5L3 22V4.5zM13 12h3v-2h-3V7h-2v3H8v2h3v3h2v-3z" />
  </svg>
);
const ArchivedIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M4 9h16" /><path d="M12 12v5" /><path d="M9.5 14.5L12 17l2.5-2.5" />
  </svg>
);
const StickerEmojiIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v7.5" /><path d="M21 15.5l-5.5 5.5" /><path d="M15.5 21v-5.5H21" />
    <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" /><circle cx="15.5" cy="10" r="1.5" fill="currentColor" stroke="none" /><path d="M8 15.5h7.5" />
  </svg>
);
const VerticalPaperclip = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 10v8a4 4 0 0 1-8 0V6a2 2 0 0 1 4 0v10" />
  </svg>
);
const SolidMicIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="#0b141a" /></svg>
);
const SolidSendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}><path d="M7 6l13 6-13 6 3-6-3-6z" fill="#0b141a" /></svg>
);

// ─── CHAT LIST SCREEN ─────────────────────────────────────────────────────────
const ChatListScreen = ({ chats, onSelectChat, onOpenContactForm }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const unreadMessagesCount = chats.reduce((acc, c) => acc + c.unread, 0);
  const filteredChats = chats.filter(chat => activeFilter === 'Unread' ? chat.unread > 0 : true);

  return (
    <div className="flex flex-col h-full bg-[#0b141a] relative">
      <header className="bg-[#0b141a] pt-4 pb-1 px-4 flex-shrink-0 flex justify-between items-center z-10">
        <h1 className="text-[24px] font-semibold text-[#e9edef] tracking-tight">WhatsApp</h1>
        <div className="flex gap-[22px] items-center text-[#e9edef]">
          <div className="w-[22px] h-[22px] rounded-full border-[1.8px] border-current flex items-center justify-center">
            <IndianRupee className="w-3 h-3 stroke-[2.5]" />
          </div>
          <Camera className="w-[22px] h-[22px] stroke-[1.8]" />
          <MoreVertical className="w-[22px] h-[22px] stroke-[1.8] -mr-1" />
        </div>
      </header>

      <div className="flex-grow overflow-y-auto flex flex-col chat-container">
        <div className="px-4 mb-2 mt-1">
          <div className="bg-[#202c33] rounded-full flex items-center px-4 py-[9px]">
            <Search className="w-[20px] h-[20px] mr-3 text-[#8696a0] stroke-[2]" />
            <input type="text" placeholder="Ask Meta AI or Search" className="bg-transparent flex-grow outline-none text-[#e9edef] text-[15.5px] placeholder:text-[#8696a0] font-normal" />
          </div>
        </div>

        <div className="flex gap-[8px] px-4 mb-2 mt-2 overflow-x-auto select-none items-center w-full" style={{ scrollbarWidth: 'none' }}>
          {['All', 'Unread', 'Favorites', 'Groups'].map(f => (
            <div key={f} onClick={() => setActiveFilter(f)} className={cn("px-[16px] py-[6px] rounded-full text-[14px] font-medium flex-shrink-0 transition-colors cursor-pointer", activeFilter === f ? "bg-[#113a2f] text-[#21c063]" : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]")}>{f}</div>
          ))}
        </div>

        <div className="flex items-center px-4 py-[12px] cursor-pointer hover:bg-[#202c33] transition-colors mt-2 mb-1">
          <div className="w-[50px] mr-[4px] flex justify-center"><ArchivedIcon className="w-[20px] h-[20px] text-[#8696a0]" /></div>
          <div className="flex-grow font-semibold text-[16px] text-[#e9edef]">Archived</div>
          <div className="text-[13px] text-[#8696a0] font-medium mr-2">11</div>
        </div>

        <div className="px-4 py-2"><span className="text-[#8696a0] font-semibold text-[14px]">{activeFilter === 'Unread' ? 'Unread' : 'Recent'}</span></div>

        {filteredChats.map((chat) => (
          <div key={chat.id} onClick={() => onSelectChat(chat.id)} className="flex items-center pl-4 pr-4 py-[8px] cursor-pointer hover:bg-[#202c33] active:bg-[#2a3942] transition-colors">
            <Avatar src={chat.avatar} className="w-[46px] h-[46px] mr-[12px]" />
            <div className="flex-grow border-b border-[#202c33] pb-[8px] -mb-[8px] min-w-0">
              <div className="flex justify-between items-baseline mb-[1px]">
                <h3 className="font-semibold text-[15.5px] text-[#e9edef] truncate">{chat.name}</h3>
                <span className={cn("text-[12px] font-medium", chat.unread > 0 ? "text-[#21c063]" : "text-[#8696a0]")}>{chat.time}</span>
              </div>
              <div className="flex justify-between items-center mt-[2px]">
                <p className="text-[13.5px] text-[#8696a0] truncate leading-tight flex-grow pr-2">
                  {chat.isTyping ? <span className="text-[#21c063] font-medium">typing...</span> : chat.lastMessage}
                </p>
                {chat.unread > 0 && (
                  <span className="bg-[#21c063] text-[#0b141a] text-[11px] font-bold h-[20px] min-w-[20px] px-1.5 flex items-center justify-center rounded-full flex-shrink-0">{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-[100px] right-4 z-20">
        <button onClick={onOpenContactForm} className="bg-[#21c063] w-[56px] h-[56px] rounded-[16px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] active:scale-95 transition-transform">
          <FabIcon className="w-[26px] h-[26px]" />
        </button>
      </div>

      <div className="bg-[#0b141a] flex justify-around items-center h-[80px] pb-[16px] pt-2 flex-shrink-0 z-30 relative w-full">
        <div className="flex flex-col items-center justify-center w-1/4 text-[#e9edef] cursor-pointer relative">
          <div className="bg-[#113a2f] px-[20px] py-[4px] rounded-full mb-1 relative">
            <NavChatIcon className="w-[24px] h-[24px] text-[#e9edef]" />
            {unreadMessagesCount > 0 && <div className="absolute -top-[4px] -right-[6px] bg-[#21c063] text-[#0b141a] text-[11px] font-bold h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full border-[2px] border-[#0b141a]">{unreadMessagesCount}</div>}
          </div>
          <span className="text-[13px] font-bold text-[#e9edef]">Chats</span>
        </div>
        {[{ icon: NavUpdatesIcon, label: 'Updates' }, { icon: NavMetaAIIcon, label: 'Meta AI' }, { icon: NavCallsIcon, label: 'Calls' }].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center justify-center w-1/4 text-[#8696a0] hover:text-[#e9edef] cursor-pointer">
            <div className="px-[20px] py-[4px] mb-1"><Icon className="w-[24px] h-[24px] text-current" /></div>
            <span className="text-[13px] font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CHAT DETAIL SCREEN ───────────────────────────────────────────────────────
const ChatDetailScreen = ({ chat, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const longPressTimer = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea: grows up to 6 lines (~144px), then scrolls
  const MAX_TEXTAREA_HEIGHT = 144; // ~6 lines at 17.5px font * 1.35 line-height
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto'; // shrink first to measure real scrollHeight
    const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = newHeight + 'px';
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat?.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(chat.id, inputText, replyTo);
      setInputText('');
      setReplyTo(null);
      setShowAttachments(false);
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  const startLongPress = (msg) => {
    longPressTimer.current = setTimeout(() => setReplyTo({ id: msg.id, sender: msg.sender, text: msg.text }), 500);
  };
  const cancelLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full relative z-20 bg-[#0b141a]">
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <header className="bg-[#0b141a] pt-4 pb-3 px-1 flex items-center z-30 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.2)] relative">
        <div className="flex items-center cursor-pointer px-1 active:bg-[#202c33] rounded-full" onClick={onBack}>
          <ArrowLeft className="w-6 h-6 text-[#e9edef] stroke-[2]" />
          <Avatar src={chat.avatar} text={chat.name.charAt(0)} bgColor="bg-[#614532]" className="w-[40px] h-[40px] ml-0.5 mr-3" />
        </div>
        <div className="flex-grow min-w-0 cursor-pointer rounded flex flex-col justify-center overflow-hidden">
          <h2 className="font-semibold text-[17px] text-[#e9edef] truncate leading-tight">{chat.name}</h2>
          <p className={cn("text-[13px] truncate leading-normal", chat.isTyping ? "text-[#21c063] font-medium" : "text-[#8696a0] font-normal")}>
            {chat.isTyping ? 'typing...' : 'online'}
          </p>
        </div>
        <div className="flex gap-5 items-center px-4 text-[#e9edef]">
          <Video className="w-[24px] h-[24px] stroke-[1.8]" />
          <Phone className="w-[22px] h-[22px] stroke-[1.8]" />
          <MoreVertical className="w-[24px] h-[24px] stroke-[1.8]" />
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-3 relative flex flex-col z-10 pb-4 bg-transparent chat-container" ref={scrollRef} onClick={() => setShowAttachments(false)}>
        {chat.messages.length === 0 && (
          <div className="flex justify-center mb-4 mt-4">
            <div className="bg-[#182229] text-[#ffd279] text-[12.5px] px-4 py-2.5 rounded-lg shadow-sm text-center max-w-[95%] font-medium leading-[1.45]">
              Messages and calls are end-to-end encrypted.
            </div>
          </div>
        )}

        {chat.messages.map((msg, idx) => {
          const isSent = msg.sender === 'user';
          const showTail = idx === 0 || chat.messages[idx - 1].sender !== msg.sender;
          return (
            <div key={msg.id} className={cn("flex", showTail ? "mt-[10px]" : "mt-[3px]", isSent ? "justify-end" : "justify-start")}
              onMouseDown={() => startLongPress(msg)} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
              onTouchStart={() => startLongPress(msg)} onTouchEnd={cancelLongPress}>
              <div className={cn(
                "max-w-[85%] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative flex flex-col",
                isSent ? "bg-[#005c4b]" : "bg-[#202c33]",
                isSent ? "rounded-l-xl rounded-br-xl" : "rounded-r-xl rounded-bl-xl",
                showTail && isSent ? "rounded-tr-none" : "",
                showTail && !isSent ? "rounded-tl-none" : "",
                !showTail && isSent ? "rounded-tr-xl" : "",
                !showTail && !isSent ? "rounded-tl-xl" : ""
              )}>
                {showTail && (
                  <div className={cn("absolute top-0 w-[10px] h-[13px]",
                    isSent ? "-right-[9px] bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]" : "-left-[9px] bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]")} />
                )}
                {msg.replyTo && (
                  <div className={cn("rounded-lg mb-1.5 overflow-hidden flex flex-col bg-black/15 border-l-[4px]", msg.replyTo.sender === 'user' ? "border-l-[#7dd3fc]" : "border-l-[#a67cff]")}>
                    <span className={cn("text-[13px] font-bold px-2.5 pt-1.5 pb-0.5", msg.replyTo.sender === 'user' ? "text-[#7dd3fc]" : "text-[#a67cff]")}>{msg.replyTo.sender === 'user' ? 'You' : chat.name}</span>
                    <span className="text-[14px] text-[#e9edef]/80 px-2.5 pb-1.5 line-clamp-3 whitespace-pre-wrap">{msg.replyTo.text}</span>
                  </div>
                )}
                <span className="text-[15.5px] text-[#e9edef] leading-[1.35] pb-[16px] pr-12 whitespace-pre-wrap break-words inline-block">{formatBoldText(msg.text)}</span>
                <div className="absolute bottom-1 right-2 flex items-center gap-[2px] h-[15px]">
                  <span className="text-[10px] text-[#8696a0] leading-none mt-[2px]">{msg.time}</span>
                  <MessageStatus status={msg.status} isSent={isSent} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAttachments && (
        <div className="absolute bottom-[80px] inset-x-2 bg-[#202c33] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-5 pb-7 z-40 grid grid-cols-4 gap-y-7 gap-x-2 border border-[#222d34]">
          {[
            { icon: FileText, bg: 'bg-[#7F66FF]', label: 'Document' }, { icon: Camera, bg: 'bg-[#ED597E]', label: 'Camera' },
            { icon: ImageIcon, bg: 'bg-[#AC44CF]', label: 'Gallery' }, { icon: Headphones, bg: 'bg-[#E5622C]', label: 'Audio' },
            { icon: MapPin, bg: 'bg-[#0E9D5B]', label: 'Location' }, { icon: IndianRupee, bg: 'bg-[#01A39D]', label: 'Payment' },
            { icon: Contact, bg: 'bg-[#0A7BCA]', label: 'Contact' }, { icon: BarChart2, bg: 'bg-[#E3A10A]', label: 'Poll' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
              <div className={cn("w-[54px] h-[54px] rounded-full flex items-center justify-center text-white shadow-sm", item.bg)}><item.icon className="w-6 h-6 stroke-[1.5]" /></div>
              <span className="text-[12px] text-[#e9edef] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <footer className="bg-transparent px-[6px] py-[6px] flex items-end gap-[6px] z-30 flex-shrink-0 pb-[16px] sm:pb-[32px]">
        <div className="flex-grow bg-[#202c33] rounded-[24px] flex flex-col justify-center min-w-0">
          {replyTo && (
            <div className="bg-[#1b252a] mx-1.5 mt-1.5 rounded-[12px] flex relative overflow-hidden h-[54px]">
              <div className={cn("w-[4px] flex-shrink-0", replyTo.sender === 'user' ? "bg-[#7dd3fc]" : "bg-[#a67cff]")} />
              <div className="px-2.5 py-[6px] flex-grow min-w-0 flex flex-col justify-center pr-8">
                <span className={cn("text-[13.5px] font-bold mb-[2px]", replyTo.sender === 'user' ? "text-[#7dd3fc]" : "text-[#a67cff]")}>{replyTo.sender === 'user' ? 'You' : chat.name}</span>
                <span className="text-[14px] text-[#8696a0] truncate">{replyTo.text.split('\n')[0]}</span>
              </div>
              <button className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-[#8696a0] rounded-full" onClick={() => setReplyTo(null)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </button>
            </div>
          )}
          <div className="flex items-end pl-[6px] pr-[16px] min-h-[50px]">
            <button className="p-[8px] text-[#8696a0] hover:text-[#e9edef] rounded-full mb-[2px]"><StickerEmojiIcon className="w-[26px] h-[26px]" /></button>
            <textarea
              ref={textareaRef}
              enterKeyHint="send"
              rows={1}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setTimeout(autoResize, 0); }}
              onInput={autoResize}
              placeholder="Message"
              className="chat-textarea flex-grow w-full min-w-[50px] bg-transparent text-[17.5px] px-2 py-[12px] outline-none text-[#e9edef] placeholder:text-[#8696a0] resize-none leading-[1.35]"
              style={{ height: 'auto', maxHeight: MAX_TEXTAREA_HEIGHT + 'px', overflowY: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#8696a0 transparent' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                // Shift+Enter naturally inserts a newline — no need to handle
              }}
            />
            <div className="flex gap-[12px] text-[#8696a0] items-center flex-shrink-0 mb-[10px]">
              <button className="rounded-full hover:text-[#e9edef]" onClick={() => setShowAttachments(!showAttachments)}>
                <VerticalPaperclip className="w-[24px] h-[24px]" />
              </button>
              {!inputText.trim() && (
                <>
                  <button className="rounded-full hover:text-[#e9edef]"><div className="w-[22px] h-[22px] rounded-full border-[2.2px] border-current flex items-center justify-center"><IndianRupee className="w-[12px] h-[12px] stroke-[2.5]" /></div></button>
                  <button className="rounded-full hover:text-[#e9edef]"><Camera className="w-[25px] h-[25px] stroke-[2.2]" /></button>
                </>
              )}
            </div>
          </div>
        </div>
        {inputText.trim() ? (
          <button className="bg-[#21c063] w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-md flex-shrink-0 active:scale-95" onClick={handleSend}>
            <SolidSendIcon className="w-[24px] h-[24px]" />
          </button>
        ) : (
          <button className="bg-[#21c063] w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-md flex-shrink-0 active:scale-95">
            <SolidMicIcon className="w-[24px] h-[24px]" />
          </button>
        )}
      </footer>
    </div>
  );
};

// ─── CONTACT FORM MODAL ───────────────────────────────────────────────────────
const ContactFormModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async () => {
    if (!name || !email || !message) return;
    setStatus('submitting');
    try {
      const response = await fetch('https://jithin1151.app.n8n.cloud/webhook/message-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, timestamp: new Date().toISOString() })
      });
      if (response.ok) { setStatus('success'); setName(''); setEmail(''); setMessage(''); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-[#111b21] border border-[#222d34] rounded-2xl w-full max-w-md flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="px-6 py-4 bg-[#202c33] border-b border-[#222d34] flex justify-between items-center">
          <h3 className="font-bold text-lg text-[#e9edef]">Contact Support</h3>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef] p-1.5 rounded-full">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {status === 'success' && <div className="bg-[#113a2f] border border-[#21c063]/30 text-[#21c063] px-4 py-3 rounded-lg text-sm font-medium">Success! Form submitted successfully</div>}
          {status === 'error' && <div className="bg-[#3a1b1b] border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">Submission failed. Please try again.</div>}
          {[['Name', 'text', name, setName, 'Your Name'], ['Email', 'email', email, setEmail, 'your.email@example.com']].map(([label, type, val, setter, ph]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#8696a0] font-medium">{label}</label>
              <input type={type} required value={val} onChange={e => { setter(e.target.value); if (status !== 'idle') setStatus('idle'); }} placeholder={ph}
                className="bg-[#202c33] border border-transparent focus:border-[#21c063] rounded-lg px-3 py-2.5 outline-none text-[#e9edef] placeholder:text-[#8696a0] text-sm" />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-[#8696a0] font-medium">Message</label>
            <textarea required rows={4} value={message} onChange={e => { setMessage(e.target.value); if (status !== 'idle') setStatus('idle'); }} placeholder="How can we help you?"
              className="bg-[#202c33] border border-transparent focus:border-[#21c063] rounded-lg px-3 py-2.5 outline-none text-[#e9edef] placeholder:text-[#8696a0] text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={onClose} className="bg-[#182229] hover:bg-[#202c33] text-[#e9edef] font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#222d34]">Cancel</button>
            <button onClick={handleSubmit} disabled={status === 'submitting'} className="bg-[#21c063] hover:bg-[#1fa955] disabled:bg-[#128c7e] text-[#0b141a] font-bold text-sm px-5 py-2.5 rounded-lg shadow-md min-w-[100px] flex items-center justify-center gap-2">
              {status === 'submitting' ? (
                <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Submitting...</>
              ) : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const handleReceiveMessage = (chatId, text) => {
    const textBubbles = splitMessageTextIntoBubbles(text);
    const newMessages = textBubbles.map((bubbleText, idx) => ({
      id: Date.now() + idx + Math.random(),
      sender: 'agent',
      text: bubbleText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      lastMessage: textBubbles[textBubbles.length - 1],
      time: newMessages[newMessages.length - 1].time,
      isTyping: false,
      messages: [...c.messages, ...newMessages]
    } : c));
  };

  const handleSendMessage = (chatId, text, replyTo = null) => {
    const textBubbles = splitMessageTextIntoBubbles(text);
    const newMessages = textBubbles.map((bubbleText, idx) => ({
      id: Date.now() + idx + Math.random(),
      sender: 'user',
      text: bubbleText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      replyTo: idx === 0 && replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : null
    }));

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      lastMessage: textBubbles[textBubbles.length - 1],
      time: newMessages[newMessages.length - 1].time,
      messages: [...c.messages, ...newMessages]
    } : c));

    // Status updates
    newMessages.forEach((msg, idx) => {
      setTimeout(() => setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === msg.id ? { ...m, status: 'delivered' } : m) } : c)), 500 + idx * 100);
      setTimeout(() => setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === msg.id ? { ...m, status: 'read' } : m) } : c)), 1200 + idx * 100);
    });

    // Show typing indicator
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isTyping: true } : c));

    // ✅ FIX: Send to n8n with consistent sessionId
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput: text,
        GLOBAL_SESSION_ID: window.chatSessionId,  // ✅ Matches n8n Postgres chat memory key
        action: "sendMessage"
      })
    })
      .then(async (response) => {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, isTyping: false } : c));

        // ✅ FIX: Handle non-ok responses gracefully
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.error(`n8n error ${response.status}:`, errText);
          handleReceiveMessage(chatId, `Error ${response.status}: n8n did not respond correctly. Please try again.`);
          return;
        }

        const textData = await response.text();
        const replyText = parseN8nResponse(textData);

        if (!replyText) {
          handleReceiveMessage(chatId, "I received your message but got an empty response. Please try again.");
          return;
        }

        handleReceiveMessage(chatId, replyText);
      })
      .catch((error) => {
        // ✅ FIX: Show the REAL error instead of a misleading message
        console.error("Fetch failed:", error);
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, isTyping: false } : c));
        handleReceiveMessage(chatId, "Could not reach the server. Please check your connection and try again.");
      });
  };

  useEffect(() => {
    window.__whatsappUI = {
      receiveMessage: handleReceiveMessage,
      setTyping: (chatId, isTyping) => setChats(prev => prev.map(c => c.id === chatId ? { ...c, isTyping } : c))
    };
  }, []);

  const activeChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="h-full w-full bg-[#111b21] overflow-hidden">
      <div className="w-full h-full sm:h-screen sm:max-w-md sm:mx-auto bg-[#0b141a] relative overflow-hidden flex flex-col font-sans sm:shadow-2xl sm:border sm:border-[#222]">
        {activeChat ? (
          <ChatDetailScreen chat={activeChat} onBack={() => setSelectedChatId(null)} onSendMessage={handleSendMessage} />
        ) : (
          <ChatListScreen chats={chats} onSelectChat={setSelectedChatId} onOpenContactForm={() => setShowContactForm(true)} />
        )}
      </div>
      {showContactForm && <ContactFormModal onClose={() => setShowContactForm(false)} />}
    </div>
  );
}
