import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  CircularProgress,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import config from './config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

interface StreamResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

const CodeBlock = ({ language, code }: { language: string; code: string }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        my: 2,
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Tooltip title={copied ? "Copied!" : "Copy code"}>
        <IconButton
          onClick={handleCopy}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 1,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            '&:hover': {
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
            },
          }}
        >
          {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <SyntaxHighlighter
        language={language || 'plaintext'}
        style={isDark ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          padding: theme.spacing(2),
          fontSize: '0.875rem',
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </Box>
  );
};

const MessageContent = ({ content }: { content: string }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Split content into text and code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <Box>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          if (match) {
            const [, language, code] = match;
            return (
              <CodeBlock
                key={index}
                language={language}
                code={code}
              />
            );
          }
        }
        return (
          <Typography
            key={index}
            sx={{
              whiteSpace: 'pre-wrap',
              '& p': { mb: 1 },
              '& p:last-child': { mb: 0 },
            }}
          >
            {part}
          </Typography>
        );
      })}
    </Box>
  );
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(config.ui.defaultModel);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem(config.storage.chatsKey);
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
      }));
      setChats(parsedChats);
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(config.storage.chatsKey, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.models}`);
        const data = await response.json();
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: newChatTitle || 'New Chat',
      messages: [],
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    setNewChatTitle('');
    setIsNewChatDialogOpen(false);
  };

  const loadChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setSelectedModel(chat.model);
      setCurrentChatId(chatId);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const updateCurrentChat = (newMessages: Message[]) => {
    if (currentChatId) {
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: newMessages,
            updatedAt: new Date(),
            title: newMessages[0]?.content.slice(0, config.ui.chatTitleMaxLength) + '...' || chat.title,
          };
        }
        return chat;
      }));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
    };
    const messagesWithAssistant = [...newMessages, assistantMessage];
    setMessages(messagesWithAssistant);

    try {
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.chat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const data: StreamResponse = JSON.parse(line);
            if (data.message?.content) {
              accumulatedContent += data.message.content;
              const updatedMessages = messagesWithAssistant.map((msg, idx) => {
                if (idx === messagesWithAssistant.length - 1) {
                  return { ...msg, content: accumulatedContent };
                }
                return msg;
              });
              setMessages(updatedMessages);
              updateCurrentChat(updatedMessages);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
      };
      const messagesWithError = [...messagesWithAssistant.slice(0, -1), errorMessage];
      setMessages(messagesWithError);
      updateCurrentChat(messagesWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Drawer
          variant="persistent"
          anchor="left"
          open={isSidebarOpen}
          sx={{
            width: 300,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 300,
              boxSizing: 'border-box',
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Chat History</Typography>
            <IconButton onClick={() => setIsNewChatDialogOpen(true)}>
              <AddIcon />
            </IconButton>
          </Box>
          <Divider />
          <List sx={{ overflow: 'auto' }}>
            {chats.map((chat) => (
              <ListItem
                key={chat.id}
                disablePadding
                secondaryAction={
                  <IconButton edge="end" onClick={() => deleteChat(chat.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={currentChatId === chat.id}
                  onClick={() => loadChat(chat.id)}
                >
                  <ListItemText
                    primary={chat.title}
                    secondary={new Date(chat.updatedAt).toLocaleString()}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Ollama Chat
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
              >
                {models.map((model) => (
                  <MenuItem key={model.name} value={model.name}>
                    {model.name} ({model.details.parameter_size})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>

          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1,
              mx: 2,
              mb: 2,
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '85%',
                      backgroundColor: message.role === 'user' 
                        ? 'primary.main' 
                        : 'secondary.main',
                      color: 'white',
                      borderRadius: 2,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        [message.role === 'user' ? 'right' : 'left']: -8,
                        transform: 'translateY(-50%)',
                        border: '8px solid transparent',
                        borderRightColor: message.role === 'user' ? 'primary.main' : 'transparent',
                        borderLeftColor: message.role === 'user' ? 'transparent' : 'secondary.main',
                      },
                    }}
                  >
                    <MessageContent content={message.content} />
                  </Paper>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <CircularProgress size={20} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading || !selectedModel}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !selectedModel}
                  sx={{ 
                    minWidth: '100px',
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  <SendIcon />
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog open={isNewChatDialogOpen} onClose={() => setIsNewChatDialogOpen(false)}>
        <DialogTitle>New Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chat Title"
            fullWidth
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewChatDialogOpen(false)}>Cancel</Button>
          <Button onClick={createNewChat} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App; 