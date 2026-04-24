import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Message } from '../models/event.model';

import { environment } from '../../environments/environment';

const SOCKET_URL = environment.socketUrl;

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;
  private readonly _messages = signal<Message[]>([]);
  
  readonly messages = this._messages.asReadonly();

  constructor() {}

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('new_message', (message: Message) => {
      this._messages.update(messages => [...messages, message]);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._messages.set([]);
    }
  }

  joinRoom(eventId: string): void {
    if (this.socket) {
      this.socket.emit('join_event', eventId);
    }
  }

  leaveRoom(eventId: string): void {
    if (this.socket) {
      this.socket.emit('leave_event', eventId);
    }
  }

  sendMessage(eventId: string, content: string): void {
    if (this.socket) {
      this.socket.emit('send_message', { eventId, content });
    }
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.off('new_message', callback);
    }
  }

  setInitialMessages(messages: Message[]): void {
    this._messages.set(messages);
  }

  addMessage(message: Message): void {
    this._messages.update(messages => [...messages, message]);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
