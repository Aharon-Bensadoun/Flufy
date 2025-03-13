interface Config {
  api: {
    baseUrl: string;
    endpoints: {
      chat: string;
      models: string;
    };
  };
  storage: {
    chatsKey: string;
  };
  ui: {
    defaultModel: string;
    maxMessageLength: number;
    chatTitleMaxLength: number;
  };
}

const config: Config = {
  api: {
    baseUrl: 'https://yourapiurl',
    endpoints: {
      chat: '/api/chat',
      models: '/api/tags',
    },
  },
  storage: {
    chatsKey: 'chats',
  },
  ui: {
    defaultModel: 'llama2',
    maxMessageLength: 4000,
    chatTitleMaxLength: 30,
  },
};

export default config; 
