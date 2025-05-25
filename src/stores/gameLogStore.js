// stores/gameLogStore.js
import { defineStore } from 'pinia';

export const useGameLogStore = defineStore('gameLog', {
  state: () => ({
    rawLog: '',
    parsedLog: [],
    players: [],
    stats: [],
  }),
  actions: {
    processLog(log) {
      this.rawLog = log;
      this.parseSections();
      this.extractPlayers();
      this.calculateStats();
    },
    parseSections() {
      this.parsedLog = this.rawLog.split('\n').map((line) => ({
        text: line,
        section: this.detectSection(line),
      }));
    },
    detectSection(line) {
      if (line.includes('Missionsvorbereitung')) return 'Intro';
      if (line.includes('Postencheck')) return 'Check-in';
      if (line.includes('RS Start')) return 'Start';
      if (line.includes('RS Ende')) return 'End';
      return 'Action';
    },
    extractPlayers() {
      const players = {};
      this.parsedLog.forEach(({ text }) => {
        if (text.includes('Postencheck')) {
          const nick = text.split(':')[0].trim();
          if (!players[nick]) players[nick] = { name: nick, nicks: [nick] };
        }
      });
      this.players = Object.values(players);
    },
    calculateStats() {
      this.stats = this.players.map((player) => {
        const posts = this.parsedLog.filter(({ text }) =>
          player.nicks.some((nick) => text.startsWith(nick))
        );
        return {
          player: player.name,
          count: posts.length,
          histogram: posts.map((post) => post.text.length),
        };
      });
    },
    getFilteredLog(playerName) {
      return this.parsedLog
        .filter(({ text }) =>
          this.players.find((p) => p.name === playerName)?.nicks.some((nick) => text.startsWith(nick))
        )
        .map(({ text }) => text)
        .join('\n');
    },
  },
});