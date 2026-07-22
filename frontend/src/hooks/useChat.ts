import { useState, useCallback } from 'react';
import { v4 } from '../utils/uuid';
import { sendMessage } from '../services/api';
import type { Message, Conversation } from '../types/chat';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const createConversation = useCallback((firstMessage?: string) => {
    const id = v4();
    const newConversation: Conversation = {
      id,
      title: firstMessage
        ? firstMessage.length > 40
          ? firstMessage.slice(0, 40) + '…'
          : firstMessage
        : 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(id);
    return id;
  }, []);

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, message], updatedAt: new Date() }
            : c
        )
      );
    },
    []
  );

  const sendChat = useCallback(
    async (question: string) => {
      let convId = activeConversationId;

      if (!convId) {
        convId = createConversation(question);
      }

      // Update title if it's the first message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId && c.messages.length === 0
            ? {
                ...c,
                title:
                  question.length > 40
                    ? question.slice(0, 40) + '…'
                    : question,
              }
            : c
        )
      );

      const userMessage: Message = {
        id: v4(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      addMessage(convId, userMessage);
      setIsLoading(true);

      try {
        const response = await sendMessage(question, activeConversation?.activeDocument);

        const assistantMessage: Message = {
          id: v4(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: new Date(),
        };

        addMessage(convId, assistantMessage);
      } catch (error) {
        const errorMessage: Message = {
          id: v4(),
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error while processing your request. Please make sure the backend server is running and try again.",
          timestamp: new Date(),
        };

        addMessage(convId, errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, activeConversation?.activeDocument, createConversation, addMessage]
  );

  /**
   * Voice-to-voice: sends a voice-transcribed question and marks the
   * assistant response for automatic TTS playback.
   */
  const sendVoiceChat = useCallback(
    async (transcript: string) => {
      let convId = activeConversationId;

      if (!convId) {
        convId = createConversation(transcript);
      }

      // Update title if it's the first message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId && c.messages.length === 0
            ? {
                ...c,
                title:
                  transcript.length > 40
                    ? transcript.slice(0, 40) + '…'
                    : transcript,
              }
            : c
        )
      );

      // Mark user message as a voice message
      const userMessage: Message = {
        id: v4(),
        role: 'user',
        content: transcript,
        timestamp: new Date(),
        isVoiceMessage: true,
      };

      addMessage(convId, userMessage);
      setIsLoading(true);

      try {
        const response = await sendMessage(transcript, activeConversation?.activeDocument);

        // Mark assistant response for auto-speak
        const assistantMessage: Message = {
          id: v4(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: new Date(),
          autoSpeak: true,
        };

        addMessage(convId, assistantMessage);
      } catch (error) {
        const errorMessage: Message = {
          id: v4(),
          role: 'assistant',
          content:
            "Désolé, une erreur s'est produite. Veuillez réessayer.",
          timestamp: new Date(),
        };

        addMessage(convId, errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, activeConversation?.activeDocument, createConversation, addMessage]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [activeConversationId]
  );

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);
  
  const setActiveDocument = useCallback((convId: string, documentName: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, activeDocument: documentName, updatedAt: new Date() }
          : c
      )
    );
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    sendChat,
    sendVoiceChat,
    setActiveConversationId,
    deleteConversation,
    startNewConversation,
    createConversation,
    setActiveDocument,
  };
}

