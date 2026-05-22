import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Smile,
  Mic,
  Check,
  CheckCheck,
  User,
  Phone,
  Video,
  ArrowLeft,
  Camera,
  IndianRupee,
  Signal,
  Wifi,
  Battery,
  Image as ImageIcon,
  FileText,
  Headphones,
  MapPin,
  Contact,
  BarChart2,
  Delete,
  CornerDownLeft,
  Grid,
  Clipboard,
  Settings,
  Palette,
  ChevronDown,
  Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Mock Data ---
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
    name: 'Customer - Jessica T.',
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
    name: 'VIP Customer - Anna',
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

// --- Sub-Components ---

const Avatar = ({ src, text, icon: Icon = User, className, bgColor = "bg-gray-600" }) => (
  <div className={cn("rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-[#e9edef] font-medium", bgColor, className)}>
    {src ? (
      <img src={src} alt="Avatar" className="w-full h-full object-cover" />
    ) : text ? (
      <span className="text-[20px] text-[#ffd279]">{text}</span>
    ) : (
      <Icon className="text-[#e9edef] w-3/4 h-3/4" />
    )}
  </div>
);

const MessageStatus = ({ status, isSent }) => {
  if (!isSent) return null;
  if (status === 'sent') return <Check className="w-[14px] h-[14px] text-gray-500" />;
  if (status === 'delivered') return <CheckCheck className="w-[14px] h-[14px] text-gray-500" />;
  if (status === 'read') return <CheckCheck className="w-[14px] h-[14px] text-[#53bdeb]" />;
  return <Check className="w-[14px] h-[14px] text-gray-500" />;
};


// --- Custom WhatsApp Exact Icons (Dark Mode Adapted) ---

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
    <path d="M9 4.6 A 8 8 0 0 1 15 4.6" />
    <path d="M19.4 9 A 8 8 0 0 1 19.4 15" />
    <path d="M15 19.4 A 8 8 0 0 1 9 19.4" />
    <path d="M5.5 16.5 L 3 20 L 4.6 15 A 8 8 0 0 1 4.6 9" />
  </svg>
);

const NavMetaAIIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="translate(12,12)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <g key={i} transform={`rotate(${angle})`}>
          <ellipse cx="0" cy="-5.5" rx="2.3" ry="3.8" transform="rotate(30)" />
        </g>
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
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <path d="M4 9h16" />
    <path d="M12 12v5" />
    <path d="M9.5 14.5L12 17l2.5-2.5" />
  </svg>
);

const StickerEmojiIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v7.5" />
    <path d="M21 15.5l-5.5 5.5" />
    <path d="M15.5 21v-5.5H21" />
    <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <path d="M8 15.5h7.5" />
  </svg>
);

const VerticalPaperclip = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 10v8a4 4 0 0 1-8 0V6a2 2 0 0 1 4 0v10" />
  </svg>
);

const SolidMicIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="#0b141a" />
  </svg>
);

const SolidSendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M7 6l13 6-13 6 3-6-3-6z" fill="#0b141a" />
  </svg>
);


// --- Screens ---

const ChatListScreen = ({ chats, onSelectChat }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const unreadMessagesCount = chats.reduce((acc, c) => acc + c.unread, 0);

  const filteredChats = chats.filter(chat => {
    if (activeFilter === 'Unread') return chat.unread > 0;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0b141a] relative">
      {/* Dark Mode Header */}
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

      <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">

        {/* Ask Meta AI or Search Bar */}
        <div className="px-4 mb-2 mt-1">
          <div className="bg-[#202c33] rounded-full flex items-center px-4 py-[9px]">
            <Search className="w-[20px] h-[20px] mr-3 text-[#8696a0] stroke-[2]" />
            <input
              type="text"
              placeholder="Ask Meta AI or Search"
              className="bg-transparent flex-grow outline-none text-[#e9edef] text-[15.5px] placeholder:text-[#8696a0] font-normal"
            />
          </div>
        </div>

        {/* Chat Filters Row */}
        <div className="flex gap-[8px] px-4 mb-2 mt-2 overflow-x-auto select-none no-scrollbar items-center w-full" style={{ scrollbarWidth: 'none' }}>
          <div
            onClick={() => setActiveFilter('All')}
            className={cn("px-[16px] py-[6px] rounded-full text-[14px] font-medium flex-shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer", activeFilter === 'All' ? "bg-[#113a2f] text-[#21c063]" : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]")}
          >
            All <span className={activeFilter === 'All' ? "text-[#21c063]" : "text-[#8696a0]"}>{chats.length}</span>
          </div>
          <div
            onClick={() => setActiveFilter('Unread')}
            className={cn("px-[16px] py-[6px] rounded-full text-[14px] font-medium flex-shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer", activeFilter === 'Unread' ? "bg-[#113a2f] text-[#21c063]" : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]")}
          >
            Unread
            {unreadMessagesCount > 0 && (
              <span className={activeFilter === 'Unread' ? "text-[#21c063]" : "text-[#8696a0]"}>{unreadMessagesCount}</span>
            )}
          </div>
          <div className="bg-[#202c33] text-[#8696a0] px-[16px] py-[6px] rounded-full text-[14px] font-medium flex-shrink-0 hover:bg-[#2a3942] transition-colors cursor-pointer">Favorites</div>
          <div className="bg-[#202c33] text-[#8696a0] px-[16px] py-[6px] rounded-full text-[14px] font-medium flex-shrink-0 hover:bg-[#2a3942] transition-colors flex items-center gap-1.5 cursor-pointer">
            Groups <span className="text-[#8696a0] font-medium text-[13px]">3</span>
          </div>
          <div className="bg-[#202c33] text-[#8696a0] px-[16px] py-[6px] rounded-full text-[14px] font-medium flex-shrink-0 hover:bg-[#2a3942] transition-colors cursor-pointer">Communities</div>
        </div>

        {/* Archived Row */}
        <div className="flex items-center px-4 py-[12px] cursor-pointer hover:bg-[#202c33] transition-colors mt-2 mb-1">
          <div className="w-[50px] mr-[4px] flex justify-center">
            <ArchivedIcon className="w-[20px] h-[20px] text-[#8696a0]" />
          </div>
          <div className="flex-grow font-semibold text-[16px] text-[#e9edef]">Archived</div>
          <div className="text-[13px] text-[#8696a0] font-medium mr-2">11</div>
        </div>

        {/* Section Header */}
        <div className="px-4 py-2">
          <span className="text-[#8696a0] font-semibold text-[14px]">
            {activeFilter === 'Unread' ? 'Unread' : 'Recent'}
          </span>
        </div>

        {/* Chats */}
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className="flex items-center pl-4 pr-4 py-[8px] cursor-pointer hover:bg-[#202c33] active:bg-[#2a3942] transition-colors"
          >
            <Avatar src={chat.avatar} className="w-[46px] h-[46px] mr-[12px]" />
            <div className="flex-grow border-b border-[#202c33] pb-[8px] -mb-[8px] min-w-0">
              <div className="flex justify-between items-baseline mb-[1px]">
                <h3 className="font-semibold text-[15.5px] text-[#e9edef] truncate">{chat.name}</h3>
                <span className={cn("text-[12px] font-medium", chat.unread > 0 ? "text-[#21c063]" : "text-[#8696a0]")}>
                  {chat.time}
                </span>
              </div>
              <div className="flex justify-between items-center mt-[2px]">
                <p className="text-[13.5px] text-[#8696a0] truncate leading-tight flex-grow pr-2">
                  {chat.isTyping ? <span className="text-[#21c063] font-medium">typing...</span> : chat.lastMessage}
                </p>
                {chat.unread > 0 && (
                  <span className="bg-[#21c063] text-[#0b141a] text-[11px] font-bold h-[20px] min-w-[20px] px-1.5 flex items-center justify-center rounded-full flex-shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="pt-12 pb-6 flex flex-col items-center justify-center gap-2 text-[12px] font-medium text-[#8696a0]">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 12 15" width="10" height="13" className="fill-current"><path d="M11.5 6.5H11V5C11 2.2 8.8 0 6 0S1 2.2 1 5v1.5H.5C.2 6.5 0 6.7 0 7v7c0 .3.2.5.5.5h11c.3 0 .5-.2.5-.5V7c0-.3-.2-.5-.5-.5zM6 11.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM8.5 6.5h-5V5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v1.5z"></path></svg>
            Your personal messages are <span className="text-[#21c063]">end-to-end encrypted</span>
          </div>
        </div>
      </div>

      {/* Exact Match FAB */}
      <div className="absolute bottom-[100px] right-4 z-20">
        <button className="bg-[#21c063] w-[56px] h-[56px] rounded-[16px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] active:scale-95 transition-transform">
          <FabIcon className="w-[26px] h-[26px]" />
        </button>
      </div>

      {/* Exact Footer Navigation */}
      <div className="bg-[#0b141a] flex justify-around items-center h-[80px] pb-[16px] pt-2 flex-shrink-0 z-30 relative w-full">
        <div className="flex flex-col items-center justify-center w-1/4 text-[#e9edef] cursor-pointer relative">
          <div className="bg-[#113a2f] px-[20px] py-[4px] rounded-full mb-1 relative">
            <NavChatIcon className="w-[24px] h-[24px] text-[#e9edef]" />
            {unreadMessagesCount > 0 && (
              <div className="absolute -top-[4px] -right-[6px] bg-[#21c063] text-[#0b141a] text-[11px] font-bold h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full border-[2px] border-[#0b141a]">
                {unreadMessagesCount}
              </div>
            )}
          </div>
          <span className="text-[13px] font-bold text-[#e9edef]">Chats</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/4 text-[#8696a0] hover:text-[#e9edef] cursor-pointer relative">
          <div className="px-[20px] py-[4px] mb-1 relative">
            <NavUpdatesIcon className="w-[24px] h-[24px] text-current" />
            <div className="absolute top-[2px] right-[16px] bg-[#21c063] w-[10px] h-[10px] rounded-full border-[2px] border-[#0b141a]"></div>
          </div>
          <span className="text-[13px] font-medium">Updates</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/4 text-[#8696a0] hover:text-[#e9edef] cursor-pointer">
          <div className="px-[20px] py-[4px] mb-1">
            <NavMetaAIIcon className="w-[24px] h-[24px] text-current" />
          </div>
          <span className="text-[13px] font-medium">Meta AI</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/4 text-[#8696a0] hover:text-[#e9edef] cursor-pointer">
          <div className="px-[20px] py-[4px] mb-1">
            <NavCallsIcon className="w-[24px] h-[24px] text-current" />
          </div>
          <span className="text-[13px] font-medium">Calls</span>
        </div>
      </div>
    </div>
  );
};

const ChatDetailScreen = ({ chat, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, sender, text }
  const longPressTimer = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(chat.id, inputText, replyTo);
      setInputText('');
      setReplyTo(null);
      setShowAttachments(false);
    }
  };

  const handleAttachmentClick = () => {
    setShowAttachments(!showAttachments);
  };

  const startLongPress = (msg) => {
    longPressTimer.current = setTimeout(() => {
      setReplyTo({ id: msg.id, sender: msg.sender, text: msg.text });
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full relative z-20 animate-slide-in-right bg-[#0b141a]">
      {/* Background to show through transparent footer */}
      <div
        className="absolute inset-0 z-0 opacity-15 pointer-events-none"
        style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* Header */}
      <header className="bg-[#0b141a] pt-4 pb-2 px-1 flex items-center z-30 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.2)] relative">
        <div className="flex items-center cursor-pointer px-1 active:bg-[#202c33] rounded-full" onClick={onBack}>
          <ArrowLeft className="w-6 h-6 text-[#e9edef] stroke-[2]" />
          <Avatar src={chat.avatar} text={chat.name.charAt(0)} bgColor="bg-[#614532]" className="w-[40px] h-[40px] ml-0.5 mr-3" />
        </div>
        <div className="flex-grow min-w-0 cursor-pointer active:bg-[#202c33] py-1.5 rounded flex flex-col justify-center">
          <h2 className="font-semibold text-[17px] text-[#e9edef] truncate leading-none">{chat.name}</h2>
          {chat.isTyping && (
            <p className="text-[13px] text-[#21c063] truncate font-medium mt-1 leading-none">
              typing...
            </p>
          )}
        </div>
        <div className="flex gap-5 items-center px-4 text-[#e9edef]">
          <Video className="w-[24px] h-[24px] stroke-[1.8]" />
          <Phone className="w-[22px] h-[22px] stroke-[1.8]" />
          <MoreVertical className="w-[24px] h-[24px] stroke-[1.8]" />
        </div>
      </header>

      {/* Messages Area */}
      <div
        className="flex-grow overflow-y-auto p-3 relative flex flex-col z-10 custom-scrollbar pb-4 bg-transparent"
        ref={scrollRef}
        onClick={() => {
          setShowAttachments(false);
        }}
      >

        {chat.messages.length === 0 && (
          <div className="flex justify-center mb-4 mt-4">
            <div className="bg-[#182229] text-[#ffd279] text-[12.5px] px-4 py-2.5 rounded-lg shadow-sm text-center max-w-[95%] font-medium leading-[1.45]">
              <span className="flex items-center justify-center gap-1.5 mb-[3px]">
                <svg viewBox="0 0 12 15" width="10" height="13" className="fill-current"><path d="M11.5 6.5H11V5C11 2.2 8.8 0 6 0S1 2.2 1 5v1.5H.5C.2 6.5 0 6.7 0 7v7c0 .3.2.5.5.5h11c.3 0 .5-.2.5-.5V7c0-.3-.2-.5-.5-.5zM6 11.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM8.5 6.5h-5V5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v1.5z"></path></svg>
                Messages and calls are end-to-end encrypted.
              </span>
              <span>Only people in this chat can read, listen to, or share them. <span className="font-bold cursor-pointer hover:underline">Learn more</span></span>
            </div>
          </div>
        )}

        {chat.messages.map((msg, idx) => {
          const isSent = msg.sender === 'user';
          const showTail = idx === 0 || chat.messages[idx - 1].sender !== msg.sender;

          return (
            <div
              key={msg.id}
              className={cn("flex mb-[3px]", isSent ? "justify-end" : "justify-start")}
              onMouseDown={() => startLongPress(msg)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => startLongPress(msg)}
              onTouchEnd={cancelLongPress}
            >
              <div
                className={cn(
                  "max-w-[85%] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative flex flex-col group",
                  isSent ? "bg-[#005c4b]" : "bg-[#202c33]",
                  isSent ? "rounded-l-xl rounded-br-xl" : "rounded-r-xl rounded-bl-xl",
                  showTail && isSent ? "rounded-tr-none" : "",
                  showTail && !isSent ? "rounded-tl-none" : "",
                  !showTail && isSent ? "rounded-tr-xl" : "",
                  !showTail && !isSent ? "rounded-tl-xl" : ""
                )}
              >
                {showTail && (
                  <div className={cn(
                    "absolute top-0 w-[10px] h-[13px]",
                    isSent ? "-right-[9px] bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]" : "-left-[9px] bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]"
                  )} />
                )}

                {/* Quoted reply preview inside bubble */}
                {msg.replyTo && (
                  <div className={cn(
                    "rounded-lg mb-1.5 overflow-hidden flex flex-col bg-black/15",
                    "border-l-[4px]",
                    msg.replyTo.sender === 'user' ? "border-l-[#7dd3fc]" : "border-l-[#a67cff]"
                  )}>
                    <span className={cn(
                      "text-[13px] font-bold px-2.5 pt-1.5 pb-0.5 leading-tight",
                      msg.replyTo.sender === 'user' ? "text-[#7dd3fc]" : "text-[#a67cff]"
                    )}>
                      {msg.replyTo.sender === 'user' ? 'You' : chat.name}
                    </span>
                    <span className="text-[14px] text-[#e9edef]/80 px-2.5 pb-1.5 line-clamp-3 leading-[1.3] whitespace-pre-wrap">
                      {msg.replyTo.text}
                    </span>
                  </div>
                )}

                <span className="text-[15.5px] text-[#e9edef] leading-[1.35] pb-[16px] pr-12 whitespace-pre-wrap break-words inline-block">
                  {msg.text}
                </span>

                <div className="absolute bottom-1 right-2 flex items-center gap-[2px] h-[15px]">
                  <span className="text-[10px] text-[#8696a0] leading-none mt-[2px]">{msg.time}</span>
                  <MessageStatus status={msg.status} isSent={isSent} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attachment Menu Overlay */}
      {showAttachments && (
        <div className="absolute bottom-[80px] inset-x-2 bg-[#202c33] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-5 pb-7 z-40 grid grid-cols-4 gap-y-7 gap-x-2 animate-fade-in border border-[#222d34]">
          {[
            { icon: FileText, bg: 'bg-[#7F66FF]', label: 'Document' },
            { icon: Camera, bg: 'bg-[#ED597E]', label: 'Camera' },
            { icon: ImageIcon, bg: 'bg-[#AC44CF]', label: 'Gallery' },
            { icon: Headphones, bg: 'bg-[#E5622C]', label: 'Audio' },
            { icon: MapPin, bg: 'bg-[#0E9D5B]', label: 'Location' },
            { icon: IndianRupee, bg: 'bg-[#01A39D]', label: 'Payment' },
            { icon: Contact, bg: 'bg-[#0A7BCA]', label: 'Contact' },
            { icon: BarChart2, bg: 'bg-[#E3A10A]', label: 'Poll' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
              <div className={cn("w-[54px] h-[54px] rounded-full flex items-center justify-center text-white shadow-sm", item.bg)}>
                <item.icon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[12px] text-[#e9edef] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <footer className={cn(
        "bg-transparent px-[6px] py-[6px] flex items-end gap-[6px] z-30 flex-shrink-0 transition-all",
        "pb-[16px] sm:pb-[32px]"
      )}>
        <div className="flex-grow bg-[#202c33] rounded-[24px] flex flex-col justify-center min-w-0">

          {/* Reply Preview Banner (Inside Input Bubble) */}
          {replyTo && (
            <div className="bg-[#1b252a] mx-1.5 mt-1.5 rounded-[12px] flex relative overflow-hidden h-[54px]">
              {/* Left Color Bar */}
              <div className={cn(
                "w-[4px] flex-shrink-0",
                replyTo.sender === 'user' ? "bg-[#7dd3fc]" : "bg-[#a67cff]"
              )} />

              <div className="px-2.5 py-[6px] flex-grow min-w-0 flex flex-col justify-center pr-8">
                <span className={cn(
                  "text-[13.5px] font-bold mb-[2px] leading-none",
                  replyTo.sender === 'user' ? "text-[#7dd3fc]" : "text-[#a67cff]"
                )}>
                  {replyTo.sender === 'user' ? 'You' : chat.name}
                </span>
                <span className="text-[14px] text-[#8696a0] truncate leading-tight">
                  {replyTo.text.split('\n')[0]}
                </span>
              </div>

              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-[#8696a0] hover:text-[#e9edef] active:bg-[#202c33] rounded-full flex items-center justify-center transition-colors"
                onClick={() => setReplyTo(null)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          )}

          {/* Actual Input Row */}
          <div className="flex items-center pl-[6px] pr-[16px] min-h-[50px] max-h-[140px]">
            <button
              className="p-[8px] text-[#8696a0] hover:text-[#e9edef] rounded-full active:bg-[#2a3942] transition-colors"
            >
              <StickerEmojiIcon className="w-[26px] h-[26px]" />
            </button>
            <input
              type="text"
              enterKeyHint="send"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message"
              className="flex-grow w-full min-w-[50px] bg-transparent text-[17.5px] px-2 py-0 outline-none text-[#e9edef] placeholder:text-[#8696a0]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex gap-[12px] text-[#8696a0] items-center flex-shrink-0">
              <button
                className="active:bg-[#2a3942] rounded-full transition-transform hover:text-[#e9edef]"
                onClick={handleAttachmentClick}
              >
                <VerticalPaperclip className="w-[24px] h-[24px]" />
              </button>
              {!inputText.trim() && (
                <>
                  <button className="active:bg-[#2a3942] rounded-full hover:text-[#e9edef] flex items-center justify-center">
                    <div className="w-[22px] h-[22px] rounded-full border-[2.2px] border-current flex items-center justify-center">
                      <IndianRupee className="w-[12px] h-[12px] stroke-[2.5]" />
                    </div>
                  </button>
                  <button className="active:bg-[#2a3942] rounded-full hover:text-[#e9edef] transition-colors">
                    <Camera className="w-[25px] h-[25px] stroke-[2.2]" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {inputText.trim() ? (
          <button
            className="bg-[#21c063] w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-md flex-shrink-0 active:scale-95 transition-transform"
            onClick={handleSend}
          >
            <SolidSendIcon className="w-[24px] h-[24px]" />
          </button>
        ) : (
          <button className="bg-[#21c063] w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-md flex-shrink-0 active:scale-95 transition-transform">
            <SolidMicIcon className="w-[24px] h-[24px] text-[#0b141a]" />
          </button>
        )}
      </footer>


    </div>
  );
};

// --- Main App ---

export default function App() {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const handleSendMessage = (chatId, text, replyTo = null) => {
    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      replyTo: replyTo ? { id: replyTo.id, sender: replyTo.sender, text: replyTo.text } : null
    };

    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return { ...c, lastMessage: text, time: newMessage.time, messages: [...c.messages, newMessage] };
      }
      return c;
    }));

    // Mark as delivered after a short delay, then read
    setTimeout(() => {
      setChats(prev => prev.map(c => c.id === chatId
        ? { ...c, messages: c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m) }
        : c));
    }, 500);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id === chatId
        ? { ...c, messages: c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m) }
        : c));
    }, 1200);
  };

  /**
   * Call this function to add an incoming agent/bot message to a chat.
   * Wire this up to your n8n webhook response.
   *
   * @param {number} chatId - The chat ID to add the message to.
   * @param {string} text - The message text from the agent.
   */
  const handleReceiveMessage = (chatId, text) => {
    const incomingMessage = {
      id: Date.now() + Math.random(),
      sender: 'agent',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          lastMessage: text,
          time: incomingMessage.time,
          isTyping: false,
          messages: [...c.messages, incomingMessage]
        };
      }
      return c;
    }));
  };

  // Expose handleReceiveMessage globally so n8n or external scripts can push messages in
  useEffect(() => {
    window.__whatsappUI = {
      receiveMessage: handleReceiveMessage,
      setTyping: (chatId, isTyping) => {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, isTyping } : c));
      }
    };
  }, []);

  const activeChat = chats.find(c => c.id === selectedChatId);

  const mobileContent = (
    <div className="w-full h-full sm:h-screen sm:max-w-md sm:mx-auto bg-[#0b141a] relative overflow-hidden flex flex-col font-sans sm:shadow-2xl sm:border sm:border-[#222]">
      {activeChat ? (
        <ChatDetailScreen
          chat={activeChat}
          onBack={() => setSelectedChatId(null)}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <ChatListScreen
          chats={chats}
          onSelectChat={setSelectedChatId}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#111b21]">
      {mobileContent}
    </div>
  );
}
