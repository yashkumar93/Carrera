'use client';

import { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import apiService from '../lib/api';
import { signInWithGoogle, signOutUser, onAuthChange, createSession, addMessageToSession, getUserSessions, getSession } from '../lib/firebase';
import ClaudeChatInput from './ui/claude-chat-input';
import { Menu, PanelLeftClose, Plus, MoreHorizontal, Pencil, Trash2, ArrowUp, LogOut, User } from 'lucide-react';

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
  background: '#ffffff',
  secondaryBackground: '#f9f9f9',
  cardBackground: '#ffffff',
  userMessageBackground: '#f4f4f4',
  botMessageBackground: 'transparent',
  text: '#2f2f2f',
  secondaryText: '#6b6b6b',
  border: '#e5e5e5',
  userMessageText: '#2f2f2f',
  botMessageText: '#2f2f2f',
  buttonBackground: '#2f2f2f',
  buttonHover: '#1a1a1a',
  inputBackground: '#ffffff',
  inputBorder: '#d1d1d1',
  headerBackground: '#ffffff',
  scrollTrack: '#f4f4f4',
  scrollThumb: '#d1d1d1',
  scrollThumbHover: '#b0b0b0',
  shadowLight: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMedium: '0 2px 4px rgba(0, 0, 0, 0.08)',
};

const darkTheme = {
  background: '#212121',
  secondaryBackground: '#2a2a2a',
  cardBackground: '#212121',
  userMessageBackground: '#2f2f2f',
  botMessageBackground: 'transparent',
  text: '#ececec',
  secondaryText: '#9b9b9b',
  border: '#3f3f3f',
  userMessageText: '#ececec',
  botMessageText: '#ececec',
  buttonBackground: '#ececec',
  buttonHover: '#ffffff',
  inputBackground: '#2a2a2a',
  inputBorder: '#3f3f3f',
  headerBackground: '#212121',
  scrollTrack: '#2a2a2a',
  scrollThumb: '#3f3f3f',
  scrollThumbHover: '#4f4f4f',
  shadowLight: '0 1px 2px rgba(0, 0, 0, 0.3)',
  shadowMedium: '0 2px 4px rgba(0, 0, 0, 0.4)',
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

const RecentsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: ${props => props.$isExpanded ? 'block' : 'none'};
`;

const RecentsLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.secondaryText};
  padding: 0.5rem 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SessionItemContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 0.125rem;
  
  &:hover .menu-trigger {
    opacity: 1;
  }
`;

const SessionItem = styled.button`
  flex: 1;
  padding: 0.5rem 0.75rem;
  padding-right: 1.75rem;
  background: ${props => props.$isActive ? props.theme.border : 'transparent'};
  border: none;
  border-radius: 6px;
  color: ${props => props.theme.text};
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    background: ${props => props.theme.border};
  }
`;

const MenuTrigger = styled.button`
  opacity: 0;
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: ${props => props.theme.secondaryText};
  cursor: pointer;
  padding: 0.25rem 0.35rem;
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  letter-spacing: 1px;
  
  &:hover {
    background: ${props => props.theme.border};
    color: ${props => props.theme.text};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 1000;
  min-width: 150px;
  background: ${props => props.theme.sidebar};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 0.25rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: menuFadeIn 0.12s ease-out;
  
  @keyframes menuFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${props => props.$danger ? '#ef4444' : props.theme.text};
  font-size: 0.813rem;
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:hover {
    background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.1)' : props.theme.border};
  }
  
  .menu-icon {
    font-size: 0.875rem;
    width: 1.25rem;
    text-align: center;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modalOverlayIn 0.15s ease-out;
  
  @keyframes modalOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalCard = styled.div`
  background: #2f2f2f;
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  animation: modalCardIn 0.2s ease-out;
  
  @keyframes modalCardIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  h3 {
    color: #ececec;
    font-size: 1.125rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #9b9b9b;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const ModalBtn = styled.button`
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  
  ${props => props.$variant === 'cancel' ? `
    background: #3f3f3f;
    color: #ececec;
    &:hover { background: #4f4f4f; }
  ` : `
    background: #ef4444;
    color: #ffffff;
    &:hover { background: #dc2626; }
  `}
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
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Header = styled.header`
  background: ${props => props.theme.headerBackground};
  color: ${props => props.theme.text};
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.text};
`;

const ThemeToggle = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;

  &:hover {
    background: ${props => props.theme.secondaryBackground};
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProfileContainer = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${props => props.theme.border};
  background: ${props => props.theme.cardBackground};
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: ${props => props.theme.buttonBackground};
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .default-icon {
    font-size: 1.25rem;
  }
`;

const ProfileDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadowMedium};
  min-width: 220px;
  z-index: 100;
  overflow: hidden;
  animation: dropdownFade 0.2s ease;
  
  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .user-info {
    padding: 1rem;
    border-bottom: 1px solid ${props => props.theme.border};
    
    .user-name {
      font-weight: 600;
      color: ${props => props.theme.text};
      margin-bottom: 0.25rem;
    }
    
    .user-email {
      font-size: 0.875rem;
      color: ${props => props.theme.secondaryText};
    }
  }
  
  .dropdown-actions {
    padding: 0.5rem;
  }
`;

const DropdownButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.secondaryBackground};
  }
  
  &.sign-out {
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
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
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
  position: relative;
`;

const StageIndicator = styled.div`
  background: ${props => props.theme.secondaryBackground};
  color: ${props => props.theme.secondaryText};
  padding: 0.75rem 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 1px solid ${props => props.theme.border};
  letter-spacing: 0.025em;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  scroll-behavior: smooth;
`;

const MessageBubble = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  
  .message-content {
    background: ${props => props.$isUser ? props.theme.userMessageBackground : props.theme.botMessageBackground};
    color: ${props => props.$isUser ? props.theme.userMessageText : props.theme.botMessageText};
    padding: ${props => props.$isUser ? '0.875rem 1rem' : '0'};
    border-radius: ${props => props.$isUser ? '1.125rem' : '0'};
    max-width: ${props => props.$isUser ? '85%' : '100%'};
    font-size: 1rem;
    line-height: 1.6;
    
    h1, h2, h3, h4, h5, h6 {
      margin: 0 0 0.875rem 0;
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1.125rem; }
    
    p {
      margin: 0 0 0.875rem 0;
      line-height: 1.6;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    ul, ol {
      margin: 0 0 0.875rem 0;
      padding-left: 1.5rem;
      
      li {
        margin-bottom: 0.375rem;
        line-height: 1.6;
      }
    }
    
    code {
      background: ${props => props.theme.secondaryBackground};
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: ${props => props.theme.secondaryBackground};
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0.875rem 0;
      
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
    font-size: 0.75rem;
    color: ${props => props.theme.secondaryText};
    margin-top: 0.375rem;
    padding: ${props => props.$isUser ? '0 1rem' : '0'};
  }
`;

const TypingIndicator = styled.div`
  max-width: 75%;
  align-self: flex-start;
  
  .typing-content {
    background: ${props => props.theme.botMessageBackground};
    color: ${props => props.theme.botMessageText};
    padding: 1rem 1.25rem;
    border-radius: 1.25rem 1.25rem 1.25rem 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: ${props => props.theme.shadowMedium};
    
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

const SuggestionsContainer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.secondaryBackground};
  
  .suggestions-label {
    font-size: 0.875rem;
    color: ${props => props.theme.secondaryText};
    margin-bottom: 0.75rem;
    font-weight: 500;
  }
  
  .suggestions-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const SuggestionChip = styled.button`
  background: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.theme.buttonBackground};
    color: ${props => props.theme.userMessageText};
    border-color: ${props => props.theme.buttonBackground};
    transform: translateY(-1px);
  }
`;

const InputSection = styled.div`
  padding: 1.25rem 1.5rem;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  
  .input-container {
    max-width: 768px;
    margin: 0 auto;
    display: flex;
    gap: 0.625rem;
    align-items: flex-end;
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.inputBorder};
  color: ${props => props.theme.text};
  padding: 0.875rem 1rem;
  border-radius: 1.5rem;
  resize: none;
  min-height: 52px;
  max-height: 200px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.border};
  }
  
  &::placeholder {
    color: ${props => props.theme.secondaryText};
  }
`;

const SendButton = styled.button`
  background: ${props => props.theme.buttonBackground};
  color: ${props => props.theme.background};
  border: none;
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.buttonHover};
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ChatInterface = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [currentStage, setCurrentStage] = useState('discovery');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // New chat view state
  const [showNewChatView, setShowNewChatView] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const profileDropdownRef = useRef(null);

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

    setSuggestions([
      "I want to transition to a new career",
      "Help me advance in my current role",
      "I'm a recent graduate seeking direction",
      "I'm re-entering the workforce"
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });

        // Fetch user's sessions from Firestore
        try {
          const userSessions = await getUserSessions(firebaseUser.uid);
          setSessions(userSessions);
        } catch (error) {
          console.error('Error fetching sessions:', error);
        }
      } else {
        setUser(null);
        setSessions([]);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setSuggestions([]);

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
      // Save user message to Firestore
      if (user && currentSessionId) {
        await addMessageToSession(currentSessionId, { content: message, isUser: true });
      }

      let fullResponse = '';

      await apiService.streamMessage(
        message,
        sessionId,
        currentStage,
        (token) => {
          fullResponse += token;
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId ? { ...msg, content: fullResponse } : msg
          ));
        },
        async (data) => { // onComplete
          const { session_id, stage, suggestions } = data;
          setSessionId(session_id);
          setCurrentStage(stage);
          setSuggestions(suggestions || []);

          // Save AI message to Firestore
          if (user && currentSessionId) {
            await addMessageToSession(currentSessionId, { content: fullResponse, isUser: false });
          }
        },
        (error) => { // onError
          throw error; // Re-throw to be caught by catch block
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
  const handleSessionClick = async (session) => {
    setShowNewChatView(false);
    setCurrentSessionId(session.id);
    setMobileSidebarOpen(false);

    // Load messages from the session
    if (session.messages && session.messages.length > 0) {
      const loadedMessages = session.messages.map((msg, index) => ({
        id: Date.now() + index,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp).getTime()
      }));
      setMessages(loadedMessages);
    }
  };

  const handleKeyPress = (e) => {
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

  const handleNewChat = () => {
    setShowNewChatView(true);
    setMessages([]);
    setSessionId(null);
    setCurrentSessionId(null);
    setCurrentStage('discovery');
    setSuggestions([]);
  };

  // Handler for when user sends message from Claude input
  const handleClaudeInputSend = async ({ message, files, pastedContent }) => {
    setShowNewChatView(false);

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      content: message,
      isUser: true,
      timestamp: Date.now()
    };
    setMessages([userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create a new session in Firestore if user is logged in
      let firestoreSessionId = currentSessionId;
      if (user && !currentSessionId) {
        firestoreSessionId = await createSession(user.uid, message);
        setCurrentSessionId(firestoreSessionId);

        // Refresh sessions list
        const userSessions = await getUserSessions(user.uid);
        setSessions(userSessions);
      }

      const response = await apiService.sendMessage(message, sessionId, currentStage);

      if (response.session_id) {
        setSessionId(response.session_id);
      }
      if (response.stage) {
        setCurrentStage(response.stage);
      }

      const aiMessage = {
        id: Date.now() + 1,
        content: response.response || response.message || "I'm here to help with your career journey!",
        isUser: false,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to Firestore
      if (user && firestoreSessionId) {
        await addMessageToSession(firestoreSessionId, { content: aiMessage.content, isUser: false });
      }

      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: "I apologize, but I encountered an error. Please try again.",
        isUser: false,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setDeleteConfirmId(sessionId);
  };

  const confirmDelete = async () => {
    const sessionId = deleteConfirmId;
    setDeleteConfirmId(null);
    if (!sessionId) return;

    try {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (sessionId === currentSessionId) {
        handleNewChat();
      }
      await apiService.deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleRenameSession = async (e, sessionId) => {
    e.stopPropagation();
    setActiveMenuId(null);
    const session = sessions.find(s => s.id === sessionId);
    const newTitle = prompt('Rename chat:', session?.title || 'Untitled Session');
    if (!newTitle || newTitle.trim() === '') return;

    try {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle.trim() } : s));
      await apiService.client.patch(`/api/session/${sessionId}`, { title: newTitle.trim() });
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  const toggleSessionMenu = (e, sessionId) => {
    e.stopPropagation();
    setActiveMenuId(prev => prev === sessionId ? null : sessionId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId]);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        {/* Mobile Overlay */}
        <SidebarOverlay $isOpen={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(false)} />

        {/* Sidebar */}
        <Sidebar $isExpanded={sidebarExpanded}>
          {/* Header with toggle */}
          <SidebarHeader $isExpanded={sidebarExpanded}>
            <SidebarToggleBtn onClick={toggleSidebar} title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}>
              {sidebarExpanded ? <PanelLeftClose size={18} /> : <Menu size={18} />}
            </SidebarToggleBtn>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarNav>
            <NewChatBtn $isExpanded={sidebarExpanded} onClick={handleNewChat} title="New chat">
              <span className="nav-icon"><Plus size={16} /></span>
              <span className="nav-label">New chat</span>
            </NewChatBtn>


          </SidebarNav>

          {/* Recents */}
          <RecentsSection $isExpanded={sidebarExpanded}>
            <RecentsLabel>Recents</RecentsLabel>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <SessionItemContainer key={session.id}>
                  <SessionItem
                    $isActive={session.id === currentSessionId}
                    onClick={() => handleSessionClick(session)}
                    title={session.title || 'Untitled Session'}
                  >
                    {session.title || 'Untitled Session'}
                  </SessionItem>
                  <MenuTrigger
                    className="menu-trigger"
                    onClick={(e) => toggleSessionMenu(e, session.id)}
                    title="More options"
                    style={activeMenuId === session.id ? { opacity: 1 } : {}}
                  >
                    <MoreHorizontal size={15} />
                  </MenuTrigger>
                  {activeMenuId === session.id && (
                    <DropdownMenu onClick={(e) => e.stopPropagation()}>
                      <DropdownItem onClick={(e) => handleRenameSession(e, session.id)}>
                        <span className="menu-icon"><Pencil size={14} /></span>
                        Rename
                      </DropdownItem>
                      <DropdownItem $danger onClick={(e) => handleDeleteSession(e, session.id)}>
                        <span className="menu-icon"><Trash2 size={14} /></span>
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  )}
                </SessionItemContainer>
              ))
            ) : (
              <div style={{
                padding: '0.5rem 0.75rem',
                color: theme.secondaryText,
                fontSize: '0.813rem'
              }}>
                No recent chats
              </div>
            )}
          </RecentsSection>

          {/* Profile Footer */}
          <SidebarFooter>
            {user ? (
              <div style={{ position: 'relative' }} ref={profileDropdownRef}>
                <ProfileSection $isExpanded={sidebarExpanded} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                  <div className="profile-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Profile'} />
                    ) : (
                      <span>{user.displayName?.charAt(0) || <User size={16} />}</span>
                    )}
                  </div>
                  {sidebarExpanded && (
                    <div className="profile-info">
                      <div className="profile-name">{user.displayName || 'User'}</div>
                    </div>
                  )}
                </ProfileSection>

                {/* Profile Dropdown with Logout */}
                {showProfileDropdown && sidebarExpanded && (
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
              sidebarExpanded ? (
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
          <Header>
            <Title>AI Career Counselor</Title>
            <HeaderRight>
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
              <MessagesArea>
                {messages.map((message) => (
                  <MessageBubble key={message.id} $isUser={message.isUser}>
                    <div className="message-content">
                      {message.isUser ? (
                        message.content
                      ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                    <div className="timestamp">
                      {formatTime(message.timestamp)}
                    </div>
                  </MessageBubble>
                ))}

                {isLoading && (
                  <TypingIndicator>
                    <div className="typing-content">
                      <span>Thinking</span>
                      <div className="dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </div>
                  </TypingIndicator>
                )}

                <div ref={messagesEndRef} />
              </MessagesArea>

              {suggestions.length > 0 && !isLoading && (
                <SuggestionsContainer>
                  <div className="suggestions-label">Quick suggestions</div>
                  <div className="suggestions-grid">
                    {suggestions.map((suggestion, index) => (
                      <SuggestionChip
                        key={index}
                        onClick={() => handleSendMessage(suggestion)}
                      >
                        {suggestion}
                      </SuggestionChip>
                    ))}
                  </div>
                </SuggestionsContainer>
              )}

              <InputSection>
                <div className="input-container">
                  <MessageInput
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                    disabled={isLoading}
                    rows="1"
                  />
                  <SendButton
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputValue.trim()}
                  >
                    <ArrowUp size={16} />
                  </SendButton>
                </div>
              </InputSection>
            </ChatContainer>
          )}
        </MainContent>
      </AppContainer>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ModalOverlay onClick={() => setDeleteConfirmId(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <h3>Delete chat</h3>
            <p>Are you sure you want to delete this chat?</p>
            <ModalActions>
              <ModalBtn $variant="cancel" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </ModalBtn>
              <ModalBtn $variant="delete" onClick={confirmDelete}>
                Delete
              </ModalBtn>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </ThemeProvider>
  );
};

export default ChatInterface;
