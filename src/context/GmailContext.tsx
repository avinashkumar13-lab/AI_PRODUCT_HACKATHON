import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initGoogleAuth,
  googleSignIn,
  googleLogout,
  getGoogleAccessToken,
  getGoogleUser,
  isGoogleAuthenticated
} from '../services/googleAuth';
import {
  fetchGmailProfile,
  listGmailMessages,
  fetchGmailMessageDetail,
  sendGmailMessage,
  createGmailDraft,
  modifyGmailMessageLabels,
  trashGmailMessage
} from '../services/gmailApi';
import { GmailMessageSummary, GmailUserProfile, GmailSendPayload, GmailDraftPayload } from '../types';

export type GmailFolder = 'INBOX' | 'STARRED' | 'SENT' | 'DRAFTS' | 'TRASH';

interface ComposeState {
  isOpen: boolean;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  threadId?: string;
  mode: 'new' | 'reply' | 'forward';
}

interface GmailContextType {
  isGmailConnected: boolean;
  needsGoogleAuth: boolean;
  isConnecting: boolean;
  googleUser: User | null;
  gmailProfile: GmailUserProfile | null;
  messages: GmailMessageSummary[];
  selectedMessage: GmailMessageSummary | null;
  currentFolder: GmailFolder;
  searchQuery: string;
  isLoadingMessages: boolean;
  unreadCount: number;
  errorMessage: string | null;
  composeState: ComposeState;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => Promise<void>;
  refreshInbox: () => Promise<void>;
  selectMessage: (message: GmailMessageSummary | null) => void;
  setCurrentFolder: (folder: GmailFolder) => void;
  setSearchQuery: (query: string) => void;
  sendEmail: (payload: GmailSendPayload) => Promise<boolean>;
  saveDraft: (payload: GmailDraftPayload) => Promise<boolean>;
  toggleStar: (messageId: string) => Promise<void>;
  toggleReadStatus: (messageId: string) => Promise<void>;
  deleteEmail: (messageId: string) => Promise<boolean>;
  openCompose: (config?: Partial<ComposeState>) => void;
  closeCompose: () => void;
  clearError: () => void;
}

const GmailContext = createContext<GmailContextType | undefined>(undefined);

export const GmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGmailConnected, setIsGmailConnected] = useState<boolean>(false);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailUserProfile | null>(null);

  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [currentFolder, setCurrentFolder] = useState<GmailFolder>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [composeState, setComposeState] = useState<ComposeState>({
    isOpen: false,
    to: '',
    subject: '',
    body: '',
    mode: 'new'
  });

  // Calculate unread count
  const unreadCount = messages.filter((m) => m.isUnread).length;

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsGmailConnected(true);
        setNeedsGoogleAuth(false);
        loadUserProfile(token);
      },
      () => {
        setIsGmailConnected(false);
        setNeedsGoogleAuth(true);
        setGoogleUser(null);
        setGmailProfile(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (token: string) => {
    try {
      const profile = await fetchGmailProfile(token);
      setGmailProfile(profile);
    } catch (err: any) {
      console.warn('Could not fetch Gmail profile:', err);
    }
  };

  /**
   * Load messages from Gmail based on current folder and query
   */
  const loadMessages = useCallback(async () => {
    const token = await getGoogleAccessToken();
    if (!token) {
      setNeedsGoogleAuth(true);
      return;
    }

    setIsLoadingMessages(true);
    setErrorMessage(null);

    try {
      let labelIds: string[] | undefined = undefined;
      let q = searchQuery.trim();

      if (currentFolder === 'INBOX') {
        labelIds = ['INBOX'];
      } else if (currentFolder === 'STARRED') {
        labelIds = ['STARRED'];
      } else if (currentFolder === 'SENT') {
        labelIds = ['SENT'];
      } else if (currentFolder === 'DRAFTS') {
        labelIds = ['DRAFT'];
      } else if (currentFolder === 'TRASH') {
        labelIds = ['TRASH'];
      }

      const result = await listGmailMessages(token, {
        q: q || undefined,
        labelIds,
        maxResults: 25
      });

      setMessages(result.messages);

      // Preserve or update selected message
      if (selectedMessage) {
        const updated = result.messages.find((m) => m.id === selectedMessage.id);
        if (updated) {
          setSelectedMessage(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
      setErrorMessage(err.message || 'Failed to load emails from Gmail.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentFolder, searchQuery, selectedMessage]);

  // Refresh messages when folder, query, or connection changes
  useEffect(() => {
    if (isGmailConnected) {
      loadMessages();
    }
  }, [isGmailConnected, currentFolder, searchQuery]);

  /**
   * Trigger Google Sign In Popup
   */
  const connectGmail = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      setGoogleUser(res.user);
      setIsGmailConnected(true);
      setNeedsGoogleAuth(false);
      await loadUserProfile(res.accessToken);
    } catch (err: any) {
      console.error('Connect Gmail failed:', err);
      setErrorMessage(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect Gmail & Clear Token
   */
  const disconnectGmail = async () => {
    await googleLogout();
    setIsGmailConnected(false);
    setNeedsGoogleAuth(true);
    setGoogleUser(null);
    setGmailProfile(null);
    setMessages([]);
    setSelectedMessage(null);
  };

  /**
   * Refresh inbox explicitly
   */
  const refreshInbox = async () => {
    await loadMessages();
  };

  /**
   * Select a message to view
   */
  const selectMessage = (msg: GmailMessageSummary | null) => {
    setSelectedMessage(msg);
    if (msg && msg.isUnread) {
      // Mark as read in background
      toggleReadStatus(msg.id);
    }
  };

  /**
   * Toggle Starred state
   */
  const toggleStar = async (messageId: string) => {
    const token = await getGoogleAccessToken();
    if (!token) return;

    const target = messages.find((m) => m.id === messageId);
    if (!target) return;

    const newStarred = !target.isStarred;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isStarred: newStarred } : m
      )
    );
    if (selectedMessage?.id === messageId) {
      setSelectedMessage((prev) => (prev ? { ...prev, isStarred: newStarred } : null));
    }

    try {
      if (newStarred) {
        await modifyGmailMessageLabels(token, messageId, ['STARRED'], []);
      } else {
        await modifyGmailMessageLabels(token, messageId, [], ['STARRED']);
      }
    } catch (err: any) {
      console.error('Failed to toggle star:', err);
      // Revert optimistic update
      loadMessages();
    }
  };

  /**
   * Toggle Read / Unread state
   */
  const toggleReadStatus = async (messageId: string) => {
    const token = await getGoogleAccessToken();
    if (!token) return;

    const target = messages.find((m) => m.id === messageId);
    if (!target) return;

    const newUnread = !target.isUnread;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isUnread: newUnread } : m
      )
    );
    if (selectedMessage?.id === messageId) {
      setSelectedMessage((prev) => (prev ? { ...prev, isUnread: newUnread } : null));
    }

    try {
      if (newUnread) {
        await modifyGmailMessageLabels(token, messageId, ['UNREAD'], []);
      } else {
        await modifyGmailMessageLabels(token, messageId, [], ['UNREAD']);
      }
    } catch (err: any) {
      console.error('Failed to toggle read status:', err);
      loadMessages();
    }
  };

  /**
   * Trash an email (Requires prior confirmation dialog in UI)
   */
  const deleteEmail = async (messageId: string): Promise<boolean> => {
    const token = await getGoogleAccessToken();
    if (!token) return false;

    try {
      await trashGmailMessage(token, messageId);

      // Remove from active list
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      return true;
    } catch (err: any) {
      console.error('Failed to trash email:', err);
      setErrorMessage(err.message || 'Failed to move email to trash.');
      return false;
    }
  };

  /**
   * Send Email (Constructs RFC 2822 payload and sends)
   */
  const sendEmail = async (payload: GmailSendPayload): Promise<boolean> => {
    const token = await getGoogleAccessToken();
    if (!token) {
      setErrorMessage('Google access token is missing. Please sign in again.');
      return false;
    }

    try {
      await sendGmailMessage(token, payload);
      closeCompose();
      await refreshInbox();
      return true;
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setErrorMessage(err.message || 'Failed to send email through Gmail.');
      return false;
    }
  };

  /**
   * Save Draft in Gmail
   */
  const saveDraft = async (payload: GmailDraftPayload): Promise<boolean> => {
    const token = await getGoogleAccessToken();
    if (!token) return false;

    try {
      await createGmailDraft(token, payload);
      closeCompose();
      return true;
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setErrorMessage(err.message || 'Failed to save draft.');
      return false;
    }
  };

  const openCompose = (config?: Partial<ComposeState>) => {
    setComposeState({
      isOpen: true,
      to: config?.to || '',
      subject: config?.subject || '',
      body: config?.body || '',
      inReplyTo: config?.inReplyTo,
      threadId: config?.threadId,
      mode: config?.mode || 'new'
    });
  };

  const closeCompose = () => {
    setComposeState((prev) => ({ ...prev, isOpen: false }));
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  return (
    <GmailContext.Provider
      value={{
        isGmailConnected,
        needsGoogleAuth,
        isConnecting,
        googleUser,
        gmailProfile,
        messages,
        selectedMessage,
        currentFolder,
        searchQuery,
        isLoadingMessages,
        unreadCount,
        errorMessage,
        composeState,
        connectGmail,
        disconnectGmail,
        refreshInbox,
        selectMessage,
        setCurrentFolder,
        setSearchQuery,
        sendEmail,
        saveDraft,
        toggleStar,
        toggleReadStatus,
        deleteEmail,
        openCompose,
        closeCompose,
        clearError
      }}
    >
      {children}
    </GmailContext.Provider>
  );
};

export const useGmail = () => {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error('useGmail must be used within a GmailProvider');
  }
  return context;
};
