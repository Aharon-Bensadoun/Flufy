# Ollama Chat

A beautiful chat interface for interacting with Ollama's API. Built with React, TypeScript, and Material-UI.

## Features

- Modern, responsive design
- Dark/Light mode support
- Real-time chat interface
- Support for multiline messages
- Loading indicators
- Error handling
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ollama running locally (default port: 11434)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Make sure Ollama is running locally
2. Type your message in the input field
3. Press Enter or click the send button to send your message
4. The AI will respond in the chat window
5. Toggle between dark and light mode using the theme button in the top right

## Configuration

The application is configured to use the `llama2` model by default. You can change this by modifying the `model` parameter in the `handleSend` function in `src/App.tsx`.

## Development

- Built with React 18
- TypeScript for type safety
- Material-UI for components
- Emotion for styling

## License

MIT 