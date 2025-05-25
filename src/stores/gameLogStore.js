// stores/gameLogStore.js
import { defineStore } from 'pinia';

export const useGameLogStore = defineStore('gameLog', {
  state: () => ({
    rawLog: '',
    parsedSections: [],
    players: [],
    currentFilter: null,
  }),

  actions: {
    setLog(log) {
      this.rawLog = log;
      this.parseLog();
    },
    parseLog() {
      // Split log into sections
      const sections = this.rawLog.split(/(?=\[(?:Intro|Check-in|Start|Action|End)\])/g);

      this.parsedSections = sections.map((section) => {
        const [header, ...messages] = section.trim().split('\n');
        const sectionType = header.match(/\[(.*?)\]/)?.[1] || 'Unknown';

        return {
          type: sectionType,
          messages: messages.map((msg) => this.parseMessage(msg)),
        };
      });

      this.detectPlayers();
    },
    parseMessage(message) {
      const timestamp = message.match(/\[(.*?)\]/)?.[1];
      const player = message.match(/\]\s*(.*?):/)?.[1];
      const content = message.split(':')?.[1]?.trim();

      return {
        timestamp,
        player,
        content,
        raw: message,
      };
    },
    detectPlayers() {
      const playerSet = new Set();

      this.parsedSections.forEach((section) => {
        if (section.type === 'Check-in') {
          section.messages.forEach((msg) => {
            if (msg.player) playerSet.add(msg.player);
          });
        }
      });

      this.players = Array.from(playerSet);
    },
    setFilter(player) {
      this.currentFilter = player;
    },
  },
  getters: {
    playerStats: (state) => {
      const stats = {};

      state.players.forEach((player) => {
        const messages = state.parsedSections
          .flatMap((section) => section.messages)
          .filter((msg) => msg.player === player);

        stats[player] = {
          name: player,
          messageCount: messages.length,
          avgMessageLength: Math.round(
            messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) /
              (messages.length || 1)
          ),
        };
      });

      return Object.values(stats);
    },
    filteredMessages: (state) => {
      const messages = state.parsedSections.flatMap((section) =>
        section.messages.map((msg) => ({
          ...msg,
          section: section.type,
        }))
      );

      if (!state.currentFilter) return messages;
      return messages.filter((msg) => msg.player === state.currentFilter);
    },
  },
});