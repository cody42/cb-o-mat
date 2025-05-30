// stores/gameLogStore.js
import { defineStore } from 'pinia';

export const useGameLogStore = defineStore('gameLog', {
  state: () => ({
    rawLog: '',
    parsedSections: [],
    players: [], // Will now store objects with { name, nicks }
    currentFilter: null,
  }),

  actions: {
    setLog(log) {
      this.rawLog = log;
      this.parseLog();
    },
    parseLog() {
      // First parse all messages
      const lines = this.rawLog.trim().split('\n');
      const messages = lines.map(line => this.parseMessage(line)).filter(msg => msg !== null);

      // Then organize messages into sections
      const sections = [];
      let currentSection = {
        type: 'Vorlauf', // Default section type
        messages: []
      };

      messages.forEach(msg => {
        if (msg.content) {
          const sectionKeywords = ['Missionsvorbereitung', 'Postencheck', 'RS Start', 'RS Ende'];
          const matchedKeyword = sectionKeywords.find(keyword => 
            msg.content.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matchedKeyword === 'RS Ende') {
            currentSection.messages.push(msg);
          }
          if (matchedKeyword) {
            // Start new section
            if (currentSection.messages.length > 0) {
              sections.push(currentSection);
            }
            currentSection = {
              type: matchedKeyword,
              messages: []
            };
          }
          if (matchedKeyword !== 'RS Ende') {
            currentSection.messages.push(msg);
          }
        }
      });

      // Add the last section
      if (currentSection.messages.length > 0) {
        sections.push(currentSection);
      }

      this.parsedSections = sections;
      this.detectPlayers();
    },
    parseMessage(message) {
      // Match timestamp at the start
      const timestampMatch = message.match(/^[^*<]* /);
      if (!timestampMatch) return null;

      const timestamp = timestampMatch[1];
      const afterTimestamp = message.substring(timestampMatch[0].length).trim();

      // Match the three possible patterns for nick names
      let nick = null;
      let content = null;

      // Pattern 1: <username>
      const angleMatch = afterTimestamp.match(/^<([^>]+)>\t(.*)$/);
      if (angleMatch) {
        nick = angleMatch[1];
        content = angleMatch[2];
      } else {
        // Pattern 2: * username
        const starUserMatch = afterTimestamp.match(/^\*([^\t]+)\t(.*)$/);
        if (starUserMatch) {
          nick = starUserMatch[1];
          content = starUserMatch[2];
        } else {
          // Pattern 3: just *
          const starMatch = afterTimestamp.match(/^\*\t(.*)$/);
          if (starMatch) {
            nick = '*';
            content = starMatch[1];
          }
        }
      }

      return {
        timestamp,
        nick,
        content,
        raw: message,
      };
    },
    detectPlayers() {
      const playerMap = new Map();

      // First identify players from postencheck
      this.parsedSections.forEach((section) => {
        if (section.type === 'Postencheck') {
          section.messages.forEach((msg) => {
            if (msg.nick) {
              playerMap.set(msg.nick, {
                name: msg.nick,
                nicks: new Set([msg.nick])
              });
            }
          });
        }
      });

      // Then scan for nickname changes in * messages
      this.parsedSections.forEach((section) => {
        section.messages.forEach((msg) => {
          if (msg.nick === '*') {
            const nickChangeMatch = msg.content?.match(/^(\S+) is now known as (\S+)$/);
            if (nickChangeMatch) {
              const [, oldNick, newNick] = nickChangeMatch;
              
              // Find if either nick belongs to a known player
              let player = null;
              for (const [, p] of playerMap) {
                if (p.nicks.has(oldNick) || p.nicks.has(newNick)) {
                  player = p;
                  break;
                }
              }

              // If found, add both nicks to that player
              if (player) {
                player.nicks.add(oldNick);
                player.nicks.add(newNick);
              }
            }
          }
        });
      });

      this.players = Array.from(playerMap.values());
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