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
    this.nickChangeRegex = '(?:\\x03\\d{2})?' + this.config.patterns.nickChange
      .replace('%oldnick%', '(\\S+)')
      .replace('%newnick%', '(\\S+)');
  }

  setFlavor(flavor) {
    if (['HexChat', 'mIRC'].includes(flavor)) {
      this.config.flavor = flavor;
    } else {
      throw new Error('Unsupported IRC flavor. Use "HexChat" or "mIRC".');
    }
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

  guessFlavor(rawLog) {
    // parse the first ten lines to determine the flavor
    const lines = rawLog.trim().split('\n').slice(0, 10);
    let result = {
        flavor: 'unknonwn',
        confidence: 0,
        confidenceValues: {
            HexChat: 0,
            mIRC: 0
        }
    }
    lines.forEach(line => {
        if (this.parseHexChatMessage(line) !== null) {
            result.confidenceValues.HexChat++;
        }
        if (this.parseMIRCMessage(line) !== null) {
            result.confidenceValues.mIRC++;
        }
    });
    result.confidenceValues.HexChat = result.confidenceValues.HexChat / lines.length;
    result.confidenceValues.mIRC = result.confidenceValues.mIRC / lines.length;
    // Determine the flavor based on confidence scores
    if (result.confidenceValues.HexChat > result.confidenceValues.mIRC) {
        result.flavor = 'HexChat';
        result.confidence = result.confidenceValues.HexChat;
    } else if (result.confidenceValues.mIRC > result.confidenceValues.HexChat) {
        result.flavor = 'mIRC';
        result.confidence = result.confidenceValues.mIRC;
    } else {
        result.flavor = 'unknown';
    }
    return result;
  }

  parseHexChatMessage(message) {
    message = message.trim();
    // Match timestamp at the start
    const timestampMatch = message.match(/^[^*<]* /);
    if (!timestampMatch) {
        return null;
    }

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
        } else {
          // Not a recognized pattern
          return null;
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
    message = message.trim();

    if (message.startsWith('Session Start: ') || message.startsWith('Session Ident: ') || message.startsWith('Session Close: ')) {
        return {
            timestamp: "[00:00]",
            nick: "*",
            content: message,
            type: 'control',
            raw: message,
        }
    }
    // Check for color codes at the start of the message
    const colorMatch = message.match(/^(\x03\d{2})/);
    const leadingColor = colorMatch ? colorMatch[1] : null;
    
    // If there was a color, remove it for further parsing
    const messageWithoutLeadingColor = leadingColor 
      ? message.substring(leadingColor.length)
      : message;

    // [HH:mm] <nick> message
    // [HH:mm] * nick action
    // [HH:mm] * nick is now known as newNick
    const timestampMatch = messageWithoutLeadingColor.match(/^\[[0-9:]+\] /);
    if (!timestampMatch) {
        return null;
    }

    const timestamp = timestampMatch[0];
    const afterTimestamp = messageWithoutLeadingColor.substring(timestampMatch[0].length).trim();

    let nick = null;
    let content = null;
    let type = null;

    // Pattern 1: Regular message - handle optional mode characters in nick
    const messageMatch = afterTimestamp.match(/^<(?:[@~&%+])?([^>]+)> (.*)$/);
    if (messageMatch) {
      nick = messageMatch[1]; // Use capture group 1 which has the nick without the mode
      content = messageMatch[2];
      type = 'say';
    } else {
      // Pattern 2: Action/control messages
      const actionMatch = afterTimestamp.match(/^\* (?:[@~&%+])?(.+?) (.*)$/);
      if (actionMatch) {
        nick = actionMatch[1];
        content = actionMatch[2];
        
        // Check for known control message patterns
        const isControlMessage = (
          content.match(/^is now known as \S+$/) || // nick change
          content.match(/^sets mode:/) || // mode change
          content.match(/^\(\S+\) has (joined|left) #\S+$/) || // join/leave
          content.match(/^\(\S+\) Quit \(.*\)$/) || // quit
          content.match(/^\(\S+\) has changed the topic to: /) || // topic change
          content.match(/^\(\S+\) has been kicked by \S+ \(.*\)$/) || // kick
          content.match(/^\(\S+\) has been banned from #\S+ by \S+$/) || // ban
          (nick == "Now" && content.match(/^talking in #\S+$/)) || // channel join
          (nick == "Topic" && content.match(/^is /)) || // topic set
          (nick == "Set" && content.match(/^by \S+ on /)) || // topic set by
          (nick == "You" && content.match(/^are now known as \S+$/)) // self nick change
        );

        type = isControlMessage ? 'control' : 'action';

        // For known control messages, set nick to '*' to match HexChat behavior
        if (isControlMessage) {
          content = nick + ' ' + content; // prepend nick to content
          nick = '*';
        }
      } else {
        // Not a recognized pattern
        return null;
      }
    }

    // If we found a leading color code, add it back to the start of the content
    if (leadingColor && content) {
      content = leadingColor + content;
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
    const additionalChatterMap = new Map();

    // First identify players from postencheck
    sections.forEach((section) => {
      if (section.type === 'Postencheck') {
        section.messages.forEach((msg) => {
          if (msg.nick && msg.nick !== '*') {
            playerMap.set(msg.nick, {
              name: msg.nick,
              nicks: new Set([msg.nick])
            });
            if (additionalChatterMap.has(msg.nick)) {
              additionalChatterMap.delete(msg.nick);
            }
          }
        });
      } else {
        // For other sections, add nicknames to additional chatter map
        // This will help us catch players who might not have been in postencheck
        section.messages.forEach((msg) => {
          if (msg.nick && msg.nick !== '*' && !playerMap.has(msg.nick)) {
            additionalChatterMap.set(msg.nick, {
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

            // If found, add both nicks to that player and remove from additional chatters
            if (player) {
              additionalChatterMap.get(oldNick)?.nicks.forEach(nick => player.nicks.add(nick));
              additionalChatterMap.get(newNick)?.nicks.forEach(nick => player.nicks.add(nick));
              // add in case it was not known before. Can happen if someone changed nick before posting
              player.nicks.add(oldNick);
              player.nicks.add(newNick);
              additionalChatterMap.delete(oldNick);
              additionalChatterMap.delete(newNick);
            } else {
              // try again for an additional chatter
              let chatter = null;
              for (const [, c] of additionalChatterMap) {
                if (c.nicks.has(oldNick) || c.nicks.has(newNick)) {
                  chatter = c;
                  break;
                }
              }
              // If found, add both nicks to that chatter
              if (chatter) {
                if (chatter.nicks.has(oldNick)) {
                  additionalChatterMap.get(newNick)?.nicks.forEach(nick => chatter.nicks.add(nick));
                  chatter.nicks.add(newNick);
                  additionalChatterMap.delete(newNick);
                } else if (chatter.nicks.has(newNick)) {
                  additionalChatterMap.get(oldNick)?.nicks.forEach(nick => chatter.nicks.add(nick));
                  chatter.nicks.add(oldNick);
                  additionalChatterMap.delete(oldNick);
                }
              }
            }
          }
        }
      });
    });

    return {
      players: Array.from(playerMap.values()),
      additionalChatters: Array.from(additionalChatterMap.values())
    };
  }
}
