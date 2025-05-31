// stores/gameLogStore.js
import { defineStore } from 'pinia';
import { IRCLogParser } from '../parsers/IRCLogParser';

export const useGameLogStore = defineStore('gameLog', {
  state: () => ({
    rawLog: '',
    parsedSections: [],
    players: [], // Will now store objects with { name, nicks }
    currentFilter: null,
    parser: new IRCLogParser(), // Initialize the parser
  }),

  actions: {
    setLog(log) {
      this.rawLog = log;
      this.parseLog();
    },
    setFlavor(flavor) {
      this.parser.setFlavor(flavor);
    },
    parseLog() {
      this.parsedSections = this.parser.parseLog(this.rawLog);
      this.players = this.parser.detectPlayers(this.parsedSections);
    },
    setFilter(player) {
      this.currentFilter = player; // Now expects a player object
    },
  },
  getters: {
    histogramBinInfo: (state) => {
      const messageLengths = state.parsedSections
        .filter((section) => section.type === 'RS Start')
        .flatMap((section) => section.messages)
        .map((msg) => msg.content?.length || 0);

      if (messageLengths.length === 0) return 0;

      const maxLength = Math.max(...messageLengths);
      const binCount = 9; // Fixed number of bins
      return {
        binSize: maxLength / binCount,
        binCount: binCount,
      };
    },
    playerStats: (state) => {
      const stats = {};

      state.players.forEach((player) => {
        const messages = state.parsedSections
          .filter((section) => section.type === 'RS Start')
          .flatMap((section) => section.messages)
          .filter((msg) => player.nicks.has(msg.nick));

        // Calculate message lengths
        const messageLengths = messages.map(msg => msg.content?.length || 0);

        //const maxLength = Math.max(...messageLengths, 1); // ensure at least 1 to avoid division by zero
        //const binSize = maxLength / 5;
        const { binSize, binCount } = state.histogramBinInfo;
        
        // Create histogram with 5 bins
        const histogram = Array(binCount).fill(0).map((_, i) => ({
          minValue: Math.round(i * binSize),
          maxValue: Math.round((i + 1) * binSize),
          count: messageLengths.filter(len => 
            len > i * binSize && len <= (i + 1) * binSize
          ).length
        }));

        stats[player.name] = {
          name: player.name,
          nicks: player.nicks,
          messageCount: messages.length,
          avgMessageLength: Math.round(
            messageLengths.reduce((sum, len) => sum + len, 0) /
            (messages.length || 1)
          ),
          totalCharacters: messageLengths.reduce((sum, len) => sum + len, 0),
          messageHistogram: histogram
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
      return messages.filter((msg) => state.currentFilter.nicks.has(msg.nick));
    },
  },
});