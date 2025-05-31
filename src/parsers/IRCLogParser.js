export class IRCLogParser {
  constructor(config = {}) {
    // Canonical section names that will be used in the output
    this.CANONICAL_SECTIONS = {
      MISSION_PREP: 'Missionsvorbereitung',
      CHECK_IN: 'Postencheck',
      RS_START: 'RS Start',
      RS_END: 'RS Ende',
      DEFAULT: 'Vorlauf'
    };

    // Default configuration that can be overridden
    this.config = {
      // Map custom keywords to canonical section names
      sectionKeywords: {
        [this.CANONICAL_SECTIONS.MISSION_PREP]: ['Missionsvorbereitung'],
        [this.CANONICAL_SECTIONS.CHECK_IN]: ['Postencheck'],
        [this.CANONICAL_SECTIONS.RS_START]: ['RS Start'],
        [this.CANONICAL_SECTIONS.RS_END]: ['RS Ende']
      },
      defaultSection: this.CANONICAL_SECTIONS.DEFAULT,
      // IRC client flavor (HexChat or mIRC)
      flavor: 'HexChat',
      // Message patterns
      patterns: {
        nickChange: '%oldnick% is now known as %newnick%',
      },
      ...config
    };

    // Create a lookup map for faster keyword matching
    this.keywordMap = new Map();
    Object.entries(this.config.sectionKeywords).forEach(([canonical, keywords]) => {
      keywords.forEach(keyword => {
        this.keywordMap.set(keyword.toLowerCase(), canonical);
      });
    });

    // Convert nick change pattern to regex
    this.nickChangeRegex = this.config.patterns.nickChange
      .replace('%oldnick%', '(\\S+)')
      .replace('%newnick%', '(\\S+)');
  }

  parseLog(rawLog) {
    // First parse all messages
    const lines = rawLog.trim().split('\n');
    const messages = lines.map(line => this.parseMessage(line)).filter(msg => msg !== null);

    // Then organize messages into sections
    const sections = [];
    let currentSection = {
      type: this.config.defaultSection,
      messages: []
    };

    messages.forEach(msg => {
      if (msg.content) {
        // Find the first matching keyword and get its canonical name
        const matchedKeyword = Array.from(this.keywordMap.entries()).find(([keyword]) => 
          msg.content.toLowerCase().includes(keyword)
        );
        
        const canonicalType = matchedKeyword ? matchedKeyword[1] : null;

        if (canonicalType === this.CANONICAL_SECTIONS.RS_END) {
          currentSection.messages.push(msg);
        }
        if (canonicalType) {
          // Start new section
          if (currentSection.messages.length > 0) {
            sections.push(currentSection);
          }
          currentSection = {
            type: canonicalType,
            messages: []
          };
        }
        if (canonicalType !== this.CANONICAL_SECTIONS.RS_END) {
          currentSection.messages.push(msg);
        }
      }
    });

    // Add the last section
    if (currentSection.messages.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  parseMessage(message) {
    return this.config.flavor === 'mIRC' 
      ? this.parseMIRCMessage(message)
      : this.parseHexChatMessage(message);
  }

  parseHexChatMessage(message) {
    // Match timestamp at the start
    const timestampMatch = message.match(/^[^*<]* /);
    if (!timestampMatch) return null;

    const timestamp = timestampMatch[1];
    const afterTimestamp = message.substring(timestampMatch[0].length).trim();

    // Match the three possible patterns for nick names
    let nick = null;
    let content = null;
    let type = null;

    // Pattern 1: <username>
    const angleMatch = afterTimestamp.match(/^<([^>]+)>\t(.*)$/);
    if (angleMatch) {
      nick = angleMatch[1];
      content = angleMatch[2];
      type = 'say';
    } else {
      // Pattern 2: * username
      const starUserMatch = afterTimestamp.match(/^\*([^\t]+)\t(.*)$/);
      if (starUserMatch) {
        nick = starUserMatch[1];
        content = starUserMatch[2];
        type = 'action';
      } else {
        // Pattern 3: just *
        const starMatch = afterTimestamp.match(/^\*\t(.*)$/);
        if (starMatch) {
          nick = '*';
          content = starMatch[1];
          type = 'control';
        }
      }
    }

    return {
      timestamp,
      nick,
      content,
      type,
      raw: message,
    };
  }

  parseMIRCMessage(message) {
    // TODO: Implement mIRC message parsing
    // mIRC typically uses different formatting:
    // [HH:mm] <nick> message
    // [HH:mm] * nick action
    // [HH:mm] * nick is now known as newNick
    const timestampMatch = message.match(/^\[[0-9:]+\] /);
    if (!timestampMatch) return null;

    const timestamp = timestampMatch[0];
    const afterTimestamp = message.substring(timestampMatch[0].length);

    let nick = null;
    let content = null;
    let type = null;

    // Pattern 1: Regular message
    const messageMatch = afterTimestamp.match(/^<([^>]+)> (.*)$/);
    if (messageMatch) {
      nick = messageMatch[1];
      content = messageMatch[2];
      type = 'say';
    } else {
      // Pattern 2: Action or control message
      const actionMatch = afterTimestamp.match(/^\* ([^ ]+) (.*)$/);
      if (actionMatch) {
        nick = actionMatch[1];
        content = actionMatch[2];
        type = nick === '*' ? 'control' : 'action';
      }
    }

    return {
      timestamp,
      nick,
      content,
      type,
      raw: message,
    };
  }

  detectPlayers(sections) {
    const playerMap = new Map();

    // First identify players from postencheck
    sections.forEach((section) => {
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
    sections.forEach((section) => {
      section.messages.forEach((msg) => {
        if (msg.nick === '*') {
          const nickChangeMatch = msg.content?.match(this.nickChangeRegex);
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

    return Array.from(playerMap.values());
  }
}
