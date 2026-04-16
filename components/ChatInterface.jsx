'use client';

import { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import apiService from '../lib/api';
import { signInWithGoogle, signOutUser, onAuthChange } from '../lib/firebase';
import ClaudeChatInput from './ui/claude-chat-input';
import { Menu, PanelLeftClose, Trash2, ArrowUp, LogOut, User, ThumbsUp, ThumbsDown, Settings, Sparkles, Moon, Sun, Download, Compass, ChevronDown } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import RichResponseRenderer from './rich/RichResponseRenderer';
import AptitudeAssessment from './AptitudeAssessment';
import CareerComparison from './CareerComparison';
import LanguageSwitcher from './LanguageSwitcher';
// Global styles for dark mode
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.scrollThumb};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.scrollThumbHover};
  }
`;

// Theme configurations
const lightTheme = {
  background: '#f5efe6',
  secondaryBackground: '#efe6da',
  cardBackground: 'rgba(255, 252, 247, 0.84)',
  userMessageBackground: 'linear-gradient(135deg, #2f241d 0%, #4c372a 100%)',
  botMessageBackground: 'rgba(255, 250, 244, 0.92)',
  text: '#2d241e',
  secondaryText: '#7a675b',
  border: 'rgba(97, 73, 58, 0.14)',
  userMessageText: '#fffaf5',
  botMessageText: '#2d241e',
  buttonBackground: '#b85c38',
  buttonHover: '#9f4d2d',
  inputBackground: 'rgba(255, 252, 247, 0.95)',
  inputBorder: 'rgba(120, 92, 74, 0.16)',
  headerBackground: 'rgba(245, 239, 230, 0.84)',
  scrollTrack: 'rgba(239, 230, 218, 0.6)',
  scrollThumb: 'rgba(184, 92, 56, 0.4)',
  scrollThumbHover: 'rgba(184, 92, 56, 0.6)',
  shadowLight: '0 10px 30px rgba(77, 53, 40, 0.08)',
  shadowMedium: '0 18px 50px rgba(77, 53, 40, 0.12)',
  accent: '#b85c38',
  accentSoft: 'rgba(184, 92, 56, 0.12)',
};

const darkTheme = {
  background: '#171412',
  secondaryBackground: '#221d1a',
  cardBackground: 'rgba(31, 27, 24, 0.88)',
  userMessageBackground: 'linear-gradient(135deg, #d9794e 0%, #b85c38 100%)',
  botMessageBackground: 'rgba(33, 29, 26, 0.92)',
  text: '#f4ebe4',
  secondaryText: '#b8a79b',
  border: 'rgba(255, 232, 217, 0.09)',
  userMessageText: '#fff9f3',
  botMessageText: '#f4ebe4',
  buttonBackground: '#d9794e',
  buttonHover: '#ea865a',
  inputBackground: 'rgba(30, 25, 22, 0.96)',
  inputBorder: 'rgba(255, 232, 217, 0.12)',
  headerBackground: 'rgba(23, 20, 18, 0.78)',
  scrollTrack: 'rgba(34, 29, 26, 0.8)',
  scrollThumb: 'rgba(217, 121, 78, 0.34)',
  scrollThumbHover: 'rgba(217, 121, 78, 0.5)',
  shadowLight: '0 12px 32px rgba(0, 0, 0, 0.26)',
  shadowMedium: '0 24px 60px rgba(0, 0, 0, 0.34)',
  accent: '#d9794e',
  accentSoft: 'rgba(217, 121, 78, 0.14)',
};

// Styled components
const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: row;
  background: ${props => props.theme.background};
  transition: all 0.3s ease;
`;

const Sidebar = styled.aside`
  width: ${props => props.$isExpanded ? '260px' : '60px'};
  min-width: ${props => props.$isExpanded ? '260px' : '60px'};
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: ${props => props.theme.secondaryBackground};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 100;
  
  @media (max-width: 768px) {
    width: ${props => props.$isExpanded ? '260px' : '0px'};
    min-width: ${props => props.$isExpanded ? '260px' : '0px'};
  }
`;

const SidebarHeader = styled.div`
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isExpanded ? 'space-between' : 'center'};
`;

const SidebarToggleBtn = styled.button`
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  color: ${props => props.theme.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 1rem;
  
  &:hover {
    background: ${props => props.theme.border};
  }
`;

const SidebarNav = styled.nav`
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NavItem = styled.button`
  width: 100%;
  padding: ${props => props.$isExpanded ? '0.625rem 0.75rem' : '0.625rem'};
  background: ${props => props.$isActive ? props.theme.border : 'transparent'};
  border: none;
  border-radius: 8px;
  color: ${props => props.$isActive ? props.theme.text : props.theme.secondaryText};
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isExpanded ? 'flex-start' : 'center'};
  gap: 0.75rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.border};
    color: ${props => props.theme.text};
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
  }
  
  .nav-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: ${props => props.$isExpanded ? 'block' : 'none'};
  }
`;

const NewChatBtn = styled(NavItem)`
  background: ${props => props.theme.buttonBackground};
  color: ${props => props.theme.background};
  
  &:hover {
    background: ${props => props.theme.buttonHover};
    color: ${props => props.theme.background};
  }
  
  .nav-icon {
    color: inherit;
  }
`;


const SidebarFooter = styled.div`
  padding: 0.75rem;
  border-top: 1px solid ${props => props.theme.border};
  margin-top: auto;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: ${props => props.$isExpanded ? 'flex-start' : 'center'};
  
  &:hover {
    background: ${props => props.theme.border};
  }
  
  .profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${props => props.theme.border};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    font-size: 0.875rem;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .profile-info {
    flex: 1;
    min-width: 0;
    display: ${props => props.$isExpanded ? 'block' : 'none'};
    
    .profile-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: ${props => props.theme.text};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .profile-plan {
      font-size: 0.75rem;
      color: ${props => props.theme.secondaryText};
    }
  }
  
  .expand-icon {
    display: ${props => props.$isExpanded ? 'block' : 'none'};
    color: ${props => props.theme.secondaryText};
    font-size: 0.75rem;
  }
`;

const SidebarOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: ${props => props.$sidebarExpanded ? '260px' : '60px'};
  transition: margin-left 0.2s ease;
  background: ${props => props.theme.background};
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Header = styled.header`
  background: ${props => props.theme.headerBackground};
  color: ${props => props.theme.text};
  padding: ${props => props.$minimal ? '0.6rem 1.2rem' : '1rem 1.5rem'};
  border-bottom: ${props => props.$minimal ? 'none' : `1px solid ${props.theme.border}`};
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: ${props => props.$minimal ? 'none' : 'blur(18px)'};
  position: sticky;
  top: 0;
  z-index: 40;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const HeaderEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.accent};
`;

const Title = styled.h1`
  font-size: 1.15rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.text};
`;

const HeaderSubtext = styled.p`
  font-size: 0.82rem;
  color: ${props => props.theme.secondaryText};
`;

const ThemeToggle = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;

  &:hover {
    background: ${props => props.theme.secondaryBackground};
    border-color: ${props => props.theme.accent};
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 640px) {
    gap: 0.5rem;
  }
`;

const SignInButton = styled.button`
  background: ${props => props.theme.buttonBackground};
  color: ${props => props.theme.background};
  border: none;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.buttonHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChatContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  padding: 0.35rem 1rem 1rem;

  @media (max-width: 768px) {
    padding: 0.75rem 0.75rem 0.9rem;
  }
`;

const ChatFrame = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1rem 10.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  scroll-behavior: smooth;
  background: transparent;

  @media (max-width: 640px) {
    padding: 0.75rem 0.5rem 9.5rem;
  }
`;

const MessageBubble = styled.div`
  width: min(100%, 860px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  gap: 0.45rem;

  @media (max-width: 640px) {
    gap: 0.35rem;
  }

  .message-shell {
    width: 100%;
    max-width: ${props => props.$isUser ? 'min(72%, 680px)' : '100%'};
    display: flex;
    flex-direction: column;
    align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};

    @media (max-width: 640px) {
      max-width: ${props => props.$isUser ? '90%' : '100%'};
    }
  }

  .message-avatar {
    display: none;
  }
  
  .message-content {
    background: ${props => props.$isUser ? 'rgba(255, 252, 247, 0.07)' : 'transparent'};
    color: ${props => props.$isUser ? '#f4ebe4' : '#f6ede5'};
    padding: ${props => props.$isUser ? '0.9rem 1rem' : '0'};
    border: 1px solid ${props => props.$isUser ? 'rgba(255, 252, 247, 0.08)' : 'transparent'};
    border-radius: ${props => props.$isUser ? '16px 16px 4px 16px' : '0'};
    max-width: 100%;
    font-size: ${props => props.$isUser ? '0.98rem' : '1.05rem'};
    line-height: ${props => props.$isUser ? '1.65' : '1.72'};
    box-shadow: none;
    font-family: inherit;
    
    h1, h2, h3, h4, h5, h6 {
      margin: 0 0 1rem 0;
      font-weight: 600;
      line-height: 1.28;
      color: #fff7ef;
      font-family: inherit;
    }
    
    h1 { font-size: 1.9rem; }
    h2 { font-size: 1.45rem; }
    h3 { font-size: 1.2rem; }
    
    p {
      margin: 0 0 1rem 0;
      line-height: ${props => props.$isUser ? '1.65' : '1.72'};
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    ul, ol {
      margin: 0 0 1rem 0;
      padding-left: 1.5rem;
      
      li {
        margin-bottom: 0.55rem;
        line-height: 1.72;
      }
    }
    
    code {
      background: rgba(255, 252, 247, 0.08);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: rgba(255, 252, 247, 0.04);
      border: 1px solid rgba(255, 252, 247, 0.08);
      padding: 1rem 1.1rem;
      border-radius: 14px;
      overflow-x: auto;
      margin: 1rem 0;
      
      code {
        background: none;
        padding: 0;
      }
    }
    
    strong {
      font-weight: 600;
    }
  }
  
  .timestamp {
    font-size: 0.72rem;
    color: ${props => props.theme.secondaryText};
    margin-top: 0.1rem;
    padding: 0;
    display: ${props => props.$isUser ? 'block' : 'none'};
  }
`;

const TypingIndicator = styled.div`
  width: min(100%, 860px);
  margin: 0 auto;
  align-self: center;
  
  .typing-content {
    background: transparent;
    color: #bca999;
    padding: 0;
    border-radius: 0;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    box-shadow: none;
    font-size: 0.94rem;
    
    .dots {
      display: flex;
      gap: 0.25rem;
      
      .dot {
        width: 6px;
        height: 6px;
        background: ${props => props.theme.secondaryText};
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }
`;

const InputSection = styled.div`
  position: sticky;
  bottom: 0;
  padding: 0 1rem 1rem;
  border-top: none;
  background: linear-gradient(
    180deg,
    rgba(23, 20, 18, 0) 0%,
    rgba(23, 20, 18, 0.84) 24%,
    rgba(23, 20, 18, 0.94) 60%,
    rgba(23, 20, 18, 1) 100%
  );
  
  .input-container {
    max-width: 100%;
    margin: 0 auto;
    display: flex;
    gap: 0.625rem;
    align-items: flex-end;
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  background: transparent;
  border: none;
  color: #f4ebe4;
  padding: 0.7rem 0.35rem 0.7rem 0;
  border-radius: 1.4rem;
  resize: none;
  min-height: 54px;
  max-height: 6rem;  /* ~4 visible lines at 1.5 line-height; scrolls internally */
  overflow-y: auto;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: ${props => props.theme.secondaryText};
  }
`;

const SendButton = styled.button`
  background: transparent;
  color: #f3e7db;
  border: none;
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  
  &:hover:not(:disabled) {
    background: rgba(255, 252, 247, 0.08);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const StagePill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: center;
  margin: 0 0 1rem 0;
  padding: 0.25rem 0;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #9f8b7d;
  background: transparent;
  border: none;
  box-shadow: none;

  @media (max-width: 640px) {
    margin: 0 0 0.8rem 0;
  }
`;

const ComposerCard = styled.div`
  max-width: 944px;
  margin: 0 auto;
  padding: 0.9rem 1.1rem 0.8rem;
  border-radius: 1.75rem;
  background: rgba(49, 45, 40, 0.92);
  border: 1px solid rgba(255, 252, 247, 0.12);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
`;

const ComposerFooter = styled.div`
  margin-top: 0.55rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.2rem;
  font-size: 0.72rem;
  color: #b8a79b;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HelperPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.4rem;
  border-radius: 999px;
  background: transparent;
  border: none;
`;

const FeedbackBar = styled.div`
  display: none;
  gap: 0.375rem;
  margin-top: 0.5rem;
  align-items: center;

  /* Show on hover of the parent message-shell */
  .message-shell:hover & {
    display: flex;
  }
`;

const FeedbackButton = styled.button`
  background: ${props => props.$active ? props.$activeColorBg : 'transparent'};
  border: 1px solid ${props => props.$active ? props.$activeColor : props.theme.border};
  border-radius: 999px;
  padding: 0.32rem 0.58rem;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  color: ${props => props.$active ? props.$activeColor : props.theme.secondaryText};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  transition: all 0.15s ease;
  pointer-events: ${props => props.$disabled ? 'none' : 'auto'};
`;

const JumpToLatestButton = styled.button`
  position: sticky;
  bottom: 0.75rem;
  align-self: center;
  margin-left: auto;
  margin-right: auto;
  background: rgba(49, 45, 40, 0.94);
  color: #fff8f3;
  border: none;
  border-radius: 999px;
  padding: 0.52rem 0.95rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${props => props.theme.shadowMedium};
  display: flex;
  align-items: center;
  gap: 0.35rem;
  z-index: 10;
  backdrop-filter: blur(8px);
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

// Placeholder text rotates based on the current counseling stage.
const STAGE_PLACEHOLDERS = {
  discovery:   'Tell me about your interests, education, or career goals...',
  assessment:  'Share your skills, strengths, or what you want to improve...',
  exploration: 'Ask about any career, compare paths, or explore options...',
  roadmap:     'Ask about courses, certifications, or next steps...',
};

const ChatInterface = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStage, setCurrentStage] = useState('discovery');
  const [isLoading, setIsLoading] = useState(false);

  // Auth state
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // New chat view state
  const [showNewChatView, setShowNewChatView] = useState(true);

  // Feedback state: messageId → 'thumbs_up' | 'thumbs_down'
  const [messageFeedback, setMessageFeedback] = useState({});

  // Profile settings view
  const [showSettings, setShowSettings] = useState(false);

  // Aptitude assessment modal
  const [showAssessment, setShowAssessment] = useState(false);

  // Career comparison modal
  const [showComparison, setShowComparison] = useState(false);

  // PDF export state
  const [exportingPdf, setExportingPdf] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Jump-to-latest pill: only show when user has scrolled up meaningfully
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Mobile swipe-to-open sidebar
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    // Swipe right from left edge → open sidebar
    if (dx > 60 && e.changedTouches[0].clientX < 300 && !mobileSidebarOpen) {
      setMobileSidebarOpen(true);
    }
    // Swipe left → close sidebar
    if (dx < -60 && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  // Initialize dark mode from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Welcome message
    setMessages([{
      id: 1,
      content: `# Welcome to Your AI Career Counselor

I'm here to guide you through your career journey with personalized insights and actionable advice.

**What I can help you with:**
- **Discover** your strengths and interests
- **Analyze** your career potential
- **Recommend** suitable career paths
- **Create** personalized learning roadmaps
- **Plan** actionable next steps

Let's start by understanding your current situation. What brings you here today?`,
      isUser: false,
      timestamp: Date.now()
    }]);

    // Initial suggestions are attached to the welcome message directly
    setMessages(prev => prev.map((m, i) =>
      i === prev.length - 1
        ? { ...m, suggestions: [
            "I want to transition to a new career",
            "Help me advance in my current role",
            "I'm a recent graduate seeking direction",
            "I'm re-entering the workforce",
          ]}
        : m
    ));
  }, []);

  useEffect(() => {
    // Only auto-scroll when the user is already at the bottom. If they've scrolled up
    // to read history, leave their scroll position alone — the "Jump to latest" pill
    // will appear instead.
    if (isNearBottom) scrollToBottom();
  }, [messages, isNearBottom]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Auth state listener — load single persistent chat history
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });

        // Load persistent chat history for this user
        try {
          const history = await apiService.getChatHistory();
          if (history.messages && history.messages.length > 0) {
            const historicalMessages = history.messages.map((msg, i) => ({
              id: msg.id || `hist-${i}`,
              content: msg.content,
              isUser: msg.isUser,
              timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
            }));

            // Returning user: try to synthesise a ProgressCheckIn card from their roadmap.
            // If they have any roadmap items, prepend it as the first "system card" message.
            let leadingCard = null;
            try {
              const roadmap = await apiService.getRoadmap();
              if (roadmap && (roadmap.total || 0) > 0) {
                const completedCount = (roadmap.completed || []).length;
                const currentItem = (roadmap.in_progress || [])[0];
                const nextItem = (roadmap.todo || [])[0];
                const lastMsgTs = historicalMessages[historicalMessages.length - 1]?.timestamp;
                const daysSince = lastMsgTs
                  ? Math.max(0, Math.floor((Date.now() - lastMsgTs) / 86400000))
                  : null;

                leadingCard = {
                  id: 'progress-checkin',
                  isUser: false,
                  content: '',
                  timestamp: Date.now(),
                  richComponent: {
                    type: 'progress_checkin',
                    data: {
                      userName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'there',
                      completionPercent: roadmap.completion_pct || 0,
                      completedModules: completedCount,
                      currentModule: currentItem?.title || null,
                      nextModule: nextItem?.title || null,
                      lastVisitDays: daysSince,
                    },
                  },
                };
              }
            } catch (e) {
              // Roadmap unavailable — no check-in card. Not a fatal error.
            }

            setMessages(leadingCard ? [leadingCard, ...historicalMessages] : historicalMessages);
            setCurrentStage(history.stage || 'discovery');
            setShowNewChatView(false);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Track whether the user is near the bottom of the message list.
  // Auto-scroll only fires when they are (so scrolling up to read history isn't interrupted).
  const handleMessagesScroll = () => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom < 120);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: message,
      isUser: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Create placeholder for bot message
    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      content: '',
      isUser: false,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, botMessage]);

    try {
      let fullResponse = '';

      await apiService.streamMessage(
        message,
        null,
        currentStage,
        (token) => {
          fullResponse += token;
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId ? { ...msg, content: fullResponse } : msg
          ));
        },
        (data) => { // onComplete
          const { stage, suggestions, rich_component, clean_text } = data;
          if (stage) setCurrentStage(stage);
          // Replace bot message content with the server-cleaned text (META stripped)
          // and attach rich component + per-message suggestions.
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  content: typeof clean_text === 'string' ? clean_text : msg.content,
                  richComponent: rich_component || null,
                  suggestions: suggestions || [],
                }
              : msg
          ));
        },
        (error) => {
          throw error;
        }
      );

    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage = `I apologize, but I encountered an error: ${error.message}. Please try again.`;

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, content: msg.content + '\n\n' + errorMessage }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on a session in sidebar
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStageDisplay = (stage) => {
    const stageMap = {
      discovery: 'Discovery Phase — Understanding your background',
      analysis: 'Analysis Phase — Evaluating your strengths',
      recommendations: 'Recommendations Phase — Exploring career options',
      learning_path: 'Learning Path Phase — Building your roadmap',
      action_plan: 'Action Plan Phase — Creating next steps',
      follow_up: 'Follow-up Phase — Ongoing support'
    };
    return stageMap[stage] || 'Career Counseling Session';
  };

  const handleClearChat = async () => {
    if (!confirm('Clear all chat history and memory? This cannot be undone.')) return;
    try {
      await apiService.clearChatHistory();
      setMessages([]);
      setCurrentStage('discovery');
      setShowNewChatView(true);
    } catch (e) {
      console.error('Failed to clear chat:', e);
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await apiService.exportSessionPdf('history', 'career-plan.pdf');
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleFeedback = (messageId, rating) => {
    setMessageFeedback(prev => ({ ...prev, [messageId]: rating }));
  };

  // Handler for when user sends message from Claude input (landing view)
  const handleClaudeInputSend = async ({ message }) => {
    setShowNewChatView(false);
    await handleSendMessage(message);
  };


  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setMobileSidebarOpen(prev => !prev);
      return;
    }
    setSidebarExpanded(!sidebarExpanded);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // ── Settings view ──────────────────────────────────────────────────────────
  if (showSettings) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <ProfileSettings
          isDarkMode={isDarkMode}
          onBack={() => setShowSettings(false)}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {showAssessment && <AptitudeAssessment onClose={() => setShowAssessment(false)} />}
      {showComparison && <CareerComparison onClose={() => setShowComparison(false)} />}
      <AppContainer onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Mobile Overlay */}
        <SidebarOverlay $isOpen={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(false)} />

        {/* Sidebar */}
        <Sidebar $isExpanded={sidebarExpanded || mobileSidebarOpen}>
          {/* Header with toggle */}
          <SidebarHeader $isExpanded={sidebarExpanded || mobileSidebarOpen}>
            <SidebarToggleBtn onClick={toggleSidebar} title={sidebarExpanded || mobileSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
              {sidebarExpanded || mobileSidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
            </SidebarToggleBtn>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarNav>
            {messages.length > 0 && (
              <NewChatBtn $isExpanded={sidebarExpanded || mobileSidebarOpen} onClick={handleClearChat} title="Clear chat & memory">
                <span className="nav-icon"><Trash2 size={16} /></span>
                <span className="nav-label">Clear chat</span>
              </NewChatBtn>
            )}
          </SidebarNav>

          {/* Profile Footer */}
          <SidebarFooter>
            {user ? (
              <div style={{ position: 'relative' }} ref={profileDropdownRef}>
                <ProfileSection $isExpanded={sidebarExpanded || mobileSidebarOpen} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                  <div className="profile-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Profile'} />
                    ) : (
                      <span>{user.displayName?.charAt(0) || <User size={16} />}</span>
                    )}
                  </div>
                  {(sidebarExpanded || mobileSidebarOpen) && (
                    <div className="profile-info">
                      <div className="profile-name">{user.displayName || 'User'}</div>
                    </div>
                  )}
                  {(sidebarExpanded || mobileSidebarOpen) && <ChevronDown size={14} className="expand-icon" />}
                </ProfileSection>

                {/* Profile Dropdown with Logout */}
                {showProfileDropdown && (sidebarExpanded || mobileSidebarOpen) && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    marginBottom: '8px',
                    background: theme.secondaryBackground,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => { setShowSettings(true); setShowProfileDropdown(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: theme.text,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = theme.border}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Settings size={15} /> Profile Settings
                    </button>
                    {/* Compare Careers button */}
                    <button
                      onClick={() => { setShowProfileDropdown(false); setShowComparison(true); }}
                      style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '6px', color: theme.text, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseOver={(e) => e.currentTarget.style.background = theme.border}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      ⚖️ Compare Careers
                    </button>
                    {[
                      { href: '/memory',     icon: '🧠', label: 'My Career Memory' },
                      { href: '/roadmap',    icon: '🗺️', label: 'Learning Roadmap' },
                      { href: '/developers', icon: '🔑', label: 'Developer API' },
                    ].map(({ href, icon, label }) => (
                      <button
                        key={href}
                        onClick={() => { setShowProfileDropdown(false); window.location.href = href; }}
                        style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '6px', color: theme.text, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onMouseOver={(e) => e.currentTarget.style.background = theme.border}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {icon} {label}
                      </button>
                    ))}
                    <div style={{ borderTop: `1px solid ${theme.border}`, margin: '4px 0' }} />
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: theme.text,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = theme.border}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={15} /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              sidebarExpanded || mobileSidebarOpen ? (
                <SignInButton onClick={handleSignIn} style={{ width: '100%' }}>
                  Sign in with Google
                </SignInButton>
              ) : (
                <ProfileSection $isExpanded={false} onClick={handleSignIn} title="Sign in">
                  <div className="profile-avatar">
                    <span><User size={16} /></span>
                  </div>
                </ProfileSection>
              )
            )}
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <MainContent $sidebarExpanded={sidebarExpanded}>
          <Header $minimal={!showNewChatView}>
            {showNewChatView ? (
              <HeaderCopy>
                <HeaderEyebrow>
                  <Sparkles size={13} />
                  Career Strategy Workspace
                </HeaderEyebrow>
                <Title>AI Career Counselor</Title>
                <HeaderSubtext>
                  Personalized guidance, live roadmap support, and practical next steps.
                </HeaderSubtext>
              </HeaderCopy>
            ) : (
              <div />
            )}
            <HeaderRight>
              {messages.length > 1 && (
                <ThemeToggle
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  title="Export as PDF"
                >
                  <Download size={15} />
                  {exportingPdf ? 'Exporting…' : 'Export PDF'}
                </ThemeToggle>
              )}
              <ThemeToggle onClick={toggleTheme} title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                {isDarkMode ? 'Light' : 'Dark'}
              </ThemeToggle>
              <LanguageSwitcher />
            </HeaderRight>
          </Header>

          {showNewChatView ? (
            /* Claude-style New Chat View */
            <div className={isDarkMode ? 'dark' : ''} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? '#212121' : '#FAF9F5' }}>
              <ClaudeChatInput
                onSendMessage={handleClaudeInputSend}
                userName={user?.displayName?.split(' ')[0] || 'there'}
                isDark={isDarkMode}
              />
            </div>
          ) : (
            /* Regular Chat View */
            <ChatContainer>
              <StagePill>
                <Compass size={14} />
                {getStageDisplay(currentStage)}
              </StagePill>
              <ChatFrame>
              <MessagesArea ref={messagesAreaRef} onScroll={handleMessagesScroll}>
                {messages.map((message) => {
                  // Strip any in-progress <<META>> tokens during streaming so
                  // the raw delimiter never reaches the UI. On stream-complete,
                  // the backend sends authoritative clean_text which replaces this.
                  const displayContent = message.isUser
                    ? message.content
                    : (message.content || '').split('<<META>>')[0];
                  return (
                  <MessageBubble key={message.id} $isUser={message.isUser}>
                    <div className="message-avatar">
                      {message.isUser ? <User size={16} /> : <Sparkles size={15} />}
                    </div>
                    <div className="message-shell">
                      <div className="message-content">
                        {message.isUser ? (
                          displayContent
                        ) : (
                          <ReactMarkdown>{displayContent}</ReactMarkdown>
                        )}
                      </div>
                      {/* Rich response component (career card / comparison / action plan) */}
                      {!message.isUser && message.richComponent && (
                        <RichResponseRenderer
                          component={message.richComponent}
                          onSuggestionClick={(text) => handleSendMessage(text)}
                        />
                      )}
                      <div className="timestamp">
                        {message.isUser ? 'You • ' : ''}{formatTime(message.timestamp)}
                      </div>
                      {/* Feedback buttons — only for AI messages with content */}
                      {!message.isUser && displayContent && user && (
                        <FeedbackBar>
                        <FeedbackButton
                          onClick={() => handleFeedback(message.id, 'thumbs_up')}
                          title="Helpful"
                          $active={messageFeedback[message.id] === 'thumbs_up'}
                          $activeColor="#22c55e"
                          $activeColorBg={isDarkMode ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}
                          $disabled={Boolean(messageFeedback[message.id])}
                        >
                          <ThumbsUp size={13} />
                        </FeedbackButton>
                        <FeedbackButton
                          onClick={() => handleFeedback(message.id, 'thumbs_down')}
                          title="Not helpful"
                          $active={messageFeedback[message.id] === 'thumbs_down'}
                          $activeColor="#ef4444"
                          $activeColorBg={isDarkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'}
                          $disabled={Boolean(messageFeedback[message.id])}
                        >
                          <ThumbsDown size={13} />
                        </FeedbackButton>
                        {messageFeedback[message.id] && (
                          <span style={{ fontSize: '0.7rem', color: theme.secondaryText, marginLeft: '0.125rem' }}>
                            Feedback recorded
                          </span>
                        )}
                        </FeedbackBar>
                      )}
                      {/* Per-message suggestion chips */}
                      {!message.isUser && Array.isArray(message.suggestions) && message.suggestions.length > 0 && !isLoading && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                          {message.suggestions.map((chip, ci) => (
                            <button
                              key={ci}
                              onClick={() => handleSendMessage(chip)}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '999px',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                color: '#d4c5b9',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: 'inherit',
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </MessageBubble>
                  );
                })}

                {(() => {
                  // Pre-stream indicator: show only while the bot placeholder is still empty.
                  // Once the first token arrives, the streaming text itself is the indicator.
                  const last = messages[messages.length - 1];
                  const preStream = isLoading && last && !last.isUser && !last.content;
                  if (!preStream) return null;
                  return (
                    <TypingIndicator>
                      <div className="typing-content">
                        <span>Counselor is thinking</span>
                        <div className="dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    </TypingIndicator>
                  );
                })()}

                <div ref={messagesEndRef} />

                {/* Jump-to-latest pill — shown when user has scrolled up */}
                {!isNearBottom && messages.length > 2 && (
                  <JumpToLatestButton
                    onClick={() => { setIsNearBottom(true); scrollToBottom('smooth'); }}
                  >
                    ↓ Jump to latest
                  </JumpToLatestButton>
                )}
              </MessagesArea>

              <InputSection>
                <ComposerCard>
                  <div className="input-container">
                    <MessageInput
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={STAGE_PLACEHOLDERS[currentStage] || STAGE_PLACEHOLDERS.discovery}
                      disabled={isLoading}
                      rows="1"
                    />
                    <SendButton
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputValue.trim()}
                    >
                      <ArrowUp size={18} />
                    </SendButton>
                  </div>
                  <ComposerFooter>
                    <HelperPill>
                      <span>+</span>
                    </HelperPill>
                    <span>Press Enter to send</span>
                  </ComposerFooter>
                </ComposerCard>
              </InputSection>
              </ChatFrame>
            </ChatContainer>
          )}
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
};

export default ChatInterface;
